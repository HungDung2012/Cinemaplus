package com.cinema.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO cho danh sách rạp nhóm theo thành phố/khu vực
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupedTheaterResponse {

    private List<CityGroup> cities;
    private Integer totalTheaters;

    /**
     * Nhóm rạp theo thành phố
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CityGroup {
        private String cityName;
        private String cityCode; // Ha_Noi, Ho_Chi_Minh, Da_Nang...
        private Integer theaterCount;
        private List<TheaterSummary> theaters;
    }

    /**
     * Thông tin tóm tắt của một rạp
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TheaterSummary {
        private Long id;
        private String name;
        private String address;
        private String phone;
        private String imageUrl;
        private String mapUrl; // Google Maps URL
        private Integer totalRooms;
    }
}
