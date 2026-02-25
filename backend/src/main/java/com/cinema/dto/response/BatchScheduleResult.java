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
public class BatchScheduleResult {
    private int totalCreated;
    private int totalSkipped;
    private String message;
    private List<BatchSchedulePreviewResponse.ConflictInfo> conflicts;
}
