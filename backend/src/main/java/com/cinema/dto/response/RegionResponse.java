package com.cinema.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegionResponse {
    private Long id;
    private String name;
    private String code;
    private Integer theaterCount;
}
