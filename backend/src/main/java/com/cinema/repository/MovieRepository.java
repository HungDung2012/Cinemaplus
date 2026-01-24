package com.cinema.repository;

import com.cinema.model.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {

        Page<Movie> findByStatus(Movie.MovieStatus status, Pageable pageable);

        List<Movie> findByStatusOrderByReleaseDateDesc(Movie.MovieStatus status);

        @Query("SELECT m FROM Movie m WHERE m.status = :status AND m.releaseDate <= :date AND (m.endDate IS NULL OR m.endDate >= :date)")
        List<Movie> findNowShowingMovies(@Param("status") Movie.MovieStatus status, @Param("date") LocalDate date);

        @Query("SELECT m FROM Movie m WHERE " +
                        "(:keyword IS NULL OR :keyword = '' OR m.title LIKE CONCAT('%', :keyword, '%')) AND "
                        +
                        "(:status IS NULL OR m.status = :status)")
        Page<Movie> searchAndFilterMovies(@Param("keyword") String keyword,
                        @Param("status") Movie.MovieStatus status,
                        Pageable pageable);

        @Query("SELECT m FROM Movie m WHERE m.title LIKE CONCAT('%', :keyword, '%') OR m.genre LIKE CONCAT('%', :keyword, '%')")
        Page<Movie> searchMovies(@Param("keyword") String keyword, Pageable pageable);

        List<Movie> findByGenreContaining(String genre);

        @Query("SELECT DISTINCT m.genre FROM Movie m WHERE m.genre IS NOT NULL")
        List<String> findAllGenres();
}
