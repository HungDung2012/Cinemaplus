package com.cinema.controller;

import com.cinema.dto.request.FoodRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.FoodResponse;
import com.cinema.service.FoodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/foods")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminFoodController {

    private final FoodService foodService;

    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<FoodResponse>>> getAllFoods() {
        return ResponseEntity.ok(ApiResponse.success(foodService.getAllFoods()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FoodResponse>> createFood(@Valid @RequestBody FoodRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(foodService.createFood(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FoodResponse>> updateFood(@PathVariable Long id,
            @Valid @RequestBody FoodRequest request) {
        return ResponseEntity.ok(ApiResponse.success(foodService.updateFood(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFood(@PathVariable Long id) {
        foodService.deleteFood(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
