package com.cinema.dto.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TmdbCrewDto {
    private Long id;
    private String name;
    
    @JsonProperty("original_name")
    private String originalName;
    
    private String department;
    private String job;
    
    @JsonProperty("profile_path")
    private String profilePath;
    
    private Double popularity;
}
