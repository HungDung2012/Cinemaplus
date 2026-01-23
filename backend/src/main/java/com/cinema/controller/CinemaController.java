package com.cinema.controller;

import com.cinema.dto.response.CinemaListResponse;
import com.cinema.dto.response.CinemaScheduleResponse;
import com.cinema.service.TheaterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/cinemas")
@RequiredArgsConstructor
@Tag(name = "Cinema", description = "API quản lý rạp chiếu phim")
public class CinemaController {

    private final TheaterService cinemaService;

    /**
     * Lấy danh sách tất cả rạp, nhóm theo thành phố
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách rạp nhóm theo thành phố")
    public ResponseEntity<CinemaListResponse> getAllCinemas() {
        return ResponseEntity.ok(cinemaService.getAllCinemasGroupedByCity());
    }

    /**
     * Lấy danh sách rạp theo City ID
     */
    @GetMapping("/city/{cityId}")
    @Operation(summary = "Lấy danh sách rạp theo City ID")
    public ResponseEntity<List<CinemaListResponse.TheaterSummary>> getTheatersByCityId(
            @Parameter(description = "ID của thành phố") @PathVariable Long cityId) {
        return ResponseEntity.ok(cinemaService.getTheatersByCityId(cityId));
    }

    /**
     * Lấy danh sách rạp theo City code
     */
    @GetMapping("/city/code/{cityCode}")
    @Operation(summary = "Lấy danh sách rạp theo City code")
    public ResponseEntity<List<CinemaListResponse.TheaterSummary>> getTheatersByCityCode(
            @Parameter(description = "Code của thành phố") @PathVariable String cityCode) {
        return ResponseEntity.ok(cinemaService.getTheatersByCityCode(cityCode));
    }

    /**
     * Lấy chi tiết một rạp
     */
    @GetMapping("/{theaterId}")
    @Operation(summary = "Lấy chi tiết một rạp")
    public ResponseEntity<CinemaListResponse.TheaterSummary> getTheaterDetail(
            @Parameter(description = "ID của rạp") @PathVariable Long theaterId) {
        return ResponseEntity.ok(cinemaService.getTheaterDetail(theaterId));
    }

    /**
     * Lấy lịch chiếu của rạp theo ngày
     */
    @GetMapping("/{theaterId}/schedule")
    @Operation(summary = "Lấy lịch chiếu của rạp theo ngày")
    public ResponseEntity<CinemaScheduleResponse> getCinemaSchedule(
            @Parameter(description = "ID của rạp") @PathVariable Long theaterId,
            @Parameter(description = "Ngày xem lịch (yyyy-MM-dd)") 
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        // Mặc định là ngày hôm nay nếu không truyền
        if (date == null) {
            date = LocalDate.now();
        }
        
        return ResponseEntity.ok(cinemaService.getCinemaSchedule(theaterId, date));
    }
}
