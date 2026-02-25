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
public class BatchSchedulePreviewResponse {

    private String movieTitle;
    private int movieDuration;
    /** adsDuration + movieDuration + cleaningDuration */
    private int slotDurationMinutes;
    private int totalSlotsConsidered;
    private int totalToCreate;
    private int totalConflicts;
    private List<ConflictInfo> conflicts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConflictInfo {
        private Long roomId;
        private String roomName;
        private LocalDate date;
        private LocalTime slotTime;
        /** Title + time of the existing showtime that blocks this slot */
        private String conflictWith;
    }
}
