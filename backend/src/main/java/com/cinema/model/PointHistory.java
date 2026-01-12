package com.cinema.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity lưu lịch sử điểm thưởng của người dùng
 */
@Entity
@Table(name = "point_histories", indexes = {
    @Index(name = "idx_point_history_user", columnList = "user_id"),
    @Index(name = "idx_point_history_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull(message = "Points cannot be null")
    @Column(nullable = false)
    private Integer points;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private TransactionType transactionType;

    @Column(length = 255)
    private String description;

    @Column(name = "reference_id")
    private Long referenceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type", length = 30)
    private ReferenceType referenceType;

    @Column(name = "balance_after")
    private Integer balanceAfter;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ===== Helper Methods =====

    public boolean isDebit() {
        return points != null && points < 0;
    }

    public boolean isCredit() {
        return points != null && points > 0;
    }

    // ===== Enums =====

    @Getter
    @RequiredArgsConstructor
    public enum TransactionType {
        EARNED("Tích điểm"),
        REDEEMED("Đổi điểm"),
        BONUS("Thưởng"),
        EXPIRED("Hết hạn"),
        ADJUSTED("Điều chỉnh");

        private final String displayName;
    }

    @Getter
    @RequiredArgsConstructor
    public enum ReferenceType {
        BOOKING("Đặt vé"),
        PAYMENT("Thanh toán"),
        VOUCHER("Voucher"),
        COUPON("Coupon"),
        PROMOTION("Khuyến mãi"),
        ADMIN("Admin điều chỉnh");

        private final String displayName;
    }
}
