package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.model.PriceConfig;
import com.cinema.service.PriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PriceController {

    private final PriceService priceService;
    private final com.cinema.repository.PriceConfigRepository priceConfigRepository;

    @GetMapping("/admin/prices")
    public ResponseEntity<ApiResponse<List<PriceConfig>>> getAllPrices() {
        return ResponseEntity.ok(ApiResponse.success(priceConfigRepository.findAll()));
    }

    @PostMapping("/admin/prices")
    public ResponseEntity<ApiResponse<PriceConfig>> createOrUpdatePrice(@RequestBody PriceConfig config) {
        PriceConfig saved = priceService.createOrUpdatePriceConfig(config);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    // Note: Public calculation endpoint typically requires seat/showtime ID inputs
    // For now, simpler management endpoints are prioritized.
}
