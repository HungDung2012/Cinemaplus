package com.cinema.repository;

import com.cinema.model.Booking;
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
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    Optional<Booking> findByBookingCode(String bookingCode);
    
    Page<Booking> findByUserId(Long userId, Pageable pageable);
    
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<Booking> findByShowtimeId(Long showtimeId);
    
    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.createdAt < :expireTime")
    List<Booking> findPendingBookingsToExpire(@Param("status") Booking.BookingStatus status, 
                                               @Param("expireTime") LocalDateTime expireTime);
    
    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId AND b.status = :status")
    List<Booking> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") Booking.BookingStatus status);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.showtime.id = :showtimeId AND b.status NOT IN ('CANCELLED', 'EXPIRED')")
    Long countActiveBookingsByShowtime(@Param("showtimeId") Long showtimeId);

    /**
     * Đếm tổng số booking của user
     */
    Long countByUserId(Long userId);

    /**
     * Tìm kiếm booking với filter cho transaction history
     */
    @Query("SELECT b FROM Booking b " +
           "JOIN FETCH b.showtime s " +
           "JOIN FETCH s.movie m " +
           "JOIN FETCH s.room r " +
           "JOIN FETCH r.theater t " +
           "WHERE b.user.id = :userId " +
           "AND (:search IS NULL OR " +
           "     LOWER(m.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(b.bookingCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:startDate IS NULL OR b.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR b.createdAt <= :endDate) " +
           "ORDER BY b.createdAt DESC")
    Page<Booking> findByUserIdWithFilters(
            @Param("userId") Long userId,
            @Param("search") String search,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * Lấy booking gần đây của user
     */
    List<Booking> findTop5ByUserIdOrderByCreatedAtDesc(Long userId);
}
