package com.cinema.dto.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TmdbLanguageDto {
    @JsonProperty("iso_639_1")
    private String iso;
    
    @JsonProperty("english_name")
    private String englishName;
    
    private String name;
}
