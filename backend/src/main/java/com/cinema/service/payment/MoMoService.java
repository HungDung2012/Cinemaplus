package com.cinema.service.payment;

import com.cinema.dto.payment.IpnResult;
import com.cinema.dto.payment.PaymentGatewayRequest;
import com.cinema.dto.payment.PaymentGatewayResponse;
import com.cinema.model.Payment;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * MoMo Payment Gateway Implementation.
 * 
 * Flow:
 * 1. Backend gọi MoMo API tạo payUrl → redirect user đến MoMo
 * 2. User thanh toán → MoMo gọi IPN URL (webhook) + redirect returnUrl
 * 3. Backend verify signature (HMAC_SHA256) → cập nhật Payment
 * 
 * Docs: https://developers.momo.vn/v3/docs/payment/api/payment-api/create
 */
@Service
@Slf4j
public class MoMoService implements PaymentGatewayService {

    @Value("${momo.partner-code}")
    private String partnerCode;

    @Value("${momo.access-key}")
    private String accessKey;

    @Value("${momo.secret-key}")
    private String secretKey;

    @Value("${momo.api-url:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String momoApiUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Override
    public Payment.PaymentMethod getPaymentMethod() {
        return Payment.PaymentMethod.MOMO;
    }

    @Override
    public PaymentGatewayResponse createPaymentUrl(PaymentGatewayRequest request) {
        try {
            String orderId = request.getOrderId();
            String requestId = UUID.randomUUID().toString();
            long amount = request.getAmount().longValue();
            String orderInfo = request.getOrderInfo();
            String returnUrl = request.getReturnUrl();
            String ipnUrl = request.getIpnUrl();
            String requestType = "payWithMethod"; // MoMo v3: payWithMethod hỗ trợ QR + app
            String extraData = Base64.getEncoder().encodeToString(
                    ("{\"paymentId\":" + request.getPaymentId() + "}").getBytes(StandardCharsets.UTF_8));

            // Tạo raw signature string theo format MoMo v2/v3
            String rawSignature = String.format(
                    "accessKey=%s&amount=%d&extraData=%s&ipnUrl=%s&orderId=%s&orderInfo=%s&partnerCode=%s&redirectUrl=%s&requestId=%s&requestType=%s",
                    accessKey, amount, extraData, ipnUrl, orderId, orderInfo, partnerCode, returnUrl, requestId, requestType
            );

            // HMAC_SHA256 signature
            String signature = hmacSHA256(secretKey, rawSignature);

            // Build request body
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("partnerCode", partnerCode);
            body.put("partnerName", "Cinema Booking");
            body.put("storeId", partnerCode);
            body.put("requestId", requestId);
            body.put("amount", amount);
            body.put("orderId", orderId);
            body.put("orderInfo", orderInfo);
            body.put("redirectUrl", returnUrl);
            body.put("ipnUrl", ipnUrl);
            body.put("lang", "vi");
            body.put("requestType", requestType);
            body.put("autoCapture", true);
            body.put("extraData", extraData);
            body.put("signature", signature);

            String jsonBody = objectMapper.writeValueAsString(body);
            log.debug("MoMo request body: {}", jsonBody);

            // Gọi MoMo API
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(momoApiUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            @SuppressWarnings("unchecked")
            Map<String, Object> responseMap = objectMapper.readValue(httpResponse.body(), Map.class);
            
            int resultCode = (int) responseMap.getOrDefault("resultCode", -1);
            if (resultCode == 0) {
                String payUrl = (String) responseMap.get("payUrl");
                log.info("MoMo payment URL created for order: {}", orderId);
                return PaymentGatewayResponse.success(payUrl, requestId);
            } else {
                String message = (String) responseMap.getOrDefault("message", "Unknown error");
                log.warn("MoMo create payment failed: code={}, msg={}", resultCode, message);
                return PaymentGatewayResponse.error("MoMo lỗi: " + message);
            }
        } catch (Exception e) {
            log.error("Error creating MoMo payment URL: {}", e.getMessage(), e);
            return PaymentGatewayResponse.error("Không thể tạo URL thanh toán MoMo: " + e.getMessage());
        }
    }

    /**
     * Xử lý IPN callback từ MoMo.
     * QUAN TRỌNG: Verify signature HMAC_SHA256 trước.
     */
    @Override
    public IpnResult processIpn(Map<String, String> params) {
        String orderId = params.get("orderId");

        // Step 1: Verify chữ ký bảo mật
        if (!verifySignature(params)) {
            log.warn("MoMo IPN invalid signature for order: {}", orderId);
            return IpnResult.failed(orderId, "97", "Invalid signature");
        }

        String resultCodeStr = params.get("resultCode");
        int resultCode = Integer.parseInt(resultCodeStr);
        String transId = params.get("transId");
        String amountStr = params.get("amount");
        BigDecimal amount = new BigDecimal(amountStr);

        // MoMo: resultCode == 0 nghĩa là thành công
        if (resultCode == 0) {
            log.info("MoMo IPN success: order={}, transId={}, amount={}", orderId, transId, amount);
            return IpnResult.success(transId, orderId, amount);
        } else {
            String message = params.getOrDefault("message", "Giao dịch thất bại");
            log.warn("MoMo IPN failed: order={}, code={}, msg={}", orderId, resultCode, message);
            return IpnResult.failed(orderId, resultCodeStr, message);
        }
    }

    /**
     * Verify HMAC_SHA256 signature từ MoMo IPN.
     */
    @Override
    public boolean verifySignature(Map<String, String> params) {
        try {
            String receivedSignature = params.get("signature");
            if (receivedSignature == null || receivedSignature.isEmpty()) {
                return false;
            }

            // Build raw signature string theo đúng format MoMo
            String rawSignature = String.format(
                    "accessKey=%s&amount=%s&extraData=%s&message=%s&orderId=%s&orderInfo=%s&orderType=%s&partnerCode=%s&payType=%s&requestId=%s&responseTime=%s&resultCode=%s&transId=%s",
                    accessKey,
                    params.getOrDefault("amount", ""),
                    params.getOrDefault("extraData", ""),
                    params.getOrDefault("message", ""),
                    params.getOrDefault("orderId", ""),
                    params.getOrDefault("orderInfo", ""),
                    params.getOrDefault("orderType", ""),
                    partnerCode,
                    params.getOrDefault("payType", ""),
                    params.getOrDefault("requestId", ""),
                    params.getOrDefault("responseTime", ""),
                    params.getOrDefault("resultCode", ""),
                    params.getOrDefault("transId", "")
            );

            String calculatedSignature = hmacSHA256(secretKey, rawSignature);
            boolean valid = calculatedSignature.equalsIgnoreCase(receivedSignature);
            
            if (!valid) {
                log.warn("MoMo signature mismatch for order: {}", params.get("orderId"));
            }
            return valid;
        } catch (Exception e) {
            log.error("Error verifying MoMo signature: {}", e.getMessage(), e);
            return false;
        }
    }

    // ==================== PRIVATE HELPERS ====================

    private String hmacSHA256(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
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
            throw new RuntimeException("Error computing HMAC_SHA256", e);
        }
    }
}
