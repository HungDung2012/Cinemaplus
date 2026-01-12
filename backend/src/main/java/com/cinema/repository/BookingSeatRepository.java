package com.cinema.repository;

import com.cinema.model.BookingSeat;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingSeatRepository extends JpaRepository<BookingSeat, Long> {
    
    List<BookingSeat> findByBookingId(Long bookingId);
    
    List<BookingSeat> findByShowtimeId(Long showtimeId);
    
    /**
     * Lấy danh sách ID các ghế đã được đặt cho suất chiếu cụ thể.
     * Chỉ tính các booking có trạng thái PENDING, CONFIRMED hoặc COMPLETED.
     */
    @Query("SELECT bs.seat.id FROM BookingSeat bs WHERE bs.showtime.id = :showtimeId " +
           "AND bs.booking.status NOT IN ('CANCELLED', 'EXPIRED')")
    List<Long> findBookedSeatIdsByShowtime(@Param("showtimeId") Long showtimeId);
    
    /**
     * Kiểm tra một ghế cụ thể đã được đặt cho suất chiếu chưa.
     */
    @Query("SELECT CASE WHEN COUNT(bs) > 0 THEN true ELSE false END FROM BookingSeat bs " +
           "WHERE bs.showtime.id = :showtimeId AND bs.seat.id = :seatId " +
           "AND bs.booking.status NOT IN ('CANCELLED', 'EXPIRED')")
    Boolean isSeatBooked(@Param("showtimeId") Long showtimeId, @Param("seatId") Long seatId);
    
    /**
     * Kiểm tra nhiều ghế cùng lúc đã được đặt chưa (cho validation batch).
     * Trả về danh sách ID các ghế đã bị đặt trong số các ghế được kiểm tra.
     */
    @Query("SELECT bs.seat.id FROM BookingSeat bs " +
           "WHERE bs.showtime.id = :showtimeId " +
           "AND bs.seat.id IN :seatIds " +
           "AND bs.booking.status NOT IN ('CANCELLED', 'EXPIRED')")
    List<Long> findAlreadyBookedSeatIds(@Param("showtimeId") Long showtimeId, 
                                         @Param("seatIds") List<Long> seatIds);
    
    /**
     * Kiểm tra ghế với PESSIMISTIC_WRITE lock để tránh race condition.
     * Sử dụng khi cần đảm bảo tính nhất quán trong môi trường concurrent.
     * Lock sẽ block các transaction khác cho đến khi transaction hiện tại hoàn thành.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT bs FROM BookingSeat bs " +
           "WHERE bs.showtime.id = :showtimeId " +
           "AND bs.seat.id IN :seatIds " +
           "AND bs.booking.status NOT IN ('CANCELLED', 'EXPIRED')")
    List<BookingSeat> findAndLockBookedSeats(@Param("showtimeId") Long showtimeId, 
                                              @Param("seatIds") List<Long> seatIds);
    
    /**
     * Đếm số ghế đã được đặt cho suất chiếu.
     */
    @Query("SELECT COUNT(bs) FROM BookingSeat bs " +
           "WHERE bs.showtime.id = :showtimeId " +
           "AND bs.booking.status NOT IN ('CANCELLED', 'EXPIRED')")
    Long countBookedSeatsByShowtime(@Param("showtimeId") Long showtimeId);
}
