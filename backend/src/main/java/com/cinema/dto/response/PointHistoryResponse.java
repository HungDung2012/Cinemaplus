package com.cinema.dto.response;

import com.cinema.model.PointHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO trả về lịch sử điểm thưởng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointHistoryResponse {

    private Long id;
    private Integer points;
    private PointHistory.TransactionType transactionType;
    private String transactionTypeDisplay;
    private String description;
    private String referenceId;
    private String referenceType;
    private Integer balanceAfter;
    private LocalDateTime createdAt;

    /**
     * Factory method để tạo từ Entity
     */
    public static PointHistoryResponse fromEntity(PointHistory entity) {
        return PointHistoryResponse.builder()
                .id(entity.getId())
                .points(entity.getPoints())
                .transactionType(entity.getTransactionType())
                .transactionTypeDisplay(entity.getTransactionType().getDisplayName())
                .description(entity.getDescription())
                .referenceId(entity.getReferenceId() != null ? entity.getReferenceId().toString() : null)
                .referenceType(entity.getReferenceType() != null ? entity.getReferenceType().getDisplayName() : null)
                .balanceAfter(entity.getBalanceAfter())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
