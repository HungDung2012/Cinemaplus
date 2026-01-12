package com.cinema.scheduler;

import com.cinema.model.Movie;
import com.cinema.model.Movie.MovieStatus;
import com.cinema.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduler tự động cập nhật trạng thái phim dựa trên ngày chiếu
 * - COMING_SOON: Phim chưa đến ngày chiếu
 * - NOW_SHOWING: Phim đang trong thời gian chiếu (từ ngày release đến 2 tháng sau)
 * - ENDED: Phim đã hết thời gian chiếu (quá 2 tháng)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MovieStatusScheduler {

    private final MovieRepository movieRepository;

    /**
     * Chạy mỗi ngày lúc 00:05 để cập nhật trạng thái phim
     */
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void updateMovieStatuses() {
        log.info("Starting scheduled movie status update...");
        
        LocalDate today = LocalDate.now();
        int updated = 0;
        
        List<Movie> allMovies = movieRepository.findAll();
        
        for (Movie movie : allMovies) {
            MovieStatus newStatus = calculateStatus(movie.getReleaseDate(), today);
            
            if (movie.getStatus() != newStatus) {
                MovieStatus oldStatus = movie.getStatus();
                movie.setStatus(newStatus);
                movieRepository.save(movie);
                updated++;
                log.debug("Updated movie '{}': {} -> {}", movie.getTitle(), oldStatus, newStatus);
            }
        }
        
        log.info("Movie status update completed. Updated {} movies.", updated);
    }

    /**
     * Tính trạng thái phim dựa trên ngày chiếu
     * @param releaseDate Ngày khởi chiếu
     * @param today Ngày hiện tại
     * @return Trạng thái phim
     */
    public MovieStatus calculateStatus(LocalDate releaseDate, LocalDate today) {
        if (releaseDate == null) {
            return MovieStatus.COMING_SOON;
        }
        
        if (releaseDate.isAfter(today)) {
            // Chưa đến ngày chiếu
            return MovieStatus.COMING_SOON;
        } else if (releaseDate.plusMonths(2).isAfter(today)) {
            // Trong vòng 2 tháng kể từ ngày chiếu
            return MovieStatus.NOW_SHOWING;
        } else {
            // Quá 2 tháng kể từ ngày chiếu
            return MovieStatus.ENDED;
        }
    }

    /**
     * Method thủ công để Admin có thể trigger cập nhật ngay lập tức
     */
    @Transactional
    public int forceUpdateAllStatuses() {
        log.info("Force updating all movie statuses...");
        
        LocalDate today = LocalDate.now();
        int updated = 0;
        
        List<Movie> allMovies = movieRepository.findAll();
        
        for (Movie movie : allMovies) {
            MovieStatus newStatus = calculateStatus(movie.getReleaseDate(), today);
            movie.setStatus(newStatus);
            movieRepository.save(movie);
            updated++;
        }
        
        log.info("Force update completed. Updated {} movies.", updated);
        return updated;
    }
}
