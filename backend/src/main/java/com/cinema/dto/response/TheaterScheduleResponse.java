package com.cinema.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * DTO cho lịch chiếu phim theo rạp - nhóm theo Movie và Format
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TheaterScheduleResponse {

    private Long theaterId;
    private String theaterName;
    private String theaterAddress;
    private String theaterPhone;
    private String theaterImageUrl;
    private LocalDate scheduleDate;
    private List<MovieSchedule> movies;

    /**
     * Lịch chiếu của một phim (có thể có nhiều format)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MovieSchedule {
        private Long movieId;
        private String movieTitle;
        private String posterUrl;
        private Integer duration;
        private String ageRating;
        private String genre;
        private Double rating;
        private List<FormatSchedule> formats;
    }

    /**
     * Lịch chiếu theo format (2D, 3D, IMAX, etc.)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FormatSchedule {
        private String format; // "2D Phụ đề Việt", "3D Phụ đề Anh", "4DX 3D"
        private String roomType; // STANDARD_2D, IMAX, etc.
        private List<ShowtimeSlot> showtimes;
    }

    /**
     * Một khung giờ chiếu
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShowtimeSlot {
        private Long showtimeId;
        private LocalTime startTime;
        private LocalTime endTime;
        private BigDecimal basePrice;
        private String status; // AVAILABLE, SOLD_OUT
        private String roomName;
        private Integer availableSeats;
    }
}
