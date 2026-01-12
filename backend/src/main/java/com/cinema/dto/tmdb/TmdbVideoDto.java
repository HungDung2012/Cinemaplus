package com.cinema.dto.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TmdbVideoDto {
    private String id;
    
    @JsonProperty("iso_639_1")
    private String iso639;
    
    @JsonProperty("iso_3166_1")
    private String iso3166;
    
    private String key;
    private String name;
    private String site;
    private Integer size;
    private String type;
    private Boolean official;
    
    @JsonProperty("published_at")
    private String publishedAt;
}
