package com.cinema.repository;

import com.cinema.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    /**
     * Tìm coupon theo mã code
     */
    Optional<Coupon> findByCouponCode(String couponCode);

    /**
     * Tìm coupon theo mã code và PIN để xác thực
     */
    @Query("SELECT c FROM Coupon c WHERE c.couponCode = :code AND c.pinCode = :pin")
    Optional<Coupon> findByCouponCodeAndPinCode(
            @Param("code") String couponCode,
            @Param("pin") String pinCode
    );

    /**
     * Tìm coupon hợp lệ (active, trong thời hạn, còn lượt sử dụng)
     */
    @Query("SELECT c FROM Coupon c WHERE c.couponCode = :code " +
           "AND c.pinCode = :pin " +
           "AND c.status = 'ACTIVE' " +
           "AND (c.startDate IS NULL OR c.startDate <= :now) " +
           "AND (c.expiryDate IS NULL OR c.expiryDate >= :now) " +
           "AND (c.usageLimit IS NULL OR c.usageCount < c.usageLimit)")
    Optional<Coupon> findValidCoupon(
            @Param("code") String couponCode,
            @Param("pin") String pinCode,
            @Param("now") LocalDateTime now
    );

    /**
     * Lấy danh sách coupon đang hoạt động
     */
    @Query("SELECT c FROM Coupon c WHERE c.status = 'ACTIVE' " +
           "AND (c.startDate IS NULL OR c.startDate <= :now) " +
           "AND (c.expiryDate IS NULL OR c.expiryDate >= :now)")
    List<Coupon> findActiveCoupons(@Param("now") LocalDateTime now);

    /**
     * Kiểm tra coupon code đã tồn tại chưa
     */
    boolean existsByCouponCode(String couponCode);

    /**
     * Lấy coupon sắp hết hạn
     */
    @Query("SELECT c FROM Coupon c WHERE c.status = 'ACTIVE' " +
           "AND c.expiryDate BETWEEN :now AND :futureDate")
    List<Coupon> findExpiringCoupons(
            @Param("now") LocalDateTime now,
            @Param("futureDate") LocalDateTime futureDate
    );

    /**
     * Lấy tất cả coupon đã hết hạn nhưng vẫn ACTIVE
     */
    @Query("SELECT c FROM Coupon c WHERE c.status = 'ACTIVE' " +
           "AND c.expiryDate < :now")
    List<Coupon> findExpiredActiveCoupons(@Param("now") LocalDateTime now);

    /**
     * Lấy coupon đã hết lượt sử dụng
     */
    @Query("SELECT c FROM Coupon c WHERE c.status = 'ACTIVE' " +
           "AND c.usageLimit IS NOT NULL " +
           "AND c.usageCount >= c.usageLimit")
    List<Coupon> findExhaustedCoupons();
}
