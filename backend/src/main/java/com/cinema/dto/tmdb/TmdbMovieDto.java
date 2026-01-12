package com.cinema.dto.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class TmdbMovieDto {
    private Long id;
    private String title;
    private String overview;
    
    @JsonProperty("poster_path")
    private String posterPath;
    
    @JsonProperty("backdrop_path")
    private String backdropPath;
    
    @JsonProperty("release_date")
    private String releaseDate;
    
    @JsonProperty("vote_average")
    private Double voteAverage;
    
    @JsonProperty("vote_count")
    private Integer voteCount;
    
    private Double popularity;
    
    @JsonProperty("original_language")
    private String originalLanguage;
    
    @JsonProperty("original_title")
    private String originalTitle;
    
    private Boolean adult;
    
    @JsonProperty("genre_ids")
    private List<Integer> genreIds;
    
    // For detailed movie response
    private Integer runtime;
    
    private List<TmdbGenreDto> genres;
    
    @JsonProperty("production_countries")
    private List<TmdbCountryDto> productionCountries;
    
    @JsonProperty("spoken_languages")
    private List<TmdbLanguageDto> spokenLanguages;
    
    private String status;
    private String tagline;
    private Long budget;
    private Long revenue;
    
    @JsonProperty("imdb_id")
    private String imdbId;
}
