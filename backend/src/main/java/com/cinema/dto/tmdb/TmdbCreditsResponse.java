package com.cinema.dto.tmdb;

import lombok.Data;

import java.util.List;

@Data
public class TmdbCreditsResponse {
    private Long id;
    private List<TmdbCastDto> cast;
    private List<TmdbCrewDto> crew;
}
