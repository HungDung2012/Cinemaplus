package com.cinema.service.payment;

import com.cinema.dto.payment.IpnResult;
import com.cinema.dto.payment.PaymentGatewayRequest;
import com.cinema.dto.payment.PaymentGatewayResponse;
import com.cinema.model.Payment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * VNPay Payment Gateway Implementation.
 * 
 * Flow:
 * 1. Backend tạo URL chứa params + HMAC_SHA512 signature → redirect user
 * 2. User thanh toán trên VNPay → VNPay gọi IPN URL (webhook)
 * 3. Backend verify signature → cập nhật trạng thái Payment
 * 
 * Docs: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 */
@Service
@Slf4j
public class VNPayService implements PaymentGatewayService {

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.url}")
    private String vnpayUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    private static final String VNP_VERSION = "2.1.0";
    private static final String VNP_COMMAND = "pay";
    private static final String ORDER_TYPE = "other";
    private static final DateTimeFormatter VNP_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    @Override
    public Payment.PaymentMethod getPaymentMethod() {
        return Payment.PaymentMethod.VNPAY;
    }

    @Override
    public PaymentGatewayResponse createPaymentUrl(PaymentGatewayRequest request) {
        try {
            // VNPay yêu cầu amount * 100 (đơn vị: đồng, không thập phân)
            long vnpAmount = request.getAmount().multiply(new BigDecimal("100")).longValue();
            String vnpTxnRef = request.getOrderId(); // bookingCode làm mã tham chiếu
            String createDate = LocalDateTime.now().format(VNP_DATE_FORMAT);
            String expireDate = LocalDateTime.now().plusMinutes(15).format(VNP_DATE_FORMAT);

            // Build sorted params theo yêu cầu VNPay
            Map<String, String> params = new TreeMap<>();
            params.put("vnp_Version", VNP_VERSION);
            params.put("vnp_Command", VNP_COMMAND);
            params.put("vnp_TmnCode", tmnCode);
            params.put("vnp_Amount", String.valueOf(vnpAmount));
            params.put("vnp_CurrCode", "VND");
            params.put("vnp_TxnRef", vnpTxnRef);
            params.put("vnp_OrderInfo", request.getOrderInfo());
            params.put("vnp_OrderType", ORDER_TYPE);
            params.put("vnp_Locale", "vn");
            params.put("vnp_ReturnUrl", request.getReturnUrl() != null ? request.getReturnUrl() : returnUrl);
            params.put("vnp_IpAddr", request.getClientIpAddress() != null ? request.getClientIpAddress() : "127.0.0.1");
            params.put("vnp_CreateDate", createDate);
            params.put("vnp_ExpireDate", expireDate);

            // Tạo query string + hash signature (HMAC_SHA512)
            String queryString = buildQueryString(params);
            String secureHash = hmacSHA512(hashSecret, queryString);
            String paymentUrl = vnpayUrl + "?" + queryString + "&vnp_SecureHash=" + secureHash;

            log.info("VNPay payment URL created for order: {}", vnpTxnRef);
            return PaymentGatewayResponse.success(paymentUrl, vnpTxnRef);
        } catch (Exception e) {
            log.error("Error creating VNPay payment URL: {}", e.getMessage(), e);
            return PaymentGatewayResponse.error("Không thể tạo URL thanh toán VNPay: " + e.getMessage());
        }
    }

    /**
     * Xử lý IPN callback từ VNPay.
     * QUAN TRỌNG: Phải verify signature TRƯỚC khi tin tưởng dữ liệu.
     */
    @Override
    public IpnResult processIpn(Map<String, String> params) {
        String vnpTxnRef = params.get("vnp_TxnRef");
        
        // Step 1: Verify chữ ký bảo mật
        if (!verifySignature(params)) {
            log.warn("VNPay IPN invalid signature for order: {}", vnpTxnRef);
            return IpnResult.failed(vnpTxnRef, "97", "Invalid signature");
        }

        String responseCode = params.get("vnp_ResponseCode");
        String transactionNo = params.get("vnp_TransactionNo");
        String amountStr = params.get("vnp_Amount");
        
        // VNPay trả amount * 100, cần chia lại
        BigDecimal amount = new BigDecimal(amountStr).divide(new BigDecimal("100"));

        // Step 2: Kiểm tra mã phản hồi (00 = thành công)
        if ("00".equals(responseCode)) {
            log.info("VNPay IPN success: order={}, txn={}, amount={}", vnpTxnRef, transactionNo, amount);
            return IpnResult.success(transactionNo, vnpTxnRef, amount);
        } else {
            String message = getVnpayResponseMessage(responseCode);
            log.warn("VNPay IPN failed: order={}, code={}, msg={}", vnpTxnRef, responseCode, message);
            return IpnResult.failed(vnpTxnRef, responseCode, message);
        }
    }

    /**
     * Verify HMAC_SHA512 signature từ VNPay.
     * So sánh hash tính được từ params với vnp_SecureHash gửi về.
     */
    @Override
    public boolean verifySignature(Map<String, String> params) {
        try {
            String vnpSecureHash = params.get("vnp_SecureHash");
            if (vnpSecureHash == null || vnpSecureHash.isEmpty()) {
                return false;
            }

            // Loại bỏ vnp_SecureHash và vnp_SecureHashType khỏi params trước khi hash
            Map<String, String> sortedParams = new TreeMap<>(params);
            sortedParams.remove("vnp_SecureHash");
            sortedParams.remove("vnp_SecureHashType");

            String queryString = buildQueryString(sortedParams);
            String calculatedHash = hmacSHA512(hashSecret, queryString);

            boolean valid = calculatedHash.equalsIgnoreCase(vnpSecureHash);
            if (!valid) {
                log.warn("VNPay signature mismatch. Expected: {}, Got: {}", calculatedHash, vnpSecureHash);
            }
            return valid;
        } catch (Exception e) {
            log.error("Error verifying VNPay signature: {}", e.getMessage(), e);
            return false;
        }
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Build query string từ sorted params (URL-encoded).
     */
    private String buildQueryString(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                if (sb.length() > 0) sb.append("&");
                sb.append(URLEncoder.encode(entry.getKey(), StandardCharsets.US_ASCII))
                  .append("=")
                  .append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII));
            }
        }
        return sb.toString();
    }

    /**
     * HMAC_SHA512 hash — thuật toán bảo mật VNPay sử dụng.
     */
    private String hmacSHA512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error computing HMAC_SHA512", e);
        }
    }

    /**
     * Map mã lỗi VNPay sang thông báo tiếng Việt.
     */
    private String getVnpayResponseMessage(String code) {
        return switch (code) {
            case "00" -> "Giao dịch thành công";
            case "07" -> "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên hệ VNPay)";
            case "09" -> "Thẻ/Tài khoản chưa đăng ký InternetBanking";
            case "10" -> "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần";
            case "11" -> "Đã hết hạn chờ thanh toán";
            case "12" -> "Thẻ/Tài khoản bị khóa";
            case "13" -> "Nhập sai mật khẩu xác thực (OTP)";
            case "24" -> "Khách hàng hủy giao dịch";
            case "51" -> "Tài khoản không đủ số dư";
            case "65" -> "Tài khoản đã vượt quá hạn mức giao dịch trong ngày";
            case "75" -> "Ngân hàng thanh toán đang bảo trì";
            case "79" -> "Nhập sai mật khẩu thanh toán quá số lần quy định";
            default -> "Giao dịch thất bại (mã: " + code + ")";
        };
    }
}
