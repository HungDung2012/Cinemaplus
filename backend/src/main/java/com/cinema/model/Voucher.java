package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity Voucher - Mã giảm giá có thể nhập bằng số voucher + PIN
 * Voucher là mã có giá trị cố định (VD: 50,000 VND)
 */
@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "voucher_code", nullable = false, unique = true, length = 20)
    private String voucherCode; // Số voucher (VD: VOC123456789)

    @Column(name = "pin_code", nullable = false, length = 10)
    private String pinCode; // Mã PIN (VD: 1234)

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal value; // Giá trị voucher (VND)

    @Column(length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private VoucherStatus status = VoucherStatus.ACTIVE;

    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;

    @Column(name = "min_purchase_amount", precision = 10, scale = 2)
    private BigDecimal minPurchaseAmount; // Số tiền tối thiểu để sử dụng

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum VoucherStatus {
        ACTIVE,     // Có thể sử dụng
        USED,       // Đã được redeem (gán cho user)
        EXPIRED,    // Hết hạn
        CANCELLED   // Bị hủy
    }
    
    public boolean isValid() {
        return status == VoucherStatus.ACTIVE 
               && (expiryDate == null || expiryDate.isAfter(LocalDateTime.now()));
    }
}
