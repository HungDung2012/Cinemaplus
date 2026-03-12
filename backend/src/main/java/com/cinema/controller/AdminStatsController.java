package com.cinema.controller;

import com.cinema.dto.response.AnalyticsOverviewResponse;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.DashboardStatsResponse;
import com.cinema.repository.BookingRepository;
import com.cinema.repository.MovieRepository;
import com.cinema.repository.TheaterRepository;
import com.cinema.repository.UserRepository;
import com.cinema.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminStatsController {

    private final MovieRepository movieRepository;
    private final TheaterRepository theaterRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final AnalyticsService analyticsService;

    // =================== DASHBOARD ===================

    @GetMapping("/dashboard-stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        long totalMovies = movieRepository.count();
        long totalTheaters = theaterRepository.count();
        long totalUsers = userRepository.count();

        Map<String, Object> overall = bookingRepository.getOverallStats();
        long totalBookings = overall.get("totalBookings") != null
                ? ((Number) overall.get("totalBookings")).longValue() : 0;
        BigDecimal totalRevenue = overall.get("totalRevenue") != null
                ? (BigDecimal) overall.get("totalRevenue") : BigDecimal.ZERO;

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1).minusNanos(1);
        long todayBookings = bookingRepository.countByCreatedAtBetween(todayStart, todayEnd);
        BigDecimal todayRevenue = bookingRepository.sumRevenueBetween(todayStart, todayEnd);
        if (todayRevenue == null) todayRevenue = BigDecimal.ZERO;

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

    // =================== LEGACY (backwards compat) ===================

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
        return ResponseEntity.ok(ApiResponse.success(bookingRepository.getRevenueByDate(startDate)));
    }

    // =================== ADVANCED ANALYTICS ===================

    /** Overview KPI with % comparison to previous period */
    @GetMapping("/analytics/overview")
    public ResponseEntity<ApiResponse<AnalyticsOverviewResponse>> getAnalyticsOverview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getOverview(start, end)));
    }

    /** Revenue trend by date (supports custom range) */
    @GetMapping("/analytics/revenue/trend")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getRevenueByDate(start, end)));
    }

    /** Revenue per theater */
    @GetMapping("/analytics/theaters")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueByTheater(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getRevenueByTheater(start, end)));
    }

    /** Revenue per room type (STANDARD_2D, IMAX, VIP_4DX...) */
    @GetMapping("/analytics/room-types")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueByRoomType(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getRevenueByRoomType(start, end)));
    }

    /** Peak day-of-week analysis */
    @GetMapping("/analytics/day-of-week")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueByDayOfWeek(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(90);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getRevenueByDayOfWeek(start, end)));
    }

    /** Peak showtime hour analysis */
    @GetMapping("/analytics/hourly")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueByHour(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(90);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getRevenueByHour(start, end)));
    }

    /** Month-by-month comparison for a given year */
    @GetMapping("/analytics/monthly")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueByMonth(
            @RequestParam(defaultValue = "0") int year) {
        int targetYear = year > 0 ? year : LocalDate.now().getYear();
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getRevenueByMonth(targetYear)));
    }

    /** Revenue by movie genre */
    @GetMapping("/analytics/genres")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueByGenre(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getRevenueByGenre(start, end)));
    }

    /** Top movies by revenue with optional date range */
    @GetMapping("/analytics/movies/top")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopMovies(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : null;
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getRevenueByMovie(start, end, limit)));
    }

    /** Booking status ratio (CONFIRMED/CANCELLED/EXPIRED/PENDING) */
    @GetMapping("/analytics/booking-status")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBookingStatusBreakdown(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getBookingStatusBreakdown(start, end)));
    }

    /** Top customers by total spending */
    @GetMapping("/analytics/customers/top")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopCustomers(
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : null;
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getTopCustomers(start, end, limit)));
    }

    /** New user registration trend */
    @GetMapping("/analytics/customers/growth")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCustomerGrowth(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getNewUsersOverTime(start, end)));
    }

    /** Revenue breakdown by seat type */
    @GetMapping("/analytics/seat-types")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueBySeatType(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getRevenueBySeatType(start, end)));
    }

    /** Top selling food & beverage items */
    @GetMapping("/analytics/food/top")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopSellingFoods(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getTopSellingFoods(start, end, limit)));
    }

    /** F&B revenue by category */
    @GetMapping("/analytics/food/categories")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFoodRevenueByCategory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getFoodRevenueByCategory(start, end)));
    }

}
