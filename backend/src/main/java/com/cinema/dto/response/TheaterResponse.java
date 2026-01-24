package com.cinema.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TheaterResponse {
    private Long id;
    private String name;
    private String address;
    private String phone;
    private String email;
    private String imageUrl;
    private String mapUrl;
    private String description;
    private Boolean active;
    private Integer totalRooms;

    // City information
    private Long cityId;
    private String cityName;
    private String cityCode;

    // Region information (through City)
    private Long regionId;
    private String regionName;
    private String regionCode;
}
