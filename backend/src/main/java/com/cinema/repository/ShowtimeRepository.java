package com.cinema.repository;

import com.cinema.model.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {

       List<Showtime> findByMovieId(Long movieId);

       List<Showtime> findByRoomId(Long roomId);

       List<Showtime> findByShowDate(LocalDate showDate);

       List<Showtime> findByRoomIdAndShowDate(Long roomId, LocalDate showDate);

       List<Showtime> findByMovieIdAndRoomTheaterIdOrderByShowDateAscStartTimeAsc(Long movieId, Long theaterId);

       @Query("SELECT s FROM Showtime s WHERE s.movie.id = :movieId AND s.showDate = :date AND s.status = 'AVAILABLE'")
       List<Showtime> findAvailableByMovieAndDate(@Param("movieId") Long movieId, @Param("date") LocalDate date);

       @Query("SELECT s FROM Showtime s WHERE s.movie.id = :movieId AND s.showDate >= :startDate AND s.showDate <= :endDate")
       List<Showtime> findByMovieAndDateRange(@Param("movieId") Long movieId,
                     @Param("startDate") LocalDate startDate,
                     @Param("endDate") LocalDate endDate);

       @Query("SELECT s FROM Showtime s WHERE s.room.theater.id = :theaterId AND s.showDate = :date")
       List<Showtime> findByTheaterAndDate(@Param("theaterId") Long theaterId, @Param("date") LocalDate date);

       @Query("SELECT s FROM Showtime s WHERE s.movie.id = :movieId AND s.room.theater.id = :theaterId AND s.showDate = :date")
       List<Showtime> findByMovieTheaterAndDate(@Param("movieId") Long movieId,
                     @Param("theaterId") Long theaterId,
                     @Param("date") LocalDate date);

       /**
        * Lấy lịch chiếu trong khoảng thời gian (cho Admin/Manager)
        */
       @Query("SELECT s FROM Showtime s WHERE s.showDate BETWEEN :startDate AND :endDate ORDER BY s.showDate ASC, s.startTime ASC")
       List<Showtime> findByShowDateBetween(@Param("startDate") LocalDate startDate,
                     @Param("endDate") LocalDate endDate);

       @Query("SELECT s FROM Showtime s " +
                     "JOIN FETCH s.movie m " +
                     "JOIN FETCH s.room r " +
                     "JOIN FETCH r.theater t " +
                     "WHERE s.showDate BETWEEN :startDate AND :endDate " +
                     "ORDER BY s.showDate ASC, s.startTime ASC")
       List<Showtime> findByShowDateBetweenWithDetails(@Param("startDate") LocalDate startDate,
                     @Param("endDate") LocalDate endDate);

       /**
        * Lấy lịch chiếu theo rạp và ngày, sắp xếp theo phim và giờ chiếu
        */
       @Query("SELECT s FROM Showtime s " +
                     "JOIN FETCH s.movie m " +
                     "JOIN FETCH s.room r " +
                     "WHERE r.theater.id = :theaterId " +
                     "AND s.showDate = :date " +
                     "AND s.status = 'AVAILABLE' " +
                     "ORDER BY m.title, r.roomType, s.startTime")
       List<Showtime> findByTheaterAndDateWithDetails(@Param("theaterId") Long theaterId,
                     @Param("date") LocalDate date);

       /**
        * Check overlapping showtimes in the same room
        */
       @Query("SELECT s FROM Showtime s " +
                     "WHERE s.room.id = :roomId " +
                     "AND s.id != :excludedId " + // Exclude itself when updating
                     "AND s.showDate = :date " +
                     "AND s.status != 'CANCELLED' " +
                     "AND (" +
                     "   (s.startTime <= :endTime AND s.endTime >= :startTime)" +
                     ")")
       List<Showtime> checkOverlap(@Param("roomId") Long roomId,
                     @Param("excludedId") Long excludedId,
                     @Param("date") LocalDate date,
                     @Param("startTime") java.time.LocalTime startTime,
                     @Param("endTime") java.time.LocalTime endTime);

       @Query("SELECT s FROM Showtime s " +
                     "JOIN FETCH s.movie m " +
                     "JOIN FETCH s.room r " +
                     "JOIN FETCH r.theater t " +
                     "WHERE (:startDate IS NULL OR s.showDate >= :startDate) " +
                     "AND (:endDate IS NULL OR s.showDate <= :endDate) " +
                     "AND (:theaterIds IS NULL OR r.theater.id IN :theaterIds) " +
                     "AND (:movieIds IS NULL OR s.movie.id IN :movieIds) " +
                     "ORDER BY s.showDate DESC, s.startTime ASC")
       org.springframework.data.domain.Page<Showtime> searchShowtimes(
                     @Param("startDate") LocalDate startDate,
                     @Param("endDate") LocalDate endDate,
                     @Param("theaterIds") List<Long> theaterIds,
                     @Param("movieIds") List<Long> movieIds,
                     org.springframework.data.domain.Pageable pageable);

}
