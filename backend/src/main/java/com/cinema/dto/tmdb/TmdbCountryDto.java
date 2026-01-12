package com.cinema.dto.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TmdbCountryDto {
    @JsonProperty("iso_3166_1")
    private String iso;
    private String name;
}
