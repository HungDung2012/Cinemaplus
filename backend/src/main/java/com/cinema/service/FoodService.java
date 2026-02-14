package com.cinema.service;

import com.cinema.dto.request.FoodRequest;
import com.cinema.dto.response.FoodResponse;
import com.cinema.model.Food;
import com.cinema.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FoodService {

    private final FoodRepository foodRepository;

    public List<FoodResponse> getAllAvailableFoods() {
        return foodRepository.findAllActiveSorted().stream()
                .map(FoodResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FoodResponse> getAllFoods() {
        return foodRepository.findAllSorted().stream()
                .map(FoodResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FoodResponse> getFoodsByCategory(Food.FoodCategory category) {
        return foodRepository.findByCategoryAndActiveTrue(category).stream()
                .map(FoodResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FoodResponse> getCombos() {
        return foodRepository.findByIsComboTrueAndActiveTrue().stream()
                .map(FoodResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FoodResponse> getSingleItems() {
        return foodRepository.findByIsComboFalseAndActiveTrue().stream()
                .map(FoodResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Map<String, List<FoodResponse>> getFoodsGroupedByCategory() {
        List<Food> foods = foodRepository.findAllActiveSorted();
        return foods.stream()
                .map(FoodResponse::fromEntity)
                .collect(Collectors.groupingBy(FoodResponse::getCategoryName));
    }

    public FoodResponse getFoodById(Long id) {
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + id));
        return FoodResponse.fromEntity(food);
    }

    public List<Food.FoodCategory> getAllCategories() {
        return foodRepository.findAllAvailableCategories();
    }

    public FoodResponse createFood(FoodRequest request) {
        Food food = Food.builder()
                .name(request.getName())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .price(request.getPrice())
                .category(request.getCategory())
                .size(request.getSize())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .active(request.getActive() != null ? request.getActive() : true)
                .isCombo(request.getIsCombo() != null ? request.getIsCombo() : false)
                .comboDescription(request.getComboDescription())
                .originalPrice(request.getOriginalPrice())
                .discountPercent(request.getDiscountPercent())
                .calories(request.getCalories())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        Food savedFood = foodRepository.save(food);
        return FoodResponse.fromEntity(savedFood);
    }

    public FoodResponse updateFood(Long id, FoodRequest request) {
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + id));

        food.setName(request.getName());
        food.setDescription(request.getDescription());
        food.setImageUrl(request.getImageUrl());
        food.setPrice(request.getPrice());
        food.setCategory(request.getCategory());
        food.setSize(request.getSize());
        if (request.getIsAvailable() != null)
            food.setIsAvailable(request.getIsAvailable());
        if (request.getActive() != null)
            food.setActive(request.getActive());
        if (request.getIsCombo() != null)
            food.setIsCombo(request.getIsCombo());
        food.setComboDescription(request.getComboDescription());
        food.setOriginalPrice(request.getOriginalPrice());
        food.setDiscountPercent(request.getDiscountPercent());
        food.setCalories(request.getCalories());
        if (request.getSortOrder() != null)
            food.setSortOrder(request.getSortOrder());

        Food updatedFood = foodRepository.save(food);
        return FoodResponse.fromEntity(updatedFood);
    }

    public void deleteFood(Long id) {
        if (!foodRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy sản phẩm với ID: " + id);
        }
        foodRepository.deleteById(id);
    }
}
