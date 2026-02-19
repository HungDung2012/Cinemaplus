package com.cinema.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CouponRequest {
    @NotBlank(message = "Mã coupon không được để trống")
    private String couponCode;

    @NotBlank(message = "Mã PIN không được để trống")
    private String pinCode;

    @NotNull(message = "Loại giảm giá không được để trống (PERCENTAGE / FIXED_AMOUNT)")
    private String discountType;

    @NotNull(message = "Giá trị giảm không được để trống")
    @DecimalMin(value = "0.0", message = "Giá trị phải lớn hơn hoặc bằng 0")
    private BigDecimal discountValue;

    private BigDecimal maxDiscountAmount;
    private BigDecimal minPurchaseAmount;
    private String description;
    private Integer usageLimit;

    private LocalDateTime startDate;
    private LocalDateTime expiryDate;

    private String status;
}
