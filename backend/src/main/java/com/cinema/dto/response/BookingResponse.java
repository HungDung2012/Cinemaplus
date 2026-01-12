package com.cinema.dto.response;

import com.cinema.model.Booking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private String bookingCode;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private Integer numberOfSeats;
    private Booking.BookingStatus status;
    private String notes;
    private LocalDateTime createdAt;
    
    // User info
    private Long userId;
    private String userFullName;
    private String userEmail;
    
    // Showtime info
    private Long showtimeId;
    private LocalDate showDate;
    private LocalTime startTime;
    
    // Movie info
    private Long movieId;
    private String movieTitle;
    private String moviePosterUrl;
    
    // Theater info
    private String theaterName;
    private String roomName;
    
    // Seats
    private List<String> seatLabels;
    
    // Payment status
    private String paymentStatus;
}
