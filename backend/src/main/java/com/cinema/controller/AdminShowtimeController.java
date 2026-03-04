package com.cinema.controller;

import com.cinema.dto.request.BatchScheduleRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.BatchSchedulePreviewResponse;
import com.cinema.dto.response.BatchScheduleResult;
import com.cinema.dto.response.PageResponse;
import com.cinema.dto.response.RoomResponse;
import com.cinema.dto.response.ShowtimeResponse;
import com.cinema.service.ShowtimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/showtimes")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGE_SHOWTIMES')")
public class AdminShowtimeController {

    private final ShowtimeService showtimeService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ShowtimeResponse>>> getShowtimes(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<Long> theaterIds,
            @RequestParam(required = false) List<Long> movieIds,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageResponse<ShowtimeResponse> showtimes = showtimeService.searchShowtimes(startDate, endDate, theaterIds,
                movieIds, page, size);
        return ResponseEntity.ok(ApiResponse.success(showtimes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShowtimeResponse>> getShowtimeById(@PathVariable Long id) {
        ShowtimeResponse showtime = showtimeService.getShowtimeById(id);
        return ResponseEntity.ok(ApiResponse.success(showtime));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ShowtimeResponse>> createShowtime(
            @RequestBody com.cinema.dto.request.ShowtimeRequest request) {
        ShowtimeResponse showtime = showtimeService.createShowtime(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Showtime created", showtime));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ShowtimeResponse>> updateShowtime(@PathVariable Long id,
            @RequestBody com.cinema.dto.request.ShowtimeRequest request) {
        ShowtimeResponse showtime = showtimeService.updateShowtime(id, request);
        return ResponseEntity.ok(ApiResponse.success("Showtime updated", showtime));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteShowtime(@PathVariable Long id) {
        showtimeService.deleteShowtime(id);
        return ResponseEntity.ok(ApiResponse.success("Showtime deleted", null));
    }

    // ======= BATCH SCHEDULE =======

    @PostMapping("/batch/preview")
    public ResponseEntity<ApiResponse<BatchSchedulePreviewResponse>> previewBatchSchedule(
            @RequestBody BatchScheduleRequest request) {
        BatchSchedulePreviewResponse preview = showtimeService.previewBatchSchedule(request);
        return ResponseEntity.ok(ApiResponse.success("Preview lịch chiếu", preview));
    }

    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<BatchScheduleResult>> createBatchSchedule(
            @RequestBody BatchScheduleRequest request) {
        BatchScheduleResult result = showtimeService.createBatchSchedule(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(result.getMessage(), result));
    }

    @GetMapping("/room-suggestions")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getRoomSuggestions(
            @RequestParam Long movieId,
            @RequestParam Long theaterId) {
        List<RoomResponse> rooms = showtimeService.getRoomSuggestions(movieId, theaterId);
        return ResponseEntity.ok(ApiResponse.success("Gợi ý phòng chiếu", rooms));
    }
}
