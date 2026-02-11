package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.DashboardStatsResponse;
import com.cinema.model.AuditLog;
import com.cinema.repository.AuditLogRepository;
import com.cinema.repository.BookingRepository;
import com.cinema.repository.MovieRepository;
import com.cinema.repository.TheaterRepository;
import com.cinema.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatsController {

    private final MovieRepository movieRepository;
    private final TheaterRepository theaterRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping("/dashboard-stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        long totalMovies = movieRepository.count();
        long totalTheaters = theaterRepository.count();
        long totalUsers = userRepository.count();

        // Overall booking stats
        Map<String, Object> overall = bookingRepository.getOverallStats();
        long totalBookings = overall.get("totalBookings") != null ? ((Number) overall.get("totalBookings")).longValue()
                : 0;
        BigDecimal totalRevenue = overall.get("totalRevenue") != null
                ? (BigDecimal) overall.get("totalRevenue")
                : BigDecimal.ZERO;

        // Today's stats
        LocalDateTime todayStart = java.time.LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1).minusNanos(1);

        long todayBookings = bookingRepository.countByCreatedAtBetween(todayStart, todayEnd);
        BigDecimal todayRevenue = bookingRepository.sumRevenueBetween(todayStart, todayEnd);
        if (todayRevenue == null)
            todayRevenue = BigDecimal.ZERO;

        DashboardStatsResponse stats = DashboardStatsResponse.builder()
                .totalMovies(totalMovies)
                .totalTheaters(totalTheaters)
                .totalUsers(totalUsers)
                .totalBookings(totalBookings)
                .totalRevenue(totalRevenue)
                .todayBookings(todayBookings)
                .todayRevenue(todayRevenue)
                .build();

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // =================== ANALYTICS ===================
    @GetMapping("/analytics/overall")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverallStats() {
        return ResponseEntity.ok(ApiResponse.success(bookingRepository.getOverallStats()));
    }

    @GetMapping("/analytics/movies")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueByMovie(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success(
                bookingRepository.getRevenueByMovie(PageRequest.of(0, limit))));
    }

    @GetMapping("/analytics/revenue")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueByDate(
            @RequestParam(defaultValue = "30") int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return ResponseEntity.ok(ApiResponse.success(
                bookingRepository.getRevenueByDate(startDate)));
    }

    // =================== AUDIT LOGS ===================
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<AuditLog> logs = auditLogRepository.findAllByOrderByTimestampDesc(
                PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
