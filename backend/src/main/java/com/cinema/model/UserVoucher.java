package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity liên kết User với Voucher đã redeem
 * Lưu trữ voucher mà người dùng đã nhập thành công
 */
@Entity
@Table(name = "user_vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id", nullable = false)
    private Voucher voucher;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UseStatus status = UseStatus.AVAILABLE;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "used_for_booking_id")
    private Long usedForBookingId; // Booking ID mà voucher được sử dụng

    @CreationTimestamp
    @Column(name = "redeemed_at", updatable = false)
    private LocalDateTime redeemedAt; // Thời điểm nhập voucher

    public enum UseStatus {
        AVAILABLE,  // Có thể sử dụng
        USED,       // Đã sử dụng cho booking
        EXPIRED     // Hết hạn
    }
}
