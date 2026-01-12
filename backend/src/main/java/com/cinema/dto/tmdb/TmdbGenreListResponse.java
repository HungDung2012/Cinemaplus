package com.cinema.dto.tmdb;

import lombok.Data;

import java.util.List;

@Data
public class TmdbGenreListResponse {
    private List<TmdbGenreDto> genres;
}
