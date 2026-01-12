package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.FoodResponse;
import com.cinema.model.Food;
import com.cinema.service.FoodService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/foods")
@RequiredArgsConstructor
public class FoodController {

    private final FoodService foodService;

    /**
     * Lấy tất cả đồ ăn/thức uống
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FoodResponse>>> getAllFoods() {
        List<FoodResponse> foods = foodService.getAllAvailableFoods();
        return ResponseEntity.ok(ApiResponse.success(foods));
    }

    /**
     * Lấy đồ ăn theo danh mục
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<FoodResponse>>> getFoodsByCategory(
            @PathVariable Food.FoodCategory category) {
        List<FoodResponse> foods = foodService.getFoodsByCategory(category);
        return ResponseEntity.ok(ApiResponse.success(foods));
    }

    /**
     * Lấy danh sách combo
     */
    @GetMapping("/combos")
    public ResponseEntity<ApiResponse<List<FoodResponse>>> getCombos() {
        List<FoodResponse> combos = foodService.getCombos();
        return ResponseEntity.ok(ApiResponse.success(combos));
    }

    /**
     * Lấy đồ ăn lẻ (không phải combo)
     */
    @GetMapping("/singles")
    public ResponseEntity<ApiResponse<List<FoodResponse>>> getSingleItems() {
        List<FoodResponse> items = foodService.getSingleItems();
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    /**
     * Lấy đồ ăn theo nhóm danh mục
     */
    @GetMapping("/grouped")
    public ResponseEntity<ApiResponse<Map<String, List<FoodResponse>>>> getFoodsGrouped() {
        Map<String, List<FoodResponse>> grouped = foodService.getFoodsGroupedByCategory();
        return ResponseEntity.ok(ApiResponse.success(grouped));
    }

    /**
     * Lấy chi tiết 1 sản phẩm
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FoodResponse>> getFoodById(@PathVariable Long id) {
        FoodResponse food = foodService.getFoodById(id);
        return ResponseEntity.ok(ApiResponse.success(food));
    }

    /**
     * Lấy danh sách danh mục
     */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Food.FoodCategory>>> getCategories() {
        List<Food.FoodCategory> categories = foodService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }
}
