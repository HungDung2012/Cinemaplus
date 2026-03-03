package com.cinema.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ScheduleTemplateRequest {

    @NotBlank(message = "Tên template không được để trống")
    private String name;

    @NotNull(message = "Loại ngày không được để trống")
    private String dayType; // WEEKDAY, WEEKEND, HOLIDAY

    private Integer cleaningMinutes = 15;
    private Integer bufferMinutes = 10;
    private Integer adsMinutes = 20;
    private Boolean active = true;

    private List<SlotRequest> slots;

    @Data
    public static class SlotRequest {
        @NotBlank(message = "Giờ bắt đầu không được để trống")
        private String startTime; // HH:mm format
        private String label;
        private Integer priority = 0;
    }
}
