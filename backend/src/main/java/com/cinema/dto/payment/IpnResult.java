package com.cinema.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO chứa kết quả xử lý IPN (Instant Payment Notification) từ cổng thanh toán.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IpnResult {
    private boolean success;
    private String transactionId;   // Mã giao dịch từ cổng thanh toán
    private String orderId;         // Mã đơn hàng (bookingCode)
    private BigDecimal amount;
    private String responseCode;    // Mã phản hồi từ cổng
    private String message;

    public static IpnResult success(String transactionId, String orderId, BigDecimal amount) {
        return IpnResult.builder()
                .success(true)
                .transactionId(transactionId)
                .orderId(orderId)
                .amount(amount)
                .responseCode("00")
                .message("Giao dịch thành công")
                .build();
    }

    public static IpnResult failed(String orderId, String responseCode, String message) {
        return IpnResult.builder()
                .success(false)
                .orderId(orderId)
                .responseCode(responseCode)
                .message(message)
                .build();
    }
}
