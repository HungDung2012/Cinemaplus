package com.cinema.controller;

import com.cinema.dto.request.ShowtimeRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.ShowtimeResponse;
import com.cinema.service.ShowtimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<ApiResponse<List<ShowtimeResponse>>> getShowtimesByMovie(@PathVariable Long movieId) {
        List<ShowtimeResponse> showtimes = showtimeService.getShowtimesByMovie(movieId);
        return ResponseEntity.ok(ApiResponse.success(showtimes));
    }

    @GetMapping("/movie/{movieId}/theater/{theaterId}")
    public ResponseEntity<ApiResponse<List<ShowtimeResponse>>> getShowtimesByMovieAndTheater(
            @PathVariable Long movieId,
            @PathVariable Long theaterId) {
        List<ShowtimeResponse> showtimes = showtimeService.getShowtimesByMovieAndTheater(movieId, theaterId);
        return ResponseEntity.ok(ApiResponse.success(showtimes));
    }

    @GetMapping("/movie/{movieId}/date/{date}")
    public ResponseEntity<ApiResponse<List<ShowtimeResponse>>> getShowtimesByMovieAndDate(
            @PathVariable Long movieId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<ShowtimeResponse> showtimes = showtimeService.getShowtimesByMovieAndDate(movieId, date);
        return ResponseEntity.ok(ApiResponse.success(showtimes));
    }

    @GetMapping("/movie/{movieId}/theater/{theaterId}/date/{date}")
    public ResponseEntity<ApiResponse<List<ShowtimeResponse>>> getShowtimesByMovieTheaterAndDate(
            @PathVariable Long movieId,
            @PathVariable Long theaterId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<ShowtimeResponse> showtimes = showtimeService.getShowtimesByMovieTheaterAndDate(movieId, theaterId, date);
        return ResponseEntity.ok(ApiResponse.success(showtimes));
    }

    @GetMapping("/theater/{theaterId}/date/{date}")
    public ResponseEntity<ApiResponse<List<ShowtimeResponse>>> getShowtimesByTheaterAndDate(
            @PathVariable Long theaterId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<ShowtimeResponse> showtimes = showtimeService.getShowtimesByTheaterAndDate(theaterId, date);
        return ResponseEntity.ok(ApiResponse.success(showtimes));
    }

    @GetMapping("/range")
    public ResponseEntity<ApiResponse<List<ShowtimeResponse>>> getShowtimesByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<ShowtimeResponse> showtimes = showtimeService.getShowtimesByRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(showtimes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShowtimeResponse>> getShowtimeById(@PathVariable Long id) {
        ShowtimeResponse showtime = showtimeService.getShowtimeById(id);
        return ResponseEntity.ok(ApiResponse.success(showtime));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ShowtimeResponse>> createShowtime(@Valid @RequestBody ShowtimeRequest request) {
        ShowtimeResponse showtime = showtimeService.createShowtime(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Showtime created successfully", showtime));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ShowtimeResponse>>> createShowtimesBulk(
            @RequestBody List<@Valid ShowtimeRequest> requests) {
        List<ShowtimeResponse> showtimes = showtimeService.createShowtimesBulk(requests);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Showtimes created successfully", showtimes));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ShowtimeResponse>> updateShowtime(
            @PathVariable Long id,
            @Valid @RequestBody ShowtimeRequest request) {
        ShowtimeResponse showtime = showtimeService.updateShowtime(id, request);
        return ResponseEntity.ok(ApiResponse.success("Showtime updated successfully", showtime));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteShowtime(@PathVariable Long id) {
        showtimeService.deleteShowtime(id);
        return ResponseEntity.ok(ApiResponse.success("Showtime deleted successfully", null));
    }
}
