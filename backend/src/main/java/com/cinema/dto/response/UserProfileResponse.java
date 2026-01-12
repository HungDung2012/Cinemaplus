package com.cinema.dto.response;

import com.cinema.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO trả về thông tin hồ sơ người dùng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private String avatar;

    // Thông tin mở rộng
    private User.Gender gender;
    private LocalDate dateOfBirth;

    // Membership & Rewards
    private User.MembershipLevel membershipLevel;
    private BigDecimal totalSpending;
    private Integer currentPoints;
    private Integer totalPointsEarned;

    // Thống kê
    private Integer totalBookings;
    private Integer totalVouchers;
    private Integer totalCoupons;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Tính toán phần trăm tiến độ lên hạng tiếp theo
     */
    private Integer progressToNextLevel;

    /**
     * Số tiền còn thiếu để lên hạng tiếp theo
     */
    private BigDecimal amountToNextLevel;

    /**
     * Tên hạng tiếp theo
     */
    private String nextLevelName;
}
