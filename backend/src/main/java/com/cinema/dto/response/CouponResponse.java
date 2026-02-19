package com.cinema.dto.response;

import com.cinema.model.Coupon.CouponStatus;
import com.cinema.model.Coupon.DiscountType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CouponResponse {
    private Long id;
    private String couponCode;
    private String pinCode;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minPurchaseAmount;
    private String description;
    private CouponStatus status;
    private Integer usageLimit;
    private Integer usageCount;
    private LocalDateTime startDate;
    private LocalDateTime expiryDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CouponResponse fromCoupon(com.cinema.model.Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .couponCode(coupon.getCouponCode())
                .pinCode(coupon.getPinCode())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .minPurchaseAmount(coupon.getMinPurchaseAmount())
                .description(coupon.getDescription())
                .status(coupon.getStatus())
                .usageLimit(coupon.getUsageLimit())
                .usageCount(coupon.getUsageCount())
                .startDate(coupon.getStartDate())
                .expiryDate(coupon.getExpiryDate())
                .createdAt(coupon.getCreatedAt())
                .updatedAt(coupon.getUpdatedAt())
                .build();
    }

    public static CouponResponse fromUserCoupon(com.cinema.model.UserCoupon userCoupon) {
        com.cinema.model.Coupon coupon = userCoupon.getCoupon();
        return CouponResponse.builder()
                .id(coupon.getId()) // Or userCoupon.getId() if separate DTO needed? Usually we return Coupon
                                    // details.
                .couponCode(coupon.getCouponCode())
                .pinCode(coupon.getPinCode())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .minPurchaseAmount(coupon.getMinPurchaseAmount())
                .description(coupon.getDescription())
                .status(coupon.getStatus())
                .usageLimit(coupon.getUsageLimit())
                .usageCount(coupon.getUsageCount())
                .startDate(coupon.getStartDate())
                .expiryDate(coupon.getExpiryDate())
                .createdAt(coupon.getCreatedAt())
                .updatedAt(coupon.getUpdatedAt())
                .build();
    }
}
