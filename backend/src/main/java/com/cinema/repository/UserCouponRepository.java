package com.cinema.repository;

import com.cinema.model.UserCoupon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserCouponRepository extends JpaRepository<UserCoupon, Long> {

    /**
     * Lấy tất cả coupon của user
     */
    List<UserCoupon> findByUserIdOrderByRedeemedAtDesc(Long userId);

    /**
     * Lấy coupon của user với phân trang
     */
    Page<UserCoupon> findByUserIdOrderByRedeemedAtDesc(Long userId, Pageable pageable);

    /**
     * Lấy coupon theo trạng thái
     */
    List<UserCoupon> findByUserIdAndStatusOrderByRedeemedAtDesc(
            Long userId, 
            UserCoupon.UseStatus status
    );

    /**
     * Lấy coupon có thể sử dụng của user
     */
    @Query("SELECT uc FROM UserCoupon uc " +
           "JOIN FETCH uc.coupon c " +
           "WHERE uc.user.id = :userId " +
           "AND uc.status = 'AVAILABLE' " +
           "AND c.status = 'ACTIVE' " +
           "AND (c.startDate IS NULL OR c.startDate <= :now) " +
           "AND (c.expiryDate IS NULL OR c.expiryDate >= :now)")
    List<UserCoupon> findAvailableCouponsForUser(
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );

    /**
     * Kiểm tra user đã có coupon này chưa
     */
    boolean existsByUserIdAndCouponId(Long userId, Long couponId);

    /**
     * Tìm UserCoupon cụ thể
     */
    Optional<UserCoupon> findByUserIdAndCouponId(Long userId, Long couponId);

    /**
     * Đếm số coupon theo trạng thái
     */
    Long countByUserIdAndStatus(Long userId, UserCoupon.UseStatus status);

    /**
     * Đếm tổng coupon của user
     */
    Long countByUserId(Long userId);

    /**
     * Lấy coupon sắp hết hạn của user
     */
    @Query("SELECT uc FROM UserCoupon uc " +
           "JOIN uc.coupon c " +
           "WHERE uc.user.id = :userId " +
           "AND uc.status = 'AVAILABLE' " +
           "AND c.expiryDate BETWEEN :now AND :futureDate")
    List<UserCoupon> findExpiringUserCoupons(
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now,
            @Param("futureDate") LocalDateTime futureDate
    );

    /**
     * Lấy tất cả UserCoupon có coupon đã hết hạn nhưng status vẫn AVAILABLE
     */
    @Query("SELECT uc FROM UserCoupon uc " +
           "JOIN uc.coupon c " +
           "WHERE uc.status = 'AVAILABLE' " +
           "AND c.expiryDate < :now")
    List<UserCoupon> findExpiredAvailableUserCoupons(@Param("now") LocalDateTime now);
}
