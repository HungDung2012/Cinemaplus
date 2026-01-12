package com.cinema.repository;

import com.cinema.model.Seat;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
    
    List<Seat> findByRoomId(Long roomId);
    
    List<Seat> findByRoomIdAndActiveTrue(Long roomId);
    
    List<Seat> findByRoomIdAndSeatType(Long roomId, Seat.SeatType seatType);
    
    @Query("SELECT s FROM Seat s WHERE s.room.id = :roomId ORDER BY s.rowName, s.seatNumber")
    List<Seat> findByRoomIdOrderByRowAndNumber(@Param("roomId") Long roomId);
    
    /**
     * Lấy danh sách ghế theo ID với PESSIMISTIC_WRITE lock.
     * Đảm bảo không có transaction khác có thể đọc/ghi các ghế này trong khi đang xử lý.
     * Sử dụng để tránh race condition khi nhiều người đặt cùng ghế.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Seat s WHERE s.id IN :seatIds ORDER BY s.rowName, s.seatNumber")
    List<Seat> findByIdsWithLock(@Param("seatIds") List<Long> seatIds);
    
    /**
     * Lấy ghế theo ID kèm thông tin Room (EAGER fetch để tránh N+1).
     */
    @Query("SELECT s FROM Seat s JOIN FETCH s.room WHERE s.id IN :seatIds")
    List<Seat> findByIdsWithRoom(@Param("seatIds") List<Long> seatIds);
}
