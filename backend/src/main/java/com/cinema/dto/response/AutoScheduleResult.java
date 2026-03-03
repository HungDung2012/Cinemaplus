package com.cinema.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoScheduleResult {
    private int totalCreated;
    private int totalSkipped;
    private int totalTheaters;
    private int totalDays;
    private String message;
    private List<AutoSchedulePreviewResponse.ConflictDetail> conflicts;
}
