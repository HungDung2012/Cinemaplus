package com.cinema.dto.response;

import com.cinema.model.Showtime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShowtimeResponse {
    private Long id;
    private LocalDate showDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal basePrice;
    private String format;
    private Showtime.ShowtimeStatus status;

    // Movie info
    private Long movieId;
    private String movieTitle;
    private String moviePosterUrl;
    private Integer movieDuration;

    // Room info
    private Long roomId;
    private String roomName;
    private String roomType;

    // Theater info
    private Long theaterId;
    private String theaterName;

    private Integer availableSeats;
}
