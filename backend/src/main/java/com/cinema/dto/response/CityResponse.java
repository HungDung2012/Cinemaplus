package com.cinema.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CityResponse {
    private Long id;
    private String name;
    private String code;
    private String provinceCode;
    private Boolean active;
    private Long regionId;
    private String regionName;
    private String regionCode;
    private Integer theaterCount;
}
