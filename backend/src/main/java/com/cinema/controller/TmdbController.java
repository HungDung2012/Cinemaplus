package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.tmdb.TmdbMovieDto;
import com.cinema.dto.tmdb.TmdbMovieListResponse;
import com.cinema.model.Movie;
import com.cinema.scheduler.MovieStatusScheduler;
import com.cinema.service.TmdbService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/tmdb")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class TmdbController {

    private final TmdbService tmdbService;
    private final MovieStatusScheduler movieStatusScheduler;

    /**
     * Xem trước danh sách phim đang chiếu từ TMDB (chưa import)
     */
    @GetMapping("/preview/now-playing")
    public ResponseEntity<ApiResponse<TmdbMovieListResponse>> previewNowPlaying(
            @RequestParam(defaultValue = "1") int page) {
        TmdbMovieListResponse movies = tmdbService.getNowPlayingMovies(page);
        return ResponseEntity.ok(ApiResponse.success("Preview phim đang chiếu từ TMDB", movies));
    }

    /**
     * Xem trước danh sách phim sắp chiếu từ TMDB (chưa import)
     */
    @GetMapping("/preview/upcoming")
    public ResponseEntity<ApiResponse<TmdbMovieListResponse>> previewUpcoming(
            @RequestParam(defaultValue = "1") int page) {
        TmdbMovieListResponse movies = tmdbService.getUpcomingMovies(page);
        return ResponseEntity.ok(ApiResponse.success("Preview phim sắp chiếu từ TMDB", movies));
    }

    @GetMapping("/preview/popular")
    public ResponseEntity<ApiResponse<TmdbMovieListResponse>> previewPopular(
            @RequestParam(defaultValue = "1") int page) {
        TmdbMovieListResponse movies = tmdbService.getPopularMovies(page);
        return ResponseEntity.ok(ApiResponse.success("Preview phim phổ biến từ TMDB", movies));
    }

    /**
     * Xem trước danh sách phim đã chiếu từ TMDB (phim cũ)
     */
    @GetMapping("/preview/ended")
    public ResponseEntity<ApiResponse<TmdbMovieListResponse>> previewEnded(
            @RequestParam(defaultValue = "1") int page) {
        TmdbMovieListResponse movies = tmdbService.getEndedMovies(page);
        return ResponseEntity.ok(ApiResponse.success("Preview phim đã chiếu từ TMDB", movies));
    }

    /**
     * Xem trước phim theo năm phát hành
     */
    @GetMapping("/preview/by-year/{year}")
    public ResponseEntity<ApiResponse<TmdbMovieListResponse>> previewByYear(
            @PathVariable int year,
            @RequestParam(defaultValue = "1") int page) {
        TmdbMovieListResponse movies = tmdbService.discoverMoviesByYear(year, page);
        return ResponseEntity.ok(ApiResponse.success("Preview phim năm " + year + " từ TMDB", movies));
    }

    /**
     * Xem trước phim đã được đánh giá cao từ TMDB
     */
    @GetMapping("/preview/top-rated")
    public ResponseEntity<ApiResponse<TmdbMovieListResponse>> previewTopRated(
            @RequestParam(defaultValue = "1") int page) {
        TmdbMovieListResponse movies = tmdbService.getTopRatedMovies(page);
        return ResponseEntity.ok(ApiResponse.success("Preview phim đánh giá cao từ TMDB", movies));
    }

    /**
     * Tìm kiếm phim trên TMDB
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<TmdbMovieListResponse>> searchMovies(
            @RequestParam String query,
            @RequestParam(defaultValue = "1") int page) {
        TmdbMovieListResponse movies = tmdbService.searchMovies(query, page);
        return ResponseEntity.ok(ApiResponse.success("Kết quả tìm kiếm từ TMDB", movies));
    }

    /**
     * Xem chi tiết phim từ TMDB (chưa import)
     */
    @GetMapping("/preview/{tmdbId}")
    public ResponseEntity<ApiResponse<TmdbMovieDto>> previewMovieDetails(@PathVariable Long tmdbId) {
        TmdbMovieDto movie = tmdbService.getMovieDetails(tmdbId);
        if (movie == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.success("Chi tiết phim từ TMDB", movie));
    }

    /**
     * Sync phim từ TMDB vào database
     * @param type: now_playing (đang chiếu), upcoming (sắp chiếu)
     * @param pages: số trang cần import (mỗi trang ~20 phim)
     */
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncMovies(
            @RequestParam(defaultValue = "now_playing") String type,
            @RequestParam(defaultValue = "5") int pages) {
        Map<String, Object> result = tmdbService.syncMovies(type, pages);
        return ResponseEntity.ok(ApiResponse.success("Đồng bộ phim từ TMDB hoàn tất", result));
    }

    /**
     * Sync nhiều loại phim cùng lúc (now_playing + upcoming)
     * Mặc định: 10 trang now_playing + 10 trang upcoming = ~400 phim
     */
    @PostMapping("/sync-all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncAllMovies(
            @RequestParam(defaultValue = "10") int nowPlayingPages,
            @RequestParam(defaultValue = "10") int upcomingPages) {
        
        Map<String, Object> nowPlayingResult = tmdbService.syncMovies("now_playing", nowPlayingPages);
        Map<String, Object> upcomingResult = tmdbService.syncMovies("upcoming", upcomingPages);
        
        // Cập nhật trạng thái sau khi sync
        int statusUpdated = movieStatusScheduler.forceUpdateAllStatuses();
        
        Map<String, Object> combinedResult = new HashMap<>();
        combinedResult.put("nowPlaying", nowPlayingResult);
        combinedResult.put("upcoming", upcomingResult);
        combinedResult.put("statusUpdated", statusUpdated);
        
        return ResponseEntity.ok(ApiResponse.success("Đồng bộ tất cả phim hoàn tất", combinedResult));
    }

    /**
     * Import 1 phim cụ thể theo TMDB ID
     */
    @PostMapping("/import/{tmdbId}")
    public ResponseEntity<ApiResponse<Movie>> importMovieById(@PathVariable Long tmdbId) {
        Movie movie = tmdbService.syncMovieById(tmdbId);
        return ResponseEntity.ok(ApiResponse.success("Import phim thành công", movie));
    }

    /**
     * Sync phim đã chiếu (phim cũ) từ TMDB
     */
    @PostMapping("/sync-ended")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncEndedMovies(
            @RequestParam(defaultValue = "5") int pages) {
        Map<String, Object> result = tmdbService.syncMovies("ended", pages);
        return ResponseEntity.ok(ApiResponse.success("Đồng bộ phim đã chiếu từ TMDB hoàn tất", result));
    }

    /**
     * Sync phim theo năm từ TMDB
     */
    @PostMapping("/sync-by-year/{year}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncMoviesByYear(
            @PathVariable int year,
            @RequestParam(defaultValue = "3") int pages) {
        Map<String, Object> result = tmdbService.syncMoviesByYear(year, pages);
        return ResponseEntity.ok(ApiResponse.success("Đồng bộ phim năm " + year + " từ TMDB hoàn tất", result));
    }

    /**
     * Cập nhật trạng thái tất cả phim (thủ công)
     * Trạng thái tự động dựa trên ngày chiếu:
     * - COMING_SOON: chưa đến ngày chiếu
     * - NOW_SHOWING: trong vòng 2 tháng từ ngày chiếu
     * - ENDED: quá 2 tháng
     */
    @PostMapping("/update-statuses")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateMovieStatuses() {
        int updated = movieStatusScheduler.forceUpdateAllStatuses();
        Map<String, Object> result = new HashMap<>();
        result.put("updated", updated);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái phim hoàn tất", result));
    }
}
