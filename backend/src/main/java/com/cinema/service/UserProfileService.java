package com.cinema.service;

import com.cinema.dto.request.ChangePasswordRequest;
import com.cinema.dto.request.UserProfileUpdateRequest;
import com.cinema.dto.response.TransactionHistoryResponse;
import com.cinema.dto.response.UserProfileResponse;
import com.cinema.exception.InvalidPasswordException;
import com.cinema.exception.ProfileUpdateException;
import com.cinema.model.Booking;
import com.cinema.model.PointHistory;
import com.cinema.model.User;
import com.cinema.repository.BookingRepository;
import com.cinema.repository.PointHistoryRepository;
import com.cinema.repository.UserCouponRepository;
import com.cinema.repository.UserRepository;
import com.cinema.repository.UserVoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final UserCouponRepository userCouponRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    // Ngưỡng chi tiêu để lên hạng
    private static final BigDecimal VIP_THRESHOLD = new BigDecimal("5000000"); // 5 triệu
    private static final BigDecimal PLATINUM_THRESHOLD = new BigDecimal("15000000"); // 15 triệu

    /**
     * Lấy thông tin profile của user
     */
    @Transactional
    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ProfileUpdateException("Không tìm thấy người dùng"));

        // Tính tổng chi tiêu thực tế từ các booking đã CONFIRMED/COMPLETED
        BigDecimal actualTotalSpending = bookingRepository.calculateTotalSpendingByUserId(userId);
        
        // Cập nhật totalSpending và membershipLevel nếu có thay đổi
        boolean needsUpdate = false;
        if (user.getTotalSpending() == null || user.getTotalSpending().compareTo(actualTotalSpending) != 0) {
            user.setTotalSpending(actualTotalSpending);
            needsUpdate = true;
        }
        
        // Tính toán và cập nhật membership level
        User.MembershipLevel correctLevel = calculateMembershipLevelFromSpending(actualTotalSpending);
        if (user.getMembershipLevel() != correctLevel) {
            log.info("Cập nhật hạng thành viên cho user {}: {} -> {}", user.getEmail(), user.getMembershipLevel(), correctLevel);
            user.setMembershipLevel(correctLevel);
            needsUpdate = true;
        }
        
        if (needsUpdate) {
            userRepository.save(user);
        }

        Long totalBookings = bookingRepository.countCompletedBookingsByUserId(userId);
        Long totalVouchers = userVoucherRepository.countByUserId(userId);
        Long totalCoupons = userCouponRepository.countByUserId(userId);
        
        // Tính toán membership progress
        MembershipProgress progress = calculateMembershipProgress(user);

        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .avatar(user.getAvatar())
                .gender(user.getGender())
                .dateOfBirth(user.getDateOfBirth())
                .membershipLevel(user.getMembershipLevel() != null ? user.getMembershipLevel() : User.MembershipLevel.NORMAL)
                .totalSpending(actualTotalSpending)
                .currentPoints(user.getCurrentPoints() != null ? user.getCurrentPoints() : 0)
                .totalPointsEarned(user.getTotalPointsEarned() != null ? user.getTotalPointsEarned() : 0)
                .totalBookings(totalBookings.intValue())
                .totalVouchers(totalVouchers.intValue())
                .totalCoupons(totalCoupons.intValue())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .progressToNextLevel(progress.progressPercent)
                .amountToNextLevel(progress.amountToNext)
                .nextLevelName(progress.nextLevelName)
                .build();
    }
    
    /**
     * Tính toán hạng thành viên dựa trên tổng chi tiêu
     */
    private User.MembershipLevel calculateMembershipLevelFromSpending(BigDecimal totalSpending) {
        if (totalSpending.compareTo(PLATINUM_THRESHOLD) >= 0) {
            return User.MembershipLevel.PLATINUM;
        } else if (totalSpending.compareTo(VIP_THRESHOLD) >= 0) {
            return User.MembershipLevel.VIP;
        }
        return User.MembershipLevel.NORMAL;
    }

    /**
     * Cập nhật thông tin profile
     */
    @Transactional
    public UserProfileResponse updateUserProfile(Long userId, UserProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ProfileUpdateException("Không tìm thấy người dùng"));

        // Cập nhật các trường
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }

        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Updated profile for user: {}", userId);
        return getUserProfile(userId);
    }

    /**
     * Đổi mật khẩu
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        // Validate confirm password
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new InvalidPasswordException("Mật khẩu xác nhận không khớp");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ProfileUpdateException("Không tìm thấy người dùng"));

        // Validate current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidPasswordException("Mật khẩu hiện tại không đúng");
        }

        // Check new password not same as old
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new InvalidPasswordException("Mật khẩu mới phải khác mật khẩu hiện tại");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Password changed for user: {}", userId);
    }

    /**
     * Lấy lịch sử giao dịch với filter và phân trang
     */
    @Transactional(readOnly = true)
    public Page<TransactionHistoryResponse> getTransactionHistory(
            Long userId,
            String search,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    ) {
        Page<Booking> bookings = bookingRepository.findByUserIdWithFilters(
                userId, search, startDate, endDate, pageable
        );

        return bookings.map(this::mapToTransactionHistory);
    }

    /**
     * Cập nhật membership level dựa trên tổng chi tiêu
     */
    @Transactional
    public void updateMembershipLevel(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ProfileUpdateException("Không tìm thấy người dùng"));

        BigDecimal totalSpending = user.getTotalSpending();
        User.MembershipLevel newLevel;

        if (totalSpending.compareTo(PLATINUM_THRESHOLD) >= 0) {
            newLevel = User.MembershipLevel.PLATINUM;
        } else if (totalSpending.compareTo(VIP_THRESHOLD) >= 0) {
            newLevel = User.MembershipLevel.VIP;
        } else {
            newLevel = User.MembershipLevel.NORMAL;
        }

        if (user.getMembershipLevel() != newLevel) {
            user.setMembershipLevel(newLevel);
            userRepository.save(user);
            log.info("User {} upgraded to {} level", userId, newLevel);
        }
    }

    /**
     * Cộng tổng chi tiêu và điểm thưởng cho user
     */
    @Transactional
    public void addSpendingAndPoints(Long userId, BigDecimal amount, Integer points) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ProfileUpdateException("Không tìm thấy người dùng"));

        user.setTotalSpending(user.getTotalSpending().add(amount));
        user.setCurrentPoints(user.getCurrentPoints() + points);
        user.setTotalPointsEarned(user.getTotalPointsEarned() + points);
        userRepository.save(user);

        // Kiểm tra và cập nhật level
        updateMembershipLevel(userId);
    }

    // ===== Private Helper Methods =====

    private TransactionHistoryResponse mapToTransactionHistory(Booking booking) {
        List<TransactionHistoryResponse.FoodItemResponse> foodItems = booking.getBookingFoods().stream()
                .map(bf -> TransactionHistoryResponse.FoodItemResponse.builder()
                        .foodName(bf.getFood().getName())
                        .quantity(bf.getQuantity())
                        .price(bf.getUnitPrice())
                        .subtotal(bf.getTotalPrice())
                        .build())
                .collect(Collectors.toList());

        List<String> seatNames = booking.getBookingSeats().stream()
                .map(bs -> bs.getSeat().getRowName() + bs.getSeat().getSeatNumber())
                .collect(Collectors.toList());

        BigDecimal foodPrice = foodItems.stream()
                .map(TransactionHistoryResponse.FoodItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Get payment info if exists
        String paymentMethod = null;
        String paymentStatus = null;
        if (booking.getPayment() != null) {
            paymentMethod = booking.getPayment().getPaymentMethod() != null 
                    ? booking.getPayment().getPaymentMethod().name() : null;
            paymentStatus = booking.getPayment().getStatus() != null 
                    ? booking.getPayment().getStatus().name() : null;
        }

        // Combine date and time for showtime
        LocalDateTime showtimeStart = LocalDateTime.of(
                booking.getShowtime().getShowDate(),
                booking.getShowtime().getStartTime()
        );

        // Lấy điểm tích lũy và điểm đã sử dụng thực tế từ database
        Integer pointsEarned = pointHistoryRepository.getPointsEarnedByBookingId(booking.getId());
        Integer pointsUsed = pointHistoryRepository.getPointsUsedByBookingId(booking.getId());

        return TransactionHistoryResponse.builder()
                .bookingId(booking.getId())
                .bookingCode(booking.getBookingCode())
                .bookingTime(booking.getCreatedAt())
                .status(booking.getStatus().name())
                .statusDisplay(getStatusDisplay(booking.getStatus()))
                .movieTitle(booking.getShowtime().getMovie().getTitle())
                .moviePoster(booking.getShowtime().getMovie().getPosterUrl())
                .showtimeStart(showtimeStart)
                .theaterName(booking.getShowtime().getRoom().getTheater().getName())
                .roomName(booking.getShowtime().getRoom().getName())
                .seatNames(seatNames)
                .seatCount(seatNames.size())
                .foodItems(foodItems)
                .ticketPrice(booking.getTotalAmount().subtract(foodPrice))
                .foodPrice(foodPrice)
                .discountAmount(booking.getDiscountAmount())
                .totalAmount(booking.getFinalAmount())
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentStatus)
                .pointsEarned(pointsEarned != null ? pointsEarned : 0)
                .pointsUsed(pointsUsed != null ? pointsUsed : 0)
                .build();
    }

    private String getStatusDisplay(Booking.BookingStatus status) {
        return switch (status) {
            case PENDING -> "Chờ thanh toán";
            case CONFIRMED -> "Đã xác nhận";
            case COMPLETED -> "Hoàn thành";
            case CANCELLED -> "Đã hủy";
            case EXPIRED -> "Hết hạn";
        };
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
