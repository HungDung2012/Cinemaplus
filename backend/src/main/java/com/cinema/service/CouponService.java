package com.cinema.service;

import com.cinema.dto.request.CouponRedeemRequest;
import com.cinema.dto.response.CouponResponse;
import com.cinema.exception.InvalidCouponException;
import com.cinema.exception.ProfileUpdateException;
import com.cinema.model.Coupon;
import com.cinema.model.User;
import com.cinema.model.UserCoupon;
import com.cinema.repository.CouponRepository;
import com.cinema.repository.UserCouponRepository;
import com.cinema.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CouponService {

    private final CouponRepository couponRepository;
    private final UserCouponRepository userCouponRepository;
    private final UserRepository userRepository;

    /**
     * Nhập mã coupon và PIN để đổi coupon
     */
    @Transactional
    public CouponResponse redeemCoupon(Long userId, CouponRedeemRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ProfileUpdateException("Không tìm thấy người dùng"));

        // Tìm coupon
        Coupon coupon = couponRepository.findByCouponCode(request.getCouponCode())
                .orElseThrow(() -> new InvalidCouponException(
                        "Mã coupon không tồn tại",
                        InvalidCouponException.COUPON_NOT_FOUND
                ));

        // Kiểm tra PIN
        if (!coupon.getPinCode().equals(request.getPinCode())) {
            throw new InvalidCouponException(
                    "Mã PIN không đúng",
                    InvalidCouponException.COUPON_INVALID_PIN
            );
        }

        // Kiểm tra trạng thái coupon
        if (coupon.getStatus() != Coupon.CouponStatus.ACTIVE) {
            throw new InvalidCouponException(
                    "Coupon không còn hiệu lực",
                    InvalidCouponException.COUPON_ALREADY_USED
            );
        }

        LocalDateTime now = LocalDateTime.now();

        // Kiểm tra thời gian bắt đầu
        if (coupon.getStartDate() != null && coupon.getStartDate().isAfter(now)) {
            throw new InvalidCouponException(
                    "Coupon chưa có hiệu lực",
                    InvalidCouponException.COUPON_NOT_STARTED
            );
        }

        // Kiểm tra hết hạn
        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(now)) {
            throw new InvalidCouponException(
                    "Coupon đã hết hạn",
                    InvalidCouponException.COUPON_EXPIRED
            );
        }

        // Kiểm tra usage limit
        if (coupon.getUsageLimit() != null && coupon.getUsageCount() >= coupon.getUsageLimit()) {
            throw new InvalidCouponException(
                    "Coupon đã hết lượt sử dụng",
                    InvalidCouponException.COUPON_USAGE_LIMIT_REACHED
            );
        }

        // Kiểm tra user đã có coupon này chưa
        if (userCouponRepository.existsByUserIdAndCouponId(userId, coupon.getId())) {
            throw new InvalidCouponException(
                    "Bạn đã đổi coupon này rồi",
                    InvalidCouponException.COUPON_ALREADY_REDEEMED
            );
        }

        // Tăng usage count của coupon
        coupon.setUsageCount(coupon.getUsageCount() + 1);
        couponRepository.save(coupon);

        // Tạo UserCoupon
        UserCoupon userCoupon = UserCoupon.builder()
                .user(user)
                .coupon(coupon)
                .status(UserCoupon.UseStatus.AVAILABLE)
                .redeemedAt(LocalDateTime.now())
                .build();
        userCouponRepository.save(userCoupon);

        log.info("User {} redeemed coupon {}", userId, coupon.getCouponCode());

        return CouponResponse.fromUserCoupon(userCoupon);
    }

    /**
     * Lấy danh sách coupon của user
     */
    @Transactional(readOnly = true)
    public List<CouponResponse> getUserCoupons(Long userId) {
        List<UserCoupon> userCoupons = userCouponRepository.findByUserIdOrderByRedeemedAtDesc(userId);
        return userCoupons.stream()
                .map(CouponResponse::fromUserCoupon)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách coupon của user với phân trang
     */
    @Transactional(readOnly = true)
    public Page<CouponResponse> getUserCoupons(Long userId, Pageable pageable) {
        Page<UserCoupon> userCoupons = userCouponRepository.findByUserIdOrderByRedeemedAtDesc(userId, pageable);
        return userCoupons.map(CouponResponse::fromUserCoupon);
    }

    /**
     * Lấy danh sách coupon có thể sử dụng của user
     */
    @Transactional(readOnly = true)
    public List<CouponResponse> getAvailableCoupons(Long userId) {
        List<UserCoupon> availableCoupons = userCouponRepository.findAvailableCouponsForUser(
                userId, LocalDateTime.now()
        );
        return availableCoupons.stream()
                .map(CouponResponse::fromUserCoupon)
                .collect(Collectors.toList());
    }

    /**
     * Sử dụng coupon cho booking
     */
    @Transactional
    public void useCoupon(Long userId, Long userCouponId, Long bookingId) {
        UserCoupon userCoupon = userCouponRepository.findById(userCouponId)
                .orElseThrow(() -> new InvalidCouponException("Không tìm thấy coupon"));

        // Validate
        if (!userCoupon.getUser().getId().equals(userId)) {
            throw new InvalidCouponException("Coupon không thuộc về bạn");
        }

        if (userCoupon.getStatus() != UserCoupon.UseStatus.AVAILABLE) {
            throw new InvalidCouponException(
                    "Coupon không còn khả dụng",
                    InvalidCouponException.COUPON_ALREADY_USED
            );
        }

        if (!userCoupon.getCoupon().isValid()) {
            throw new InvalidCouponException(
                    "Coupon đã hết hạn",
                    InvalidCouponException.COUPON_EXPIRED
            );
        }

        // Update status
        userCoupon.setStatus(UserCoupon.UseStatus.USED);
        userCoupon.setUsedAt(LocalDateTime.now());
        userCoupon.setUsedForBookingId(bookingId);
        userCouponRepository.save(userCoupon);

        log.info("User {} used coupon {} for booking {}", userId, userCoupon.getCoupon().getCouponCode(), bookingId);
    }

    /**
     * Tính giá trị giảm giá của coupon
     */
    @Transactional(readOnly = true)
    public BigDecimal calculateDiscount(Long userCouponId, BigDecimal orderAmount) {
        UserCoupon userCoupon = userCouponRepository.findById(userCouponId)
                .orElseThrow(() -> new InvalidCouponException("Không tìm thấy coupon"));

        if (userCoupon.getStatus() != UserCoupon.UseStatus.AVAILABLE) {
            throw new InvalidCouponException("Coupon không còn khả dụng");
        }

        Coupon coupon = userCoupon.getCoupon();

        // Kiểm tra minimum purchase amount
        if (coupon.getMinPurchaseAmount() != null && 
            orderAmount.compareTo(coupon.getMinPurchaseAmount()) < 0) {
            throw new InvalidCouponException(
                    String.format("Đơn hàng tối thiểu phải từ %,.0fđ", coupon.getMinPurchaseAmount()),
                    InvalidCouponException.COUPON_MIN_PURCHASE_NOT_MET
            );
        }

        BigDecimal discount;
        if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
            discount = orderAmount.multiply(coupon.getDiscountValue())
                    .divide(new BigDecimal("100"), 0, java.math.RoundingMode.DOWN);
            
            // Áp dụng max discount nếu có
            if (coupon.getMaxDiscountAmount() != null && 
                discount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                discount = coupon.getMaxDiscountAmount();
            }
        } else {
            // FIXED_AMOUNT
            discount = coupon.getDiscountValue();
        }

        // Không cho phép discount lớn hơn order amount
        if (discount.compareTo(orderAmount) > 0) {
            discount = orderAmount;
        }

        return discount;
    }

    /**
     * Lấy coupon sắp hết hạn của user (trong 24h)
     */
    @Transactional(readOnly = true)
    public List<CouponResponse> getExpiringCoupons(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime futureDate = now.plusHours(24);
        List<UserCoupon> expiringCoupons = userCouponRepository.findExpiringUserCoupons(userId, now, futureDate);
        return expiringCoupons.stream()
                .map(CouponResponse::fromUserCoupon)
                .collect(Collectors.toList());
    }

    /**
     * Job để cập nhật status các coupon hết hạn
     */
    @Transactional
    public void updateExpiredCoupons() {
        LocalDateTime now = LocalDateTime.now();

        // Cập nhật Coupon đã hết hạn
        List<Coupon> expiredCoupons = couponRepository.findExpiredActiveCoupons(now);
        for (Coupon coupon : expiredCoupons) {
            coupon.setStatus(Coupon.CouponStatus.EXPIRED);
        }
        couponRepository.saveAll(expiredCoupons);

        // Cập nhật Coupon hết usage limit
        List<Coupon> exhaustedCoupons = couponRepository.findExhaustedCoupons();
        for (Coupon coupon : exhaustedCoupons) {
            coupon.setStatus(Coupon.CouponStatus.INACTIVE);
        }
        couponRepository.saveAll(exhaustedCoupons);

        // Cập nhật UserCoupon
        List<UserCoupon> expiredUserCoupons = userCouponRepository.findExpiredAvailableUserCoupons(now);
        for (UserCoupon uc : expiredUserCoupons) {
            uc.setStatus(UserCoupon.UseStatus.EXPIRED);
        }
        userCouponRepository.saveAll(expiredUserCoupons);

        log.info("Updated {} expired coupons, {} exhausted coupons, {} expired user coupons", 
                expiredCoupons.size(), exhaustedCoupons.size(), expiredUserCoupons.size());
    }
}
