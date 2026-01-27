package com.cinema.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherRequest {

    @NotBlank(message = "Voucher code is required")
    @Size(min = 3, max = 20, message = "Voucher code must be between 3 and 20 characters")
    private String voucherCode;

    @NotBlank(message = "PIN code is required")
    @Size(min = 4, max = 10, message = "PIN code must be between 4 and 10 characters")
    private String pinCode;

    @NotNull(message = "Value is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Value must be greater than 0")
    private BigDecimal value;

    private String description;

    @Future(message = "Expiry date must be in the future")
    private LocalDateTime expiryDate;

    @DecimalMin(value = "0.0", message = "Minimum purchase amount must be non-negative")
    private BigDecimal minPurchaseAmount;
}
