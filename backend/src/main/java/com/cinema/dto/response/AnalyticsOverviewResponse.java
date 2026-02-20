package com.cinema.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AnalyticsOverviewResponse {

    // Revenue
    private BigDecimal revenue;
    private BigDecimal revenuePrevPeriod;
    private double revenueChangePercent;

    // Bookings
    private long bookingCount;
    private long bookingCountPrevPeriod;
    private double bookingCountChangePercent;

    // Tickets
    private long ticketCount;
    private long ticketCountPrevPeriod;
    private double ticketCountChangePercent;

    // Avg order value
    private BigDecimal avgOrderValue;
    private BigDecimal avgOrderValuePrevPeriod;
    private double avgOrderValueChangePercent;

    // F&B revenue
    private BigDecimal foodRevenue;
    private BigDecimal foodRevenuePrevPeriod;
    private double foodRevenueChangePercent;

    // New users
    private long newUsers;
    private long newUsersPrevPeriod;
    private double newUsersChangePercent;
}
