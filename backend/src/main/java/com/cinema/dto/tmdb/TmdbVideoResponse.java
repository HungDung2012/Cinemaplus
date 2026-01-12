package com.cinema.dto.tmdb;

import lombok.Data;

import java.util.List;

@Data
public class TmdbVideoResponse {
    private Long id;
    private List<TmdbVideoDto> results;
}
