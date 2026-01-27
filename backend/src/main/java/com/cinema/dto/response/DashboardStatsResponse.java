package com.cinema.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalMovies;
    private long totalTheaters;
    private long totalUsers;
    private long totalBookings;
    private BigDecimal totalRevenue;
    private long todayBookings;
    private BigDecimal todayRevenue;
}
