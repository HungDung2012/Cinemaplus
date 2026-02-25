package com.cinema.dto.payment;

import com.cinema.model.Payment;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho request tạo URL thanh toán từ Frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentUrlRequest {

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    @NotNull(message = "Payment method is required")
    private Payment.PaymentMethod paymentMethod;

    /**
     * Số điểm thưởng sử dụng để trừ tiền (tùy chọn).
     * 1 điểm = 1.000đ
     */
    @jakarta.validation.constraints.Min(value = 0, message = "Points must be non-negative")
    private Integer pointsToUse;
}
