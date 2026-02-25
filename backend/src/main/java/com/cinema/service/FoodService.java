package com.cinema.service;

import com.cinema.dto.request.FoodRequest;
import com.cinema.dto.response.FoodResponse;
import com.cinema.dto.response.PageResponse;
import com.cinema.exception.DuplicateResourceException;
import com.cinema.model.Food;
import com.cinema.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    public PageResponse<FoodResponse> getAllFoodsPaged(String search, String category, Boolean isAvailable, Pageable pageable) {
        Page<Food> foods;
        if (search != null && !search.trim().isEmpty() && category != null && !category.trim().isEmpty() && isAvailable != null) {
            foods = foodRepository.findByNameContainingIgnoreCaseAndCategoryAndIsAvailableOrderByNameAsc(search, Food.FoodCategory.valueOf(category), isAvailable, pageable);
        } else if (search != null && !search.trim().isEmpty() && category != null && !category.trim().isEmpty()) {
            foods = foodRepository.findByNameContainingIgnoreCaseAndCategoryOrderByNameAsc(search, Food.FoodCategory.valueOf(category), pageable);
        } else if (search != null && !search.trim().isEmpty() && isAvailable != null) {
            foods = foodRepository.findByNameContainingIgnoreCaseAndIsAvailableOrderByNameAsc(search, isAvailable, pageable);
        } else if (category != null && !category.trim().isEmpty() && isAvailable != null) {
            foods = foodRepository.findByCategoryAndIsAvailableOrderByNameAsc(Food.FoodCategory.valueOf(category), isAvailable, pageable);
        } else if (search != null && !search.trim().isEmpty()) {
            foods = foodRepository.findByNameContainingIgnoreCaseOrderByNameAsc(search, pageable);
        } else if (category != null && !category.trim().isEmpty()) {
            foods = foodRepository.findByCategoryOrderByNameAsc(Food.FoodCategory.valueOf(category), pageable);
        } else if (isAvailable != null) {
            foods = foodRepository.findByIsAvailableOrderByNameAsc(isAvailable, pageable);
        } else {
            foods = foodRepository.findByOrderByNameAsc(pageable);
        }
        return createPageResponse(foods);
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
        if (foodRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Tên món ăn '" + request.getName() + "' đã tồn tại");
        }

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

        if (foodRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new DuplicateResourceException("Tên món ăn '" + request.getName() + "' đã tồn tại");
        }

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

    private PageResponse<FoodResponse> createPageResponse(Page<Food> foods) {
        List<FoodResponse> content = foods.getContent().stream()
                .map(FoodResponse::fromEntity)
                .collect(Collectors.toList());

        return PageResponse.<FoodResponse>builder()
                .content(content)
                .pageNumber(foods.getNumber())
                .pageSize(foods.getSize())
                .totalElements(foods.getTotalElements())
                .totalPages(foods.getTotalPages())
                .last(foods.isLast())
                .first(foods.isFirst())
                .build();
    }
}
