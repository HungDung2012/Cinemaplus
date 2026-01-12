package com.cinema.service;

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
        return foodRepository.findAllAvailableSorted().stream()
                .map(FoodResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FoodResponse> getFoodsByCategory(Food.FoodCategory category) {
        return foodRepository.findByCategoryAndIsAvailableTrue(category).stream()
                .map(FoodResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FoodResponse> getCombos() {
        return foodRepository.findByIsComboTrueAndIsAvailableTrue().stream()
                .map(FoodResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FoodResponse> getSingleItems() {
        return foodRepository.findByIsComboFalseAndIsAvailableTrue().stream()
                .map(FoodResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Map<String, List<FoodResponse>> getFoodsGroupedByCategory() {
        List<Food> foods = foodRepository.findAllAvailableSorted();
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
}
