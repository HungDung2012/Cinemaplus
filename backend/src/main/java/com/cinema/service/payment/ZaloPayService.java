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
import java.time.Instant;
import java.util.*;

/**
 * ZaloPay Payment Gateway Implementation.
 * 
 * Flow:
 * 1. Backend gọi ZaloPay API tạo order → lấy order_url redirect user
 * 2. User thanh toán → ZaloPay gọi callback URL (webhook)
 * 3. Backend verify signature (HMAC_SHA256 trên data field) → cập nhật Payment
 * 
 * Docs: https://docs.zalopay.vn/v2/general/overview.html
 */
@Service
@Slf4j
public class ZaloPayService implements PaymentGatewayService {

    @Value("${zalopay.app-id}")
    private String appId;

    @Value("${zalopay.key1}")
    private String key1;

    @Value("${zalopay.key2}")
    private String key2;

    @Value("${zalopay.api-url:https://sb-openapi.zalopay.vn/v2/create}")
    private String zaloPayApiUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Override
    public Payment.PaymentMethod getPaymentMethod() {
        return Payment.PaymentMethod.ZALOPAY;
    }

    @Override
    public PaymentGatewayResponse createPaymentUrl(PaymentGatewayRequest request) {
        try {
            long appTime = Instant.now().toEpochMilli();
            String appTransId = generateAppTransId();
            long amount = request.getAmount().longValue();
            String description = request.getOrderInfo();
            String callbackUrl = request.getIpnUrl();

            // embed_data chứa thông tin redirect
            Map<String, String> embedData = new LinkedHashMap<>();
            embedData.put("redirecturl", request.getReturnUrl());
            embedData.put("orderId", request.getOrderId());
            String embedDataJson = objectMapper.writeValueAsString(embedData);

            // item: mảng trống (ZaloPay yêu cầu)
            String item = "[]";

            // Tạo raw data để HMAC: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
            String rawData = String.format("%s|%s|%s|%d|%d|%s|%s",
                    appId, appTransId, "cinema_user", amount, appTime, embedDataJson, item);

            String mac = hmacSHA256(key1, rawData);

            // Build request body (form-urlencoded cho ZaloPay)
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("app_id", Integer.parseInt(appId));
            body.put("app_trans_id", appTransId);
            body.put("app_user", "cinema_user");
            body.put("app_time", appTime);
            body.put("amount", amount);
            body.put("description", description);
            body.put("embed_data", embedDataJson);
            body.put("item", item);
            body.put("callback_url", callbackUrl);
            body.put("mac", mac);
            body.put("bank_code", ""); // để trống = user chọn trên ZaloPay

            String jsonBody = objectMapper.writeValueAsString(body);
            log.debug("ZaloPay request body: {}", jsonBody);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(zaloPayApiUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            @SuppressWarnings("unchecked")
            Map<String, Object> responseMap = objectMapper.readValue(httpResponse.body(), Map.class);

            int returnCode = (int) responseMap.getOrDefault("return_code", -1);
            if (returnCode == 1) {
                String orderUrl = (String) responseMap.get("order_url");
                log.info("ZaloPay payment URL created for order: {}, appTransId: {}", request.getOrderId(), appTransId);
                return PaymentGatewayResponse.success(orderUrl, appTransId);
            } else {
                String message = (String) responseMap.getOrDefault("return_message", "Unknown error");
                log.warn("ZaloPay create order failed: code={}, msg={}", returnCode, message);
                return PaymentGatewayResponse.error("ZaloPay lỗi: " + message);
            }
        } catch (Exception e) {
            log.error("Error creating ZaloPay payment URL: {}", e.getMessage(), e);
            return PaymentGatewayResponse.error("Không thể tạo URL thanh toán ZaloPay: " + e.getMessage());
        }
    }

    /**
     * Xử lý callback từ ZaloPay.
     * ZaloPay gửi POST body JSON: { data, mac, type }
     * - data: JSON string chứa thông tin giao dịch
     * - mac: HMAC_SHA256(key2, data) — dùng key2 cho callback
     */
    @Override
    public IpnResult processIpn(Map<String, String> params) {
        String dataStr = params.get("data");
        
        // Step 1: Verify signature dùng key2
        if (!verifySignature(params)) {
            log.warn("ZaloPay callback invalid signature");
            return IpnResult.failed(null, "97", "Invalid signature");
        }

        try {
            // Parse data JSON
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(dataStr, Map.class);
            
            String appTransId = (String) data.get("app_trans_id");
            Number amountNum = (Number) data.get("amount");
            BigDecimal amount = new BigDecimal(amountNum.toString());
            String zpTransId = String.valueOf(data.get("zp_trans_id"));

            // Lấy orderId từ embed_data
            String embedDataStr = (String) data.get("embed_data");
            @SuppressWarnings("unchecked")
            Map<String, String> embedData = objectMapper.readValue(embedDataStr, Map.class);
            String orderId = embedData.getOrDefault("orderId", appTransId);

            log.info("ZaloPay callback success: orderId={}, zpTransId={}, amount={}", orderId, zpTransId, amount);
            return IpnResult.success(zpTransId, orderId, amount);
        } catch (Exception e) {
            log.error("Error processing ZaloPay callback data: {}", e.getMessage(), e);
            return IpnResult.failed(null, "-1", "Error processing callback: " + e.getMessage());
        }
    }

    /**
     * Verify HMAC_SHA256 signature từ ZaloPay callback.
     * ZaloPay dùng key2 cho callback verification: mac = HMAC_SHA256(key2, data)
     */
    @Override
    public boolean verifySignature(Map<String, String> params) {
        try {
            String dataStr = params.get("data");
            String receivedMac = params.get("mac");
            
            if (dataStr == null || receivedMac == null) {
                return false;
            }

            String calculatedMac = hmacSHA256(key2, dataStr);
            boolean valid = calculatedMac.equalsIgnoreCase(receivedMac);
            
            if (!valid) {
                log.warn("ZaloPay signature mismatch");
            }
            return valid;
        } catch (Exception e) {
            log.error("Error verifying ZaloPay signature: {}", e.getMessage(), e);
            return false;
        }
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Tạo app_trans_id theo format ZaloPay: yyMMdd_uniqueId
     */
    private String generateAppTransId() {
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyMMdd");
        String datePart = sdf.format(new Date());
        String uniquePart = UUID.randomUUID().toString().substring(0, 8);
        return datePart + "_" + uniquePart;
    }

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
