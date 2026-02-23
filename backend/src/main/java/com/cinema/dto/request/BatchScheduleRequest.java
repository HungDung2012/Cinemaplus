package com.cinema.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class BatchScheduleRequest {

    @NotNull
    private Long movieId;

    @NotEmpty
    private List<Long> roomIds;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    /** Time slots in "HH:mm" format, e.g. ["09:00", "13:00", "17:00"] */
    @NotEmpty
    private List<String> timeSlots;

    @NotNull
    private BigDecimal basePrice;

    /** Minutes of ads/trailers before the feature film (default 15) */
    private int adsDuration = 15;

    /** Minutes to clean the room after the feature film ends (default 15) */
    private int cleaningDuration = 15;
}
