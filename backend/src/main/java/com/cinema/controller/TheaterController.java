package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.TheaterResponse;
import com.cinema.service.TheaterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/theaters")
@RequiredArgsConstructor
public class TheaterController {
    
    private final TheaterService theaterService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<TheaterResponse>>> getAllTheaters() {
        List<TheaterResponse> theaters = theaterService.getAllTheaters();
        return ResponseEntity.ok(ApiResponse.success(theaters));
    }
    
    @GetMapping("/city/{cityId}")
    public ResponseEntity<ApiResponse<List<TheaterResponse>>> getTheatersByCity(@PathVariable Long cityId) {
        List<TheaterResponse> theaters = theaterService.getTheatersByCity(cityId);
        return ResponseEntity.ok(ApiResponse.success("Danh sách rạp theo thành phố", theaters));
    }

    @GetMapping("/city/code/{cityCode}")
    public ResponseEntity<ApiResponse<List<TheaterResponse>>> getTheatersByCityCode(@PathVariable String cityCode) {
        List<TheaterResponse> theaters = theaterService.getTheatersByCityCode(cityCode);
        return ResponseEntity.ok(ApiResponse.success("Danh sách rạp theo thành phố", theaters));
    }

    @GetMapping("/region/{regionId}")
    public ResponseEntity<ApiResponse<List<TheaterResponse>>> getTheatersByRegion(@PathVariable Long regionId) {
        List<TheaterResponse> theaters = theaterService.getTheatersByRegion(regionId);
        return ResponseEntity.ok(ApiResponse.success("Danh sách rạp theo khu vực", theaters));
    }

    @GetMapping("/region/code/{regionCode}")
    public ResponseEntity<ApiResponse<List<TheaterResponse>>> getTheatersByRegionCode(@PathVariable String regionCode) {
        List<TheaterResponse> theaters = theaterService.getTheatersByRegionCode(regionCode);
        return ResponseEntity.ok(ApiResponse.success("Danh sách rạp theo khu vực", theaters));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TheaterResponse>> getTheaterById(@PathVariable Long id) {
        TheaterResponse theater = theaterService.getTheaterById(id);
        return ResponseEntity.ok(ApiResponse.success(theater));
    }
}
