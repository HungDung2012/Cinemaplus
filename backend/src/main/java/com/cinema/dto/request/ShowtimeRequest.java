package com.cinema.dto.request;

import jakarta.validation.constraints.NotNull;
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
public class ShowtimeRequest {

    @NotNull(message = "Movie ID is required")
    private Long movieId;

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotNull(message = "Show date is required")
    private LocalDate showDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "Base price is required")
    private BigDecimal basePrice;

    private String format;

    private com.cinema.model.Showtime.ShowtimeStatus status;
}
