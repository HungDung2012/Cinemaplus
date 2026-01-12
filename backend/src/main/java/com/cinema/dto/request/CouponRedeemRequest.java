package com.cinema.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO để nhập mã coupon và PIN
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponRedeemRequest {

    @NotBlank(message = "Mã coupon không được để trống")
    private String couponCode;

    @NotBlank(message = "Mã PIN không được để trống")
    private String pinCode;
}
