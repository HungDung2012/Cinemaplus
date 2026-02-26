package com.cinema.service;

import com.cinema.dto.payment.*;
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
import com.cinema.service.payment.PaymentGatewayFactory;
import com.cinema.service.payment.PaymentGatewayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RewardPointService rewardPointService;
    private final PaymentGatewayFactory paymentGatewayFactory;
    
    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${server.port:8080}")
    private String serverPort;

    @Value("${app.backend-url:}")
    private String backendUrl;
    
    // 1 điểm = 1.000đ
    private static final BigDecimal POINT_TO_VND = new BigDecimal("1000");
    
    // Các phương thức thanh toán online (cần redirect đến cổng thanh toán)
    private static final Set<Payment.PaymentMethod> ONLINE_GATEWAYS = Set.of(
            Payment.PaymentMethod.VNPAY,
            Payment.PaymentMethod.MOMO,
            Payment.PaymentMethod.ZALOPAY
    );

    /**
     * Tạo Payment + URL thanh toán từ cổng thanh toán (VNPay/MoMo/ZaloPay).
     * Frontend sẽ redirect user đến paymentUrl để thanh toán.
     */
    @Transactional
    public CreatePaymentUrlResponse createPaymentWithGateway(CreatePaymentUrlRequest request, String clientIpAddress) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", request.getBookingId()));
        
        if (paymentRepository.findByBookingId(booking.getId()).isPresent()) {
            throw new BadRequestException("Payment already exists for this booking");
        }
        
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Can only pay for pending bookings");
        }
        
        // Xử lý điểm thưởng nếu có
        BigDecimal finalAmount = applyPointsDiscount(booking, request.getPointsToUse());
        
        // Tạo Payment entity với trạng thái PENDING
        Payment payment = Payment.builder()
                .amount(finalAmount)
                .paymentMethod(request.getPaymentMethod())
                .status(Payment.PaymentStatus.PENDING)
                .booking(booking)
                .build();
        payment = paymentRepository.save(payment);

        // Nếu là online gateway → tạo URL thanh toán từ cổng
        String paymentUrl = null;
        if (ONLINE_GATEWAYS.contains(request.getPaymentMethod())) {
            PaymentGatewayService gateway = paymentGatewayFactory.getGateway(request.getPaymentMethod());

            String baseBackendUrl = backendUrl != null && !backendUrl.isEmpty() 
                    ? backendUrl 
                    : "http://localhost:" + serverPort;
            String gatewayName = request.getPaymentMethod().name().toLowerCase();

            PaymentGatewayRequest gatewayRequest = PaymentGatewayRequest.builder()
                    .paymentId(payment.getId())
                    .orderId(booking.getBookingCode())
                    .amount(finalAmount)
                    .orderInfo("Thanh toan ve xem phim - Ma " + booking.getBookingCode())
                    .returnUrl(frontendUrl + "/payment/return?method=" + gatewayName)
                    .ipnUrl(baseBackendUrl + "/api/payments/ipn/" + gatewayName)
                    .clientIpAddress(clientIpAddress)
                    .build();

            PaymentGatewayResponse gatewayResponse = gateway.createPaymentUrl(gatewayRequest);
            
            if (!gatewayResponse.isSuccess()) {
                // Rollback: xoá payment nếu tạo URL thất bại
                paymentRepository.delete(payment);
                throw new BadRequestException(gatewayResponse.getMessage());
            }
            
            paymentUrl = gatewayResponse.getPaymentUrl();
            log.info("Payment gateway URL created: method={}, order={}", request.getPaymentMethod(), booking.getBookingCode());
        }
        
        return CreatePaymentUrlResponse.builder()
                .paymentId(payment.getId())
                .paymentUrl(paymentUrl)
                .bookingCode(booking.getBookingCode())
                .amount(finalAmount)
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .createdAt(payment.getCreatedAt())
                .build();
    }

    /**
     * Xử lý IPN (Instant Payment Notification) từ cổng thanh toán.
     * 
     * CRITICAL: Sử dụng PESSIMISTIC_WRITE lock để tránh race condition
     * khi IPN webhook và frontend returnUrl callback gọi về cùng lúc.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Map<String, Object> handleIpn(String gatewayName, Map<String, String> params) {
        Payment.PaymentMethod method = resolveGatewayMethod(gatewayName);
        PaymentGatewayService gateway = paymentGatewayFactory.getGateway(method);

        // Step 1: Gateway verify signature + parse kết quả
        IpnResult ipnResult = gateway.processIpn(params);
        
        if (ipnResult.getOrderId() == null) {
            log.warn("IPN missing orderId for gateway: {}", gatewayName);
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        // Step 2: Tìm Payment với PESSIMISTIC_WRITE lock — tránh cập nhật trùng
        Payment payment = paymentRepository.findByBookingCodeWithLock(ipnResult.getOrderId())
                .orElse(null);
                
        if (payment == null) {
            log.warn("IPN: Payment not found for bookingCode: {}", ipnResult.getOrderId());
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        // Step 3: Kiểm tra idempotency — nếu đã xử lý rồi thì bỏ qua
        if (payment.getStatus() == Payment.PaymentStatus.COMPLETED) {
            log.info("IPN: Payment already completed for booking: {}", ipnResult.getOrderId());
            return Map.of("RspCode", "00", "Message", "Already processed");
        }

        if (payment.getStatus() != Payment.PaymentStatus.PENDING) {
            log.warn("IPN: Payment not in PENDING status: {}", payment.getStatus());
            return Map.of("RspCode", "02", "Message", "Invalid payment status");
        }

        // Step 4: Verify số tiền khớp (chống giả mạo)
        if (ipnResult.getAmount() != null && payment.getAmount().compareTo(ipnResult.getAmount()) != 0) {
            log.warn("IPN: Amount mismatch. Expected: {}, Got: {}", payment.getAmount(), ipnResult.getAmount());
            return Map.of("RspCode", "04", "Message", "Amount mismatch");
        }

        // Step 5: Cập nhật trạng thái dựa trên kết quả từ cổng
        if (ipnResult.isSuccess()) {
            completePayment(payment, ipnResult.getTransactionId());
            log.info("IPN: Payment completed successfully. Booking: {}, TxnId: {}", 
                    ipnResult.getOrderId(), ipnResult.getTransactionId());
        } else {
            payment.markAsFailed(ipnResult.getMessage());
            paymentRepository.save(payment);
            log.warn("IPN: Payment failed. Booking: {}, Reason: {}", 
                    ipnResult.getOrderId(), ipnResult.getMessage());
        }

        return Map.of("RspCode", "00", "Message", "OK");
    }

    /**
     * Hoàn tất thanh toán: cập nhật payment + booking + reward points.
     * Được gọi từ IPN handler (đã lock).
     */
    private void completePayment(Payment payment, String transactionId) {
        Booking booking = bookingRepository.findByIdWithShowtimeAndMovie(payment.getBooking().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", payment.getBooking().getId()));
        User user = booking.getUser();

        // Trừ điểm thưởng nếu đã sử dụng
        if (booking.getPointsUsed() != null && booking.getPointsUsed() > 0) {
            rewardPointService.redeemPoints(
                user.getId(),
                booking.getPointsUsed(),
                String.format("Sử dụng điểm thanh toán vé: %s - Mã %s", 
                    booking.getShowtime().getMovie().getTitle(), booking.getBookingCode()),
                booking.getId(),
                PointHistory.ReferenceType.BOOKING
            );
            log.info("Deducted {} points from user {} for booking {}", 
                booking.getPointsUsed(), user.getEmail(), booking.getBookingCode());
        }

        // Đánh dấu Payment hoàn thành
        payment.markAsCompleted(transactionId);
        paymentRepository.save(payment);

        // Cập nhật Booking → CONFIRMED
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        // Cập nhật tổng chi tiêu và membership
        updateUserSpendingAndMembership(user.getId(), payment.getAmount());

        // Tích điểm thưởng (10.000đ = 1 điểm)
        int pointsToEarn = calculatePointsEarned(payment.getAmount());
        if (pointsToEarn > 0) {
            rewardPointService.earnPoints(
                user.getId(),
                pointsToEarn,
                String.format("Đặt vé xem phim: %s - Mã %s", 
                    booking.getShowtime().getMovie().getTitle(), booking.getBookingCode()),
                booking.getId(),
                PointHistory.ReferenceType.BOOKING
            );
            log.info("User {} earned {} points for booking {}", 
                user.getEmail(), pointsToEarn, booking.getBookingCode());
        }
    }

    // ==================== LEGACY METHODS (giữ tương thích) ====================

    /**
     * Tạo payment (legacy — không dùng cổng thanh toán online).
     * Dùng cho các phương thức như CASH, CREDIT_CARD, v.v.
     */
    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", request.getBookingId()));
        
        if (paymentRepository.findByBookingId(booking.getId()).isPresent()) {
            throw new BadRequestException("Payment already exists for this booking");
        }
        
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Can only pay for pending bookings");
        }
        
        BigDecimal finalAmount = applyPointsDiscount(booking, request.getPointsToUse());
        
        Payment payment = Payment.builder()
                .amount(finalAmount)
                .paymentMethod(request.getPaymentMethod())
                .status(Payment.PaymentStatus.PENDING)
                .booking(booking)
                .build();
        
        payment = paymentRepository.save(payment);
        return mapToResponse(payment);
    }
    
    /**
     * Xử lý thanh toán thủ công (legacy — dành cho non-gateway methods).
     */
    @Transactional
    public PaymentResponse processPayment(Long paymentId) {
        Payment payment = paymentRepository.findByIdWithLock(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
        
        if (payment.getStatus() != Payment.PaymentStatus.PENDING) {
            throw new BadRequestException("Payment is not in pending status");
        }
        
        String transactionId = "TXN" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        completePayment(payment, transactionId);
        
        return mapToResponse(payment);
    }

    /**
     * Lấy thông tin trạng thái thanh toán theo bookingCode.
     * Frontend dùng khi redirect về từ cổng thanh toán.
     */
    public PaymentResponse getPaymentByBookingCode(String bookingCode) {
        Payment payment = paymentRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "bookingCode", bookingCode));
        return mapToResponse(payment);
    }

    public PaymentResponse getPaymentByBookingId(Long bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "bookingId", bookingId));
        return mapToResponse(payment);
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Áp dụng giảm giá bằng điểm thưởng nếu có. Trả về finalAmount sau khi trừ.
     */
    private BigDecimal applyPointsDiscount(Booking booking, Integer pointsToUse) {
        BigDecimal finalAmount = booking.getFinalAmount();
        
        if (pointsToUse != null && pointsToUse > 0) {
            User user = booking.getUser();
            
            if (user.getCurrentPoints() < pointsToUse) {
                throw new InsufficientPointsException(user.getCurrentPoints(), pointsToUse);
            }
            
            BigDecimal pointsDiscount = POINT_TO_VND.multiply(new BigDecimal(pointsToUse));
            
            if (pointsDiscount.compareTo(finalAmount) > 0) {
                pointsDiscount = finalAmount;
                pointsToUse = finalAmount.divide(POINT_TO_VND, 0, java.math.RoundingMode.DOWN).intValue();
            }
            
            booking.setPointsUsed(pointsToUse);
            booking.setPointsDiscount(pointsDiscount);
            finalAmount = finalAmount.subtract(pointsDiscount);
            booking.setFinalAmount(finalAmount);
            bookingRepository.save(booking);
            
            log.info("User {} uses {} points for booking {}, discount: {}", 
                user.getEmail(), pointsToUse, booking.getBookingCode(), pointsDiscount);
        }
        
        return finalAmount;
    }

    private int calculatePointsEarned(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) return 0;
        return amount.divide(new BigDecimal("10000"), 0, java.math.RoundingMode.DOWN).intValue();
    }
    
    private void updateUserSpendingAndMembership(Long userId, BigDecimal amount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        BigDecimal currentSpending = user.getTotalSpending() != null ? user.getTotalSpending() : BigDecimal.ZERO;
        BigDecimal newTotalSpending = currentSpending.add(amount);
        user.setTotalSpending(newTotalSpending);
        
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
        
        if (totalSpending.compareTo(PLATINUM_THRESHOLD) >= 0) return User.MembershipLevel.PLATINUM;
        if (totalSpending.compareTo(VIP_THRESHOLD) >= 0) return User.MembershipLevel.VIP;
        return User.MembershipLevel.NORMAL;
    }

    private Payment.PaymentMethod resolveGatewayMethod(String gatewayName) {
        return switch (gatewayName.toLowerCase()) {
            case "vnpay" -> Payment.PaymentMethod.VNPAY;
            case "momo" -> Payment.PaymentMethod.MOMO;
            case "zalopay" -> Payment.PaymentMethod.ZALOPAY;
            default -> throw new BadRequestException("Unsupported gateway: " + gatewayName);
        };
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
