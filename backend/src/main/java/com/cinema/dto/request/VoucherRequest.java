package com.cinema.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class VoucherRequest {
    @NotBlank(message = "Mã voucher không được để trống")
    private String voucherCode;

    @NotBlank(message = "Mã PIN không được để trống")
    private String pinCode;

    @NotNull(message = "Giá trị không được để trống")
    @DecimalMin(value = "0.0", message = "Giá trị phải lớn hơn hoặc bằng 0")
    private BigDecimal value;

    private String description;

    private LocalDateTime expiryDate;

    @DecimalMin(value = "0.0", message = "Giá trị đơn tối thiểu phải lớn hơn hoặc bằng 0")
    private BigDecimal minPurchaseAmount;
}
