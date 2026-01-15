package com.cinema.service;

import com.cinema.dto.response.PointHistoryResponse;
import com.cinema.dto.response.RewardPointsResponse;
import com.cinema.exception.InsufficientPointsException;
import com.cinema.exception.ProfileUpdateException;
import com.cinema.model.PointHistory;
import com.cinema.model.User;
import com.cinema.repository.PointHistoryRepository;
import com.cinema.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class RewardPointService {

    private final UserRepository userRepository;
    private final PointHistoryRepository pointHistoryRepository;

    // Ngưỡng membership
    private static final BigDecimal VIP_THRESHOLD = new BigDecimal("5000000");
    private static final BigDecimal PLATINUM_THRESHOLD = new BigDecimal("15000000");

    /**
     * Lấy thông tin điểm thưởng tổng quan của user
     */
    @Transactional(readOnly = true)
    public RewardPointsResponse getRewardPoints(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ProfileUpdateException("Không tìm thấy người dùng"));

        Integer totalRedeemed = pointHistoryRepository.getTotalPointsRedeemed(userId);

        // Tính toán membership progress
        MembershipProgress progress = calculateMembershipProgress(user);

        return RewardPointsResponse.builder()
                .currentPoints(user.getCurrentPoints() != null ? user.getCurrentPoints() : 0)
                .totalPointsEarned(user.getTotalPointsEarned() != null ? user.getTotalPointsEarned() : 0)
                .totalPointsRedeemed(totalRedeemed)
                .pointsExpiringSoon(0) // TODO: Implement logic for expiring points
                .membershipLevel(user.getMembershipLevel())
                .membershipLevelDisplay(getMembershipLevelDisplay(user.getMembershipLevel() ))
                .totalSpending(user.getTotalSpending())
                .progressToNextLevel(progress.progressPercent)
                .amountToNextLevel(progress.amountToNext)
                .nextLevelName(progress.nextLevelName)
                .pointsPerTransaction(calculateAveragePointsPerTransaction(userId))
                .pointConversionRate("10.000đ = 1 điểm")
                .build();
    }

    /**
     * Lấy lịch sử điểm với filter
     */
    @Transactional(readOnly = true)
    public Page<PointHistoryResponse> getPointHistory(
            Long userId,
            PointHistory.TransactionType transactionType,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    ) {
        Page<PointHistory> historyPage = pointHistoryRepository.findByUserIdWithFilters(
                userId, transactionType, startDate, endDate, pageable
        );

        return historyPage.map(PointHistoryResponse::fromEntity);
    }

    /**
     * Cộng điểm thưởng khi hoàn thành giao dịch
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRED)
    public void earnPoints(Long userId, Integer points, String description, Long referenceId, PointHistory.ReferenceType referenceType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ProfileUpdateException("Không tìm thấy người dùng"));

        // Cập nhật điểm user (null check)
        int currentPoints = user.getCurrentPoints() != null ? user.getCurrentPoints() : 0;
        int totalEarned = user.getTotalPointsEarned() != null ? user.getTotalPointsEarned() : 0;
        
        int newBalance = currentPoints + points;
        user.setCurrentPoints(newBalance);
        user.setTotalPointsEarned(totalEarned + points);
        userRepository.save(user);

        // Ghi lịch sử
        PointHistory history = PointHistory.builder()
                .user(user)
                .points(points)
                .transactionType(PointHistory.TransactionType.EARNED)
                .description(description)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .balanceAfter(newBalance)
                .createdAt(LocalDateTime.now())
                .build();
        pointHistoryRepository.save(history);

        log.info("User {} earned {} points. New balance: {}", userId, points, newBalance);
    }

    /**
     * Đổi điểm thưởng
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRED)
    public void redeemPoints(Long userId, Integer points, String description, Long referenceId, PointHistory.ReferenceType referenceType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ProfileUpdateException("Không tìm thấy người dùng"));

        int currentPoints = user.getCurrentPoints() != null ? user.getCurrentPoints() : 0;
        
        if (currentPoints < points) {
            throw new InsufficientPointsException(currentPoints, points);
        }

        // Trừ điểm user
        int newBalance = currentPoints - points;
        user.setCurrentPoints(newBalance);
        userRepository.save(user);

        // Ghi lịch sử (số âm cho redemption)
        PointHistory history = PointHistory.builder()
                .user(user)
                .points(-points)
                .transactionType(PointHistory.TransactionType.REDEEMED)
                .description(description)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .balanceAfter(newBalance)
                .createdAt(LocalDateTime.now())
                .build();
        pointHistoryRepository.save(history);

        log.info("User {} redeemed {} points. New balance: {}", userId, points, newBalance);
    }

    /**
     * Thưởng điểm bonus (ví dụ: sinh nhật, khuyến mãi)
     */
    @Transactional
    public void addBonusPoints(Long userId, Integer points, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ProfileUpdateException("Không tìm thấy người dùng"));

        int newBalance = user.getCurrentPoints() + points;
        user.setCurrentPoints(newBalance);
        user.setTotalPointsEarned(user.getTotalPointsEarned() + points);
        userRepository.save(user);

        PointHistory history = PointHistory.builder()
                .user(user)
                .points(points)
                .transactionType(PointHistory.TransactionType.BONUS)
                .description(description)
                .balanceAfter(newBalance)
                .createdAt(LocalDateTime.now())
                .build();
        pointHistoryRepository.save(history);

        log.info("User {} received {} bonus points. New balance: {}", userId, points, newBalance);
    }

    /**
     * Điều chỉnh điểm (admin)
     */
    @Transactional
    public void adjustPoints(Long userId, Integer points, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ProfileUpdateException("Không tìm thấy người dùng"));

        int newBalance = user.getCurrentPoints() + points;
        if (newBalance < 0) {
            throw new InsufficientPointsException("Không thể điều chỉnh xuống dưới 0 điểm");
        }

        user.setCurrentPoints(newBalance);
        if (points > 0) {
            user.setTotalPointsEarned(user.getTotalPointsEarned() + points);
        }
        userRepository.save(user);

        PointHistory history = PointHistory.builder()
                .user(user)
                .points(points)
                .transactionType(PointHistory.TransactionType.ADJUSTED)
                .description(reason)
                .balanceAfter(newBalance)
                .createdAt(LocalDateTime.now())
                .build();
        pointHistoryRepository.save(history);

        log.info("Admin adjusted {} points for user {}. New balance: {}", points, userId, newBalance);
    }

    // ===== Private Helper Methods =====

    private String getMembershipLevelDisplay(User.MembershipLevel level) {
        return switch (level) {
            case NORMAL -> "Thành viên thường";
            case VIP -> "Thành viên VIP";
            case PLATINUM -> "Thành viên Platinum";
        };
    }

    private Integer calculateAveragePointsPerTransaction(Long userId) {
        Long earnedCount = pointHistoryRepository.countByUserIdAndTransactionType(
                userId, PointHistory.TransactionType.EARNED
        );
        if (earnedCount == 0) return 0;

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return 0;

        return user.getTotalPointsEarned() / earnedCount.intValue();
    }

    private MembershipProgress calculateMembershipProgress(User user) {
        BigDecimal spending = user.getTotalSpending() != null ? user.getTotalSpending() : BigDecimal.ZERO;
        User.MembershipLevel currentLevel = user.getMembershipLevel() != null ? user.getMembershipLevel() : User.MembershipLevel.NORMAL;

        return switch (currentLevel) {
            case NORMAL -> {
                BigDecimal progress = spending.divide(VIP_THRESHOLD, 2, java.math.RoundingMode.DOWN)
                        .multiply(new BigDecimal("100"));
                yield new MembershipProgress(
                        Math.min(progress.intValue(), 100),
                        VIP_THRESHOLD.subtract(spending).max(BigDecimal.ZERO),
                        "VIP"
                );
            }
            case VIP -> {
                BigDecimal progressAmount = spending.subtract(VIP_THRESHOLD);
                BigDecimal range = PLATINUM_THRESHOLD.subtract(VIP_THRESHOLD);
                BigDecimal progress = progressAmount.divide(range, 2, java.math.RoundingMode.DOWN)
                        .multiply(new BigDecimal("100"));
                yield new MembershipProgress(
                        Math.min(progress.intValue(), 100),
                        PLATINUM_THRESHOLD.subtract(spending).max(BigDecimal.ZERO),
                        "PLATINUM"
                );
            }
            case PLATINUM -> new MembershipProgress(100, BigDecimal.ZERO, null);
        };
    }

    private record MembershipProgress(Integer progressPercent, BigDecimal amountToNext, String nextLevelName) {}
}
