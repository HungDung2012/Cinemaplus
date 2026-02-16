package com.cinema.dto.request;

import com.cinema.model.Promotion.PromotionType;
import com.cinema.model.Promotion.PromotionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PromotionRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String shortDescription;

    private String content;

    private String imageUrl;

    private String thumbnailUrl;

    private LocalDate startDate;

    private LocalDate endDate;

    private PromotionStatus status;

    @NotNull(message = "Loại khuyến mãi không được để trống")
    private PromotionType type;

    private Boolean isFeatured;

    private Integer sortOrder;
}
