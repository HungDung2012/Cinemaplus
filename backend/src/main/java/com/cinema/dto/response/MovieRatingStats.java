package com.cinema.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MovieRatingStats {
    private Long movieId;
    private Double averageRating;
    private Long totalReviews;
}
