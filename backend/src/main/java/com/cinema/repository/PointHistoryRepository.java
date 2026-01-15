package com.cinema.repository;

import com.cinema.model.PointHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PointHistoryRepository extends JpaRepository<PointHistory, Long> {

    /**
     * Lấy lịch sử điểm theo user với phân trang
     */
    Page<PointHistory> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Lấy lịch sử điểm theo user và loại giao dịch
     */
    Page<PointHistory> findByUserIdAndTransactionTypeOrderByCreatedAtDesc(
            Long userId, 
            PointHistory.TransactionType transactionType, 
            Pageable pageable
    );

    /**
     * Lấy lịch sử điểm trong khoảng thời gian
     */
    @Query("SELECT ph FROM PointHistory ph WHERE ph.user.id = :userId " +
           "AND ph.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY ph.createdAt DESC")
    Page<PointHistory> findByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * Lấy lịch sử điểm với filter đầy đủ
     */
    @Query("SELECT ph FROM PointHistory ph WHERE ph.user.id = :userId " +
           "AND (:transactionType IS NULL OR ph.transactionType = :transactionType) " +
           "AND (:startDate IS NULL OR ph.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR ph.createdAt <= :endDate) " +
           "ORDER BY ph.createdAt DESC")
    Page<PointHistory> findByUserIdWithFilters(
            @Param("userId") Long userId,
            @Param("transactionType") PointHistory.TransactionType transactionType,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * Tính tổng điểm đã đổi
     */
    @Query("SELECT COALESCE(SUM(ABS(ph.points)), 0) FROM PointHistory ph " +
           "WHERE ph.user.id = :userId AND ph.transactionType = 'REDEEMED'")
    Integer getTotalPointsRedeemed(@Param("userId") Long userId);

    /**
     * Lấy các giao dịch gần đây
     */
    List<PointHistory> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Đếm số giao dịch theo loại
     */
    @Query("SELECT COUNT(ph) FROM PointHistory ph " +
           "WHERE ph.user.id = :userId AND ph.transactionType = :type")
    Long countByUserIdAndTransactionType(
            @Param("userId") Long userId,
            @Param("type") PointHistory.TransactionType type
    );

    /**
     * Lấy điểm tích lũy cho một booking cụ thể
     */
    @Query("SELECT COALESCE(SUM(ph.points), 0) FROM PointHistory ph " +
           "WHERE ph.referenceId = :bookingId AND ph.referenceType = 'BOOKING' " +
           "AND ph.transactionType = 'EARNED'")
    Integer getPointsEarnedByBookingId(@Param("bookingId") Long bookingId);

    /**
     * Lấy điểm đã sử dụng cho một booking cụ thể
     */
    @Query("SELECT COALESCE(SUM(ABS(ph.points)), 0) FROM PointHistory ph " +
           "WHERE ph.referenceId = :bookingId AND ph.referenceType = 'BOOKING' " +
           "AND ph.transactionType = 'REDEEMED'")
    Integer getPointsUsedByBookingId(@Param("bookingId") Long bookingId);
}
