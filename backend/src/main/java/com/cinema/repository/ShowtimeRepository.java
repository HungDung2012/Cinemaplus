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
}
