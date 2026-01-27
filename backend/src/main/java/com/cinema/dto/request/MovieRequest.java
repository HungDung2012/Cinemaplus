package com.cinema.dto.request;

import com.cinema.model.Movie;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Duration is required")
    @jakarta.validation.constraints.Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer duration;

    private String director;
    private String actors;
    private String genre;
    private String language;

    @NotNull(message = "Release date is required")
    private LocalDate releaseDate;

    private LocalDate endDate;

    private String posterUrl;

    private String trailerUrl;

    @NotBlank(message = "Age rating is required")
    private String ageRating;

    @jakarta.validation.constraints.Min(value = 0, message = "Rating must be at least 0")
    @jakarta.validation.constraints.Max(value = 10, message = "Rating must be at most 10")
    private Double rating;

    @NotNull(message = "Status is required")
    private Movie.MovieStatus status;
}
