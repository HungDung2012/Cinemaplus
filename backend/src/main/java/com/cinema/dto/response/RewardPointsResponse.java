package com.cinema.dto.response;

import com.cinema.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO trả về thông tin điểm thưởng tổng quan
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RewardPointsResponse {

    private Integer currentPoints;
    private Integer totalPointsEarned;
    private Integer totalPointsRedeemed;
    private Integer pointsExpiringSoon; // Điểm sắp hết hạn trong 30 ngày

    private User.MembershipLevel membershipLevel;
    private String membershipLevelDisplay;

    // Thống kê membership
    private BigDecimal totalSpending;
    private Integer progressToNextLevel; // Phần trăm
    private BigDecimal amountToNextLevel;
    private String nextLevelName;

    // Quy đổi điểm
    private Integer pointsPerTransaction; // Số điểm trung bình mỗi giao dịch
    private String pointConversionRate; // VD: "10.000đ = 1 điểm"
}
