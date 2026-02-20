package com.cinema.service;

import com.cinema.dto.response.AnalyticsOverviewResponse;
import com.cinema.repository.BookingFoodRepository;
import com.cinema.repository.BookingRepository;
import com.cinema.repository.BookingSeatRepository;
import com.cinema.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final BookingFoodRepository bookingFoodRepository;
    private final UserRepository userRepository;

    /**
     * Overview KPI dashboard — current period vs previous period comparison.
     */
    public AnalyticsOverviewResponse getOverview(LocalDateTime startDate, LocalDateTime endDate) {
        // Period length in millis to calculate previous period
        long periodMillis = java.time.Duration.between(startDate, endDate).toMillis();
        LocalDateTime prevStart = startDate.minus(java.time.Duration.ofMillis(periodMillis));
        LocalDateTime prevEnd = startDate.minusNanos(1);

        Map<String, Object> current = bookingRepository.getStatsForPeriod(startDate, endDate);
        Map<String, Object> previous = bookingRepository.getStatsForPeriod(prevStart, prevEnd);

        BigDecimal currentRevenue = getDecimal(current, "revenue");
        BigDecimal prevRevenue = getDecimal(previous, "revenue");
        long currentBookings = getLong(current, "bookingCount");
        long prevBookings = getLong(previous, "bookingCount");
        long currentTickets = getLong(current, "ticketCount");
        long prevTickets = getLong(previous, "ticketCount");
        BigDecimal currentAvgOrder = getDecimal(current, "avgOrderValue");
        BigDecimal prevAvgOrder = getDecimal(previous, "avgOrderValue");

        BigDecimal foodRevenue = bookingRepository.getTotalFoodRevenue(startDate, endDate);
        BigDecimal prevFoodRevenue = bookingRepository.getTotalFoodRevenue(prevStart, prevEnd);

        Long newUsers = userRepository.countNewUsersInPeriod(startDate, endDate);
        Long prevNewUsers = userRepository.countNewUsersInPeriod(prevStart, prevEnd);

        return AnalyticsOverviewResponse.builder()
                .revenue(currentRevenue)
                .revenuePrevPeriod(prevRevenue)
                .revenueChangePercent(calcChangePercent(prevRevenue, currentRevenue))
                .bookingCount(currentBookings)
                .bookingCountPrevPeriod(prevBookings)
                .bookingCountChangePercent(calcChangePercent(BigDecimal.valueOf(prevBookings), BigDecimal.valueOf(currentBookings)))
                .ticketCount(currentTickets)
                .ticketCountPrevPeriod(prevTickets)
                .ticketCountChangePercent(calcChangePercent(BigDecimal.valueOf(prevTickets), BigDecimal.valueOf(currentTickets)))
                .avgOrderValue(currentAvgOrder)
                .avgOrderValuePrevPeriod(prevAvgOrder)
                .avgOrderValueChangePercent(calcChangePercent(prevAvgOrder, currentAvgOrder))
                .foodRevenue(foodRevenue != null ? foodRevenue : BigDecimal.ZERO)
                .foodRevenuePrevPeriod(prevFoodRevenue != null ? prevFoodRevenue : BigDecimal.ZERO)
                .foodRevenueChangePercent(calcChangePercent(
                        prevFoodRevenue != null ? prevFoodRevenue : BigDecimal.ZERO,
                        foodRevenue != null ? foodRevenue : BigDecimal.ZERO))
                .newUsers(newUsers != null ? newUsers : 0L)
                .newUsersPrevPeriod(prevNewUsers != null ? prevNewUsers : 0L)
                .newUsersChangePercent(calcChangePercent(
                        BigDecimal.valueOf(prevNewUsers != null ? prevNewUsers : 0L),
                        BigDecimal.valueOf(newUsers != null ? newUsers : 0L)))
                .build();
    }

    public List<Map<String, Object>> getRevenueByDate(LocalDateTime startDate, LocalDateTime endDate) {
        return bookingRepository.getRevenueByDateRange(startDate, endDate);
    }

    public List<Map<String, Object>> getRevenueByTheater(LocalDateTime startDate, LocalDateTime endDate) {
        return bookingRepository.getRevenueByTheater(startDate, endDate);
    }

    public List<Map<String, Object>> getRevenueByRoomType(LocalDateTime startDate, LocalDateTime endDate) {
        return bookingRepository.getRevenueByRoomType(startDate, endDate);
    }

    public List<Map<String, Object>> getRevenueByDayOfWeek(LocalDateTime startDate, LocalDateTime endDate) {
        return bookingRepository.getRevenueByDayOfWeek(startDate, endDate);
    }

    public List<Map<String, Object>> getRevenueByHour(LocalDateTime startDate, LocalDateTime endDate) {
        return bookingRepository.getRevenueByHour(startDate, endDate);
    }

    public List<Map<String, Object>> getRevenueByMonth(int year) {
        return bookingRepository.getRevenueByMonth(year);
    }

    public List<Map<String, Object>> getRevenueByGenre(LocalDateTime startDate, LocalDateTime endDate) {
        return bookingRepository.getRevenueByGenre(startDate, endDate);
    }

    public List<Map<String, Object>> getRevenueByMovie(LocalDateTime startDate, LocalDateTime endDate, int limit) {
        return bookingRepository.getRevenueByMovieInRange(startDate, endDate, PageRequest.of(0, limit));
    }

    public List<Map<String, Object>> getBookingStatusBreakdown(LocalDateTime startDate, LocalDateTime endDate) {
        return bookingRepository.getBookingStatusBreakdown(startDate, endDate);
    }

    public List<Map<String, Object>> getTopCustomers(LocalDateTime startDate, LocalDateTime endDate, int limit) {
        return bookingRepository.getTopCustomers(startDate, endDate, PageRequest.of(0, limit));
    }

    public List<Map<String, Object>> getNewUsersOverTime(LocalDateTime startDate, LocalDateTime endDate) {
        return userRepository.getNewUsersOverTime(startDate, endDate);
    }

    public List<Map<String, Object>> getRevenueBySeatType(LocalDateTime startDate, LocalDateTime endDate) {
        return bookingSeatRepository.getRevenueBySeatType(startDate, endDate);
    }

    public List<Map<String, Object>> getTopSellingFoods(LocalDateTime startDate, LocalDateTime endDate, int limit) {
        return bookingFoodRepository.getTopSellingFoods(startDate, endDate, PageRequest.of(0, limit));
    }

    public List<Map<String, Object>> getFoodRevenueByCategory(LocalDateTime startDate, LocalDateTime endDate) {
        return bookingFoodRepository.getFoodRevenueByCategory(startDate, endDate);
    }

    // ==================== HELPERS ====================

    private BigDecimal getDecimal(Map<String, Object> map, String key) {
        if (map == null || map.get(key) == null) return BigDecimal.ZERO;
        Object val = map.get(key);
        if (val instanceof BigDecimal) return (BigDecimal) val;
        if (val instanceof Number) return BigDecimal.valueOf(((Number) val).doubleValue());
        return BigDecimal.ZERO;
    }

    private long getLong(Map<String, Object> map, String key) {
        if (map == null || map.get(key) == null) return 0L;
        Object val = map.get(key);
        if (val instanceof Number) return ((Number) val).longValue();
        return 0L;
    }

    private double calcChangePercent(BigDecimal prev, BigDecimal current) {
        if (prev == null || prev.compareTo(BigDecimal.ZERO) == 0) {
            return current != null && current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        return current.subtract(prev)
                .divide(prev, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }
}
