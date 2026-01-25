package com.cinema.repository;

import com.cinema.model.UserVoucher;
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
public interface UserVoucherRepository extends JpaRepository<UserVoucher, Long> {

       /**
        * Lấy tất cả voucher của user
        */
       List<UserVoucher> findByUserIdOrderByRedeemedAtDesc(Long userId);

       /**
        * Lấy voucher của user với phân trang
        */
       Page<UserVoucher> findByUserIdOrderByRedeemedAtDesc(Long userId, Pageable pageable);

       /**
        * Lấy voucher theo trạng thái
        */
       List<UserVoucher> findByUserIdAndStatusOrderByRedeemedAtDesc(
                     Long userId,
                     UserVoucher.UseStatus status);

       /**
        * Lấy voucher có thể sử dụng của user
        */
       @Query("SELECT uv FROM UserVoucher uv " +
                     "JOIN FETCH uv.voucher v " +
                     "WHERE uv.user.id = :userId " +
                     "AND uv.status = 'AVAILABLE' " +
                     "AND v.status = 'ACTIVE' " +
                     "AND (v.expiryDate IS NULL OR v.expiryDate >= :now)")
       List<UserVoucher> findAvailableVouchersForUser(@Param("userId") Long userId, @Param("now") LocalDateTime now);

       /**
        * Kiểm tra user đã có voucher này chưa
        */
       boolean existsByUserIdAndVoucherId(Long userId, Long voucherId);

       /**
        * Tìm UserVoucher cụ thể
        */
       Optional<UserVoucher> findByUserIdAndVoucherId(Long userId, Long voucherId);

       /**
        * Đếm số voucher theo trạng thái
        */
       Long countByUserIdAndStatus(Long userId, UserVoucher.UseStatus status);

       /**
        * Đếm tổng voucher của user
        */
       Long countByUserId(Long userId);

       /**
        * Lấy voucher sắp hết hạn của user (trong khoảng thời gian)
        */
       @Query("SELECT uv FROM UserVoucher uv " +
                     "JOIN uv.voucher v " +
                     "WHERE uv.user.id = :userId " +
                     "AND uv.status = 'AVAILABLE' " +
                     "AND v.expiryDate BETWEEN :now AND :futureDate")
       List<UserVoucher> findExpiringUserVouchers(
                     @Param("userId") Long userId,
                     @Param("now") LocalDateTime now,
                     @Param("futureDate") LocalDateTime futureDate);

       /**
        * Lấy tất cả UserVoucher có voucher đã hết hạn nhưng status vẫn AVAILABLE
        */
       @Query("SELECT uv FROM UserVoucher uv " +
                     "JOIN uv.voucher v " +
                     "WHERE uv.status = 'AVAILABLE' " +
                     "AND v.expiryDate < :now")
       List<UserVoucher> findExpiredAvailableUserVouchers(@Param("now") LocalDateTime now);
}
