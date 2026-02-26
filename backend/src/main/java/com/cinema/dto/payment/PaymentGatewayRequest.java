package com.cinema.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO chứa thông tin cần thiết để tạo URL thanh toán từ cổng thanh toán.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentGatewayRequest {
    private Long paymentId;
    private String orderId;         // bookingCode dùng làm mã đơn hàng
    private BigDecimal amount;
    private String orderInfo;       // Mô tả đơn hàng
    private String returnUrl;       // URL frontend redirect sau khi thanh toán
    private String ipnUrl;          // URL backend nhận IPN callback
    private String clientIpAddress; // IP người dùng (VNPay yêu cầu)
}
