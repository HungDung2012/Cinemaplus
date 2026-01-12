package com.cinema.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Long movieId;
    private String movieTitle;
    private Long userId;
    private String userName;
    private String userAvatar;
    private Integer rating;
    private String content;
    private Integer likesCount;
    private LocalDateTime createdAt;
    private Boolean isSpoiler;
}
