package com.cinema.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleTemplateResponse {

    private Long id;
    private String name;
    private String dayType;
    private Integer cleaningMinutes;
    private Integer bufferMinutes;
    private Integer adsMinutes;
    private Boolean active;
    private Long createdBy;
    private String createdAt;
    private String updatedAt;
    private List<SlotResponse> slots;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlotResponse {
        private Long id;
        private String startTime; // HH:mm
        private String label;
        private Integer priority;
    }
}
