package com.cinema.dto.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TmdbCastDto {
    private Long id;
    private String name;
    
    @JsonProperty("original_name")
    private String originalName;
    
    private String character;
    
    @JsonProperty("profile_path")
    private String profilePath;
    
    private Integer order;
    
    @JsonProperty("known_for_department")
    private String knownForDepartment;
    
    private Double popularity;
}
