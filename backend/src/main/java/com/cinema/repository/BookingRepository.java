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
}
