package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity Coupon - Mã giảm giá theo phần trăm hoặc giá trị cố định
 * Khác với Voucher, Coupon có thể dùng nhiều lần (có usage limit)
 */
@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "coupon_code", nullable = false, unique = true, length = 20)
    private String couponCode; // Mã coupon (VD: CPN123456)

    @Column(name = "pin_code", nullable = false, length = 10)
    private String pinCode; // Mã PIN

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue; // Giá trị giảm (% hoặc VND)

    @Column(name = "max_discount_amount", precision = 10, scale = 2)
    private BigDecimal maxDiscountAmount; // Giảm tối đa (cho loại PERCENTAGE)

    @Column(name = "min_purchase_amount", precision = 10, scale = 2)
    private BigDecimal minPurchaseAmount; // Đơn hàng tối thiểu

    @Column(length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CouponStatus status = CouponStatus.ACTIVE;

    @Column(name = "usage_limit")
    private Integer usageLimit; // Số lần dùng tối đa (null = không giới hạn)

    @Column(name = "usage_count")
    @Builder.Default
    private Integer usageCount = 0; // Số lần đã sử dụng

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum DiscountType {
        PERCENTAGE,  // Giảm theo %
        FIXED_AMOUNT // Giảm số tiền cố định
    }

    public enum CouponStatus {
        ACTIVE,
        INACTIVE,
        EXPIRED
    }
    
    public boolean isValid() {
        if (status != CouponStatus.ACTIVE) return false;
        if (expiryDate != null && expiryDate.isBefore(LocalDateTime.now())) return false;
        if (startDate != null && startDate.isAfter(LocalDateTime.now())) return false;
        if (usageLimit != null && usageCount >= usageLimit) return false;
        return true;
    }
}
