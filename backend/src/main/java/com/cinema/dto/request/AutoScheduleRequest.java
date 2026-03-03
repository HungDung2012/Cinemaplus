package com.cinema.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class AutoScheduleRequest {

    @NotEmpty(message = "Phải chọn ít nhất 1 rạp")
    private List<Long> theaterIds;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate endDate;

    /** Primary template ID — used when specific day-type templates are not set */
    private Long templateId;

    /** Override templates per day type (optional — if null, uses templateId) */
    private Long weekdayTemplateId;
    private Long weekendTemplateId;
    private Long holidayTemplateId;

    @NotEmpty(message = "Phải chọn ít nhất 1 phim")
    private List<MovieSelection> movieSelections;

    /**
     * Maximum number of rooms that can screen the same movie concurrently
     * across all selected theaters. Simulates DCP/Key constraint.
     */
    @Min(value = 1, message = "Số phòng chiếu đồng thời tối thiểu là 1")
    private int maxConcurrentScreenings = 2;

    /** Dates marked as holidays (optional) — so the scheduler knows which template to use */
    private List<LocalDate> holidayDates;

    @Data
    public static class MovieSelection {
        @NotNull
        private Long movieId;

        /** 1 = lowest, 5 = highest priority for prime-time slots */
        @Min(1)
        private int priority = 3;

        /** Preferred room types for this movie (optional) */
        private List<String> preferredRoomTypes;

        /** Room IDs to exclude for this movie (optional) */
        private List<Long> excludeRoomIds;
    }
}
