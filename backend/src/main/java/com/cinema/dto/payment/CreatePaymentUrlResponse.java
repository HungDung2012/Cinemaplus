package com.cinema.dto.payment;

import com.cinema.model.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO trả về cho Frontend sau khi tạo Payment và URL thanh toán.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentUrlResponse {
    private Long paymentId;
    private String paymentUrl;          // URL redirect đến cổng thanh toán
    private String bookingCode;
    private BigDecimal amount;
    private Payment.PaymentMethod paymentMethod;
    private Payment.PaymentStatus status;
    private LocalDateTime createdAt;
}
