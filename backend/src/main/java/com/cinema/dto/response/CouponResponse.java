package com.cinema.dto.response;

import com.cinema.model.Coupon;
import com.cinema.model.UserCoupon;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO trả về thông tin coupon của người dùng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponResponse {

    private Long id;
    private Long userCouponId;
    private String couponCode;
    private Coupon.DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime expiryDate;
    private BigDecimal minPurchaseAmount;

    // Trạng thái
    private Coupon.CouponStatus couponStatus;
    private UserCoupon.UseStatus useStatus;
    private String statusDisplay;
    private String discountDisplay;

    // Thông tin sử dụng
    private LocalDateTime redeemedAt;
    private LocalDateTime usedAt;
    private Long usedForBookingId;

    // Helper fields
    private Boolean isExpired;
    private Boolean isUsable;
    private Long hoursUntilExpiry;

    /**
     * Factory method để tạo từ UserCoupon entity
     */
    public static CouponResponse fromUserCoupon(UserCoupon userCoupon) {
        Coupon coupon = userCoupon.getCoupon();
        boolean isExpired = coupon.getExpiryDate() != null && 
                           coupon.getExpiryDate().isBefore(LocalDateTime.now());
        boolean isUsable = userCoupon.getStatus() == UserCoupon.UseStatus.AVAILABLE && 
                          coupon.isValid();

        Long hoursUntilExpiry = null;
        if (coupon.getExpiryDate() != null) {
            hoursUntilExpiry = java.time.Duration.between(
                LocalDateTime.now(), coupon.getExpiryDate()
            ).toHours();
        }

        return CouponResponse.builder()
                .id(coupon.getId())
                .userCouponId(userCoupon.getId())
                .couponCode(maskCode(coupon.getCouponCode()))
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .description(coupon.getDescription())
                .startDate(coupon.getStartDate())
                .expiryDate(coupon.getExpiryDate())
                .minPurchaseAmount(coupon.getMinPurchaseAmount())
                .couponStatus(coupon.getStatus())
                .useStatus(userCoupon.getStatus())
                .statusDisplay(getStatusDisplay(userCoupon.getStatus()))
                .discountDisplay(getDiscountDisplay(coupon))
                .redeemedAt(userCoupon.getRedeemedAt())
                .usedAt(userCoupon.getUsedAt())
                .usedForBookingId(userCoupon.getUsedForBookingId())
                .isExpired(isExpired)
                .isUsable(isUsable)
                .hoursUntilExpiry(hoursUntilExpiry)
                .build();
    }

    /**
     * Mask coupon code để bảo mật
     */
    private static String maskCode(String code) {
        if (code == null || code.length() <= 8) {
            return code;
        }
        return code.substring(0, 4) + "****" + code.substring(code.length() - 4);
    }

    private static String getStatusDisplay(UserCoupon.UseStatus status) {
        return switch (status) {
            case AVAILABLE -> "Có thể sử dụng";
            case USED -> "Đã sử dụng";
            case EXPIRED -> "Đã hết hạn";
        };
    }

    private static String getDiscountDisplay(Coupon coupon) {
        if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
            return "Giảm " + coupon.getDiscountValue().intValue() + "%";
        } else {
            return "Giảm " + String.format("%,.0f", coupon.getDiscountValue()) + "đ";
        }
    }
}
