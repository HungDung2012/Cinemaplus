package com.cinema.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa kết quả trả về sau khi tạo URL thanh toán.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentGatewayResponse {
    private String paymentUrl;      // URL redirect đến cổng thanh toán
    private String transactionId;   // Mã giao dịch từ cổng (nếu có)
    private boolean success;
    private String message;

    public static PaymentGatewayResponse success(String paymentUrl, String transactionId) {
        return PaymentGatewayResponse.builder()
                .paymentUrl(paymentUrl)
                .transactionId(transactionId)
                .success(true)
                .message("Payment URL created successfully")
                .build();
    }

    public static PaymentGatewayResponse error(String message) {
        return PaymentGatewayResponse.builder()
                .success(false)
                .message(message)
                .build();
    }
}
