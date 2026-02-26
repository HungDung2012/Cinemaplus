package com.cinema.controller;

import com.cinema.dto.payment.CreatePaymentUrlRequest;
import com.cinema.dto.payment.CreatePaymentUrlResponse;
import com.cinema.dto.request.PaymentRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.PaymentResponse;
import com.cinema.service.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {
    
    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;

    // ==================== PAYMENT GATEWAY APIs ====================

    /**
     * Tạo Payment + URL thanh toán (VNPay/MoMo/ZaloPay).
     * Frontend gọi API này → nhận paymentUrl → redirect user đến cổng thanh toán.
     */
    @PostMapping("/create-payment-url")
    public ResponseEntity<ApiResponse<CreatePaymentUrlResponse>> createPaymentUrl(
            @Valid @RequestBody CreatePaymentUrlRequest request,
            HttpServletRequest httpRequest) {
        
        String clientIp = getClientIpAddress(httpRequest);
        CreatePaymentUrlResponse response = paymentService.createPaymentWithGateway(request, clientIp);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment URL created successfully", response));
    }

    /**
     * IPN Webhook cho VNPay.
     * VNPay gọi GET request với query params chứa kết quả giao dịch.
     * Endpoint này PHẢI public (không cần auth) vì cổng thanh toán gọi server-to-server.
     */
    @GetMapping("/ipn/vnpay")
    public ResponseEntity<Map<String, Object>> vnpayIpn(@RequestParam Map<String, String> params) {
        log.info("VNPay IPN received: {}", params.get("vnp_TxnRef"));
        Map<String, Object> result = paymentService.handleIpn("vnpay", params);
        return ResponseEntity.ok(result);
    }

    /**
     * IPN Webhook cho MoMo.
     * MoMo gọi POST request với JSON body chứa kết quả giao dịch.
     */
    @PostMapping("/ipn/momo")
    public ResponseEntity<Map<String, Object>> momoIpn(@RequestBody Map<String, Object> body) {
        log.info("MoMo IPN received: orderId={}", body.get("orderId"));
        // Convert tất cả values sang String để xử lý thống nhất
        Map<String, String> params = new HashMap<>();
        body.forEach((key, value) -> params.put(key, value != null ? value.toString() : ""));
        Map<String, Object> result = paymentService.handleIpn("momo", params);
        return ResponseEntity.ok(result);
    }

    /**
     * IPN Webhook (callback) cho ZaloPay.
     * ZaloPay gọi POST request với JSON body: { data, mac, type }.
     */
    @PostMapping("/ipn/zalopay")
    public ResponseEntity<Map<String, Object>> zalopayIpn(@RequestBody Map<String, Object> body) {
        log.info("ZaloPay callback received");
        Map<String, String> params = new HashMap<>();
        body.forEach((key, value) -> params.put(key, value != null ? value.toString() : ""));
        Map<String, Object> result = paymentService.handleIpn("zalopay", params);
        
        // ZaloPay yêu cầu response format: { return_code, return_message }
        Map<String, Object> zalopayResponse = new HashMap<>();
        zalopayResponse.put("return_code", "00".equals(result.get("RspCode")) ? 1 : 2);
        zalopayResponse.put("return_message", result.get("Message"));
        return ResponseEntity.ok(zalopayResponse);
    }

    /**
     * Lấy trạng thái thanh toán theo bookingCode.
     * Frontend gọi khi redirect về từ cổng thanh toán để check kết quả.
     */
    @GetMapping("/status/{bookingCode}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentStatus(@PathVariable String bookingCode) {
        PaymentResponse payment = paymentService.getPaymentByBookingCode(bookingCode);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    // ==================== LEGACY APIs (giữ tương thích) ====================

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(@Valid @RequestBody PaymentRequest request) {
        PaymentResponse payment = paymentService.createPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment created successfully", payment));
    }
    
    @PostMapping("/{id}/process")
    public ResponseEntity<ApiResponse<PaymentResponse>> processPayment(@PathVariable Long id) {
        PaymentResponse payment = paymentService.processPayment(id);
        return ResponseEntity.ok(ApiResponse.success("Payment processed successfully", payment));
    }
    
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByBookingId(@PathVariable Long bookingId) {
        PaymentResponse payment = paymentService.getPaymentByBookingId(bookingId);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    // ==================== UTILS ====================

    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // Lấy IP đầu tiên nếu có nhiều proxy
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
