package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.CityResponse;
import com.cinema.service.CityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cities")
@RequiredArgsConstructor
@Slf4j
public class CityController {

    private final CityService cityService;

    /**
     * Lấy tất cả thành phố đang hoạt động
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CityResponse>>> getAllCities() {
        List<CityResponse> cities = cityService.getAllCities();
        return ResponseEntity.ok(ApiResponse.success("Danh sách thành phố", cities));
    }

    /**
     * Lấy thành phố theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CityResponse>> getCityById(@PathVariable Long id) {
        CityResponse city = cityService.getCityById(id);
        return ResponseEntity.ok(ApiResponse.success(city));
    }

    /**
     * Lấy thành phố theo code
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<CityResponse>> getCityByCode(@PathVariable String code) {
        CityResponse city = cityService.getCityByCode(code);
        return ResponseEntity.ok(ApiResponse.success(city));
    }

    /**
     * Lấy danh sách thành phố theo region ID
     */
    @GetMapping("/region/{regionId}")
    public ResponseEntity<ApiResponse<List<CityResponse>>> getCitiesByRegion(@PathVariable Long regionId) {
        List<CityResponse> cities = cityService.getCitiesByRegion(regionId);
        return ResponseEntity.ok(ApiResponse.success("Danh sách thành phố theo khu vực", cities));
    }

    /**
     * Lấy danh sách thành phố theo region code
     */
    @GetMapping("/region/code/{regionCode}")
    public ResponseEntity<ApiResponse<List<CityResponse>>> getCitiesByRegionCode(@PathVariable String regionCode) {
        List<CityResponse> cities = cityService.getCitiesByRegionCode(regionCode);
        return ResponseEntity.ok(ApiResponse.success("Danh sách thành phố theo khu vực", cities));
    }

    /**
     * Lấy danh sách thành phố có rạp đang hoạt động
     */
    @GetMapping("/with-theaters")
    public ResponseEntity<ApiResponse<List<CityResponse>>> getCitiesWithActiveTheaters() {
        List<CityResponse> cities = cityService.getCitiesWithActiveTheaters();
        return ResponseEntity.ok(ApiResponse.success("Danh sách thành phố có rạp", cities));
    }

    /**
     * API Migration: Di chuyển dữ liệu theaters vào cities
     * Yêu cầu quyền ADMIN
     */
    @PostMapping("/migrate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> migrateTheatersToCities() {
        log.info("Admin triggered theater-to-city migration");
        int migratedCount = cityService.migrateTheatersToCities();
        
        Map<String, Object> result = Map.of(
                "migratedCount", migratedCount,
                "message", "Đã migrate " + migratedCount + " rạp vào các thành phố"
        );
        
        return ResponseEntity.ok(ApiResponse.success("Migration hoàn thành", result));
    }

    /**
     * API tạo cities mặc định cho các regions
     * Yêu cầu quyền ADMIN
     */
    @PostMapping("/create-defaults")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> createDefaultCities() {
        log.info("Admin triggered default city creation");
        cityService.createDefaultCitiesForAllRegions();
        return ResponseEntity.ok(ApiResponse.success("Đã tạo các thành phố mặc định cho tất cả khu vực"));
    }
}
