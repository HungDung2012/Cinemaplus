package com.cinema.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoSchedulePreviewResponse {

    private int totalShowtimes;
    private int totalConflictsSkipped;
    private int totalWarnings;
    private List<TheaterSchedulePreview> byTheater;
    private List<ConflictDetail> conflicts;
    private List<String> warnings;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TheaterSchedulePreview {
        private Long theaterId;
        private String theaterName;
        private int showtimeCount;
        private List<DateSchedulePreview> byDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DateSchedulePreview {
        private LocalDate date;
        private String dayType; // WEEKDAY, WEEKEND, HOLIDAY
        private int showtimeCount;
        private List<SlotPreview> slots;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlotPreview {
        private Long roomId;
        private String roomName;
        private String roomType;
        private Long movieId;
        private String movieTitle;
        private int movieDuration;
        private LocalTime startTime;
        private LocalTime endTime;
        private String format;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConflictDetail {
        private Long theaterId;
        private String theaterName;
        private Long roomId;
        private String roomName;
        private LocalDate date;
        private LocalTime slotTime;
        private String movieTitle;
        private String reason; // e.g. "Room occupied by Movie X (10:00-12:30)", "DCP limit reached"
    }
}
