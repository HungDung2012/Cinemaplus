package com.cinema.dto.response;

import com.cinema.model.UserCoupon;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCouponDto {
    private Long id;
    private Long couponId;
    private String code;
    private String description;
    private UserCoupon.UseStatus status;
    private LocalDateTime redeemedAt;
    private LocalDateTime usedAt;
}
