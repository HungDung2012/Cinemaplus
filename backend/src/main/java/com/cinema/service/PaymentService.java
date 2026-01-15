package com.cinema.service;

import com.cinema.dto.request.PaymentRequest;
import com.cinema.dto.response.PaymentResponse;
import com.cinema.exception.BadRequestException;
import com.cinema.exception.InsufficientPointsException;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.Booking;
import com.cinema.model.Payment;
import com.cinema.model.PointHistory;
import com.cinema.model.User;
import com.cinema.repository.BookingRepository;
import com.cinema.repository.PaymentRepository;
import com.cinema.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RewardPointService rewardPointService;
    
    // 1 điểm = 1.000đ
    private static final BigDecimal POINT_TO_VND = new BigDecimal("1000");
    
    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", request.getBookingId()));
        
        // Check if booking already has a payment
        if (paymentRepository.findByBookingId(booking.getId()).isPresent()) {
            throw new BadRequestException("Payment already exists for this booking");
        }
        
        // Check booking status
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Can only pay for pending bookings");
        }
        
        // Xử lý điểm thưởng nếu có
        BigDecimal finalAmount = booking.getFinalAmount();
        Integer pointsToUse = request.getPointsToUse();
        BigDecimal pointsDiscount = BigDecimal.ZERO;
        
        if (pointsToUse != null && pointsToUse > 0) {
            User user = booking.getUser();
            
            // Kiểm tra điểm khả dụng
            if (user.getCurrentPoints() < pointsToUse) {
                throw new InsufficientPointsException(user.getCurrentPoints(), pointsToUse);
            }
            
            // Tính số tiền giảm từ điểm (1 điểm = 1.000đ)
            pointsDiscount = POINT_TO_VND.multiply(new BigDecimal(pointsToUse));
            
            // Đảm bảo không giảm quá số tiền cần thanh toán
            if (pointsDiscount.compareTo(finalAmount) > 0) {
                pointsDiscount = finalAmount;
                pointsToUse = finalAmount.divide(POINT_TO_VND, 0, java.math.RoundingMode.DOWN).intValue();
            }
            
            // Cập nhật booking với thông tin điểm
            booking.setPointsUsed(pointsToUse);
            booking.setPointsDiscount(pointsDiscount);
            
            // Tính lại final amount sau khi trừ điểm
            finalAmount = finalAmount.subtract(pointsDiscount);
            booking.setFinalAmount(finalAmount);
            bookingRepository.save(booking);
            
            log.info("User {} uses {} points for booking {}, discount: {}", 
                user.getEmail(), pointsToUse, booking.getBookingCode(), pointsDiscount);
        }
        
        Payment payment = Payment.builder()
                .amount(finalAmount)
                .paymentMethod(request.getPaymentMethod())
                .status(Payment.PaymentStatus.PENDING)
                .booking(booking)
                .build();
        
        payment = paymentRepository.save(payment);
        
        return mapToResponse(payment);
    }
    
    @Transactional
    public PaymentResponse processPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
        
        if (payment.getStatus() != Payment.PaymentStatus.PENDING) {
            throw new BadRequestException("Payment is not in pending status");
        }
        
        // Load booking with showtime and movie to avoid LazyInitializationException
        Booking booking = bookingRepository.findByIdWithShowtimeAndMovie(payment.getBooking().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", payment.getBooking().getId()));
        User user = booking.getUser();
        
        try {
            // Trừ điểm thưởng nếu có sử dụng
            if (booking.getPointsUsed() != null && booking.getPointsUsed() > 0) {
                rewardPointService.redeemPoints(
                    user.getId(),
                    booking.getPointsUsed(),
                    String.format("Sử dụng điểm thanh toán vé: %s - Mã %s", 
                        booking.getShowtime().getMovie().getTitle(), 
                        booking.getBookingCode()),
                    booking.getId(),
                    PointHistory.ReferenceType.BOOKING
                );
                log.info("Deducted {} points from user {} for booking {}", 
                    booking.getPointsUsed(), user.getEmail(), booking.getBookingCode());
            }
            
            // Simulate payment processing
            String transactionId = "TXN" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

            payment.markAsCompleted(transactionId);
            
            // Update booking status
            booking.setStatus(Booking.BookingStatus.CONFIRMED);
            bookingRepository.save(booking);
            
            paymentRepository.save(payment);
            
            // Cập nhật tổng chi tiêu và membership TRƯỚC (vì earnPoints load user từ DB)
            updateUserSpendingAndMembership(user.getId(), payment.getAmount());
            
            // Tích điểm thưởng cho giao dịch này (dựa trên số tiền thực thanh toán)
            int pointsToEarn = calculatePointsEarned(payment.getAmount());
            if (pointsToEarn > 0) {
                rewardPointService.earnPoints(
                    user.getId(),
                    pointsToEarn,
                    String.format("Đặt vé xem phim: %s - Mã %s", 
                        booking.getShowtime().getMovie().getTitle(), 
                        booking.getBookingCode()),
                    booking.getId(),
                    PointHistory.ReferenceType.BOOKING
                );
                log.info("User {} earned {} points for booking {}", 
                    user.getEmail(), pointsToEarn, booking.getBookingCode());
            }
            
            return mapToResponse(payment);
        } catch (Exception e) {
            log.error("Error processing payment {}: {}", paymentId, e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Tính điểm tích lũy dựa trên số tiền thanh toán.
     * Công thức: 10.000đ = 1 điểm (làm tròn xuống)
     */
    private int calculatePointsEarned(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        return amount.divide(new BigDecimal("10000"), 0, java.math.RoundingMode.DOWN).intValue();
    }
    
    /**
     * Cập nhật tổng chi tiêu và membership level
     */
    private void updateUserSpendingAndMembership(Long userId, BigDecimal amount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        BigDecimal currentSpending = user.getTotalSpending() != null ? user.getTotalSpending() : BigDecimal.ZERO;
        BigDecimal newTotalSpending = currentSpending.add(amount);
        user.setTotalSpending(newTotalSpending);
        
        // Cập nhật hạng thành viên
        User.MembershipLevel newLevel = calculateMembershipLevel(newTotalSpending);
        User.MembershipLevel currentLevel = user.getMembershipLevel() != null ? user.getMembershipLevel() : User.MembershipLevel.NORMAL;
        
        if (newLevel != currentLevel) {
            user.setMembershipLevel(newLevel);
            log.info("User {} upgraded from {} to {}", user.getEmail(), currentLevel, newLevel);
        }
        
        userRepository.save(user);
    }
    
    private User.MembershipLevel calculateMembershipLevel(BigDecimal totalSpending) {
        BigDecimal VIP_THRESHOLD = new BigDecimal("5000000");
        BigDecimal PLATINUM_THRESHOLD = new BigDecimal("15000000");
        
        if (totalSpending.compareTo(PLATINUM_THRESHOLD) >= 0) {
            return User.MembershipLevel.PLATINUM;
        } else if (totalSpending.compareTo(VIP_THRESHOLD) >= 0) {
            return User.MembershipLevel.VIP;
        }
        return User.MembershipLevel.NORMAL;
    }
    
    public PaymentResponse getPaymentByBookingId(Long bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "bookingId", bookingId));
        return mapToResponse(payment);
    }
    
    private PaymentResponse mapToResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .transactionId(payment.getTransactionId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .paidAt(payment.getPaidAt())
                .bookingId(payment.getBooking().getId())
                .bookingCode(payment.getBooking().getBookingCode())
                .build();
    }
}
