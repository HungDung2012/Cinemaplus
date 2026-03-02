package com.cinema.controller;

import com.cinema.dto.request.FoodRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.FoodResponse;
import com.cinema.dto.response.PageResponse;
import com.cinema.service.FoodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/foods")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGE_FOODS')")
public class AdminFoodController {

    private final FoodService foodService;

    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<FoodResponse>>> getAllFoods() {
        return ResponseEntity.ok(ApiResponse.success(foodService.getAllFoods()));
    }

    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<PageResponse<FoodResponse>>> getFoodsWithPagination(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean isAvailable,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PageResponse<FoodResponse> response = foodService.getAllFoodsPaged(search, category, isAvailable, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
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
