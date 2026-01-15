package com.cinema.dto.request;

import com.cinema.model.Payment;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    
    @NotNull(message = "Booking ID is required")
    private Long bookingId;
    
    @NotNull(message = "Payment method is required")
    private Payment.PaymentMethod paymentMethod;
    
    /**
     * Số điểm thưởng sử dụng để trừ tiền (tùy chọn)
     * 1 điểm = 1.000đ
     */
    private Integer pointsToUse;
}
