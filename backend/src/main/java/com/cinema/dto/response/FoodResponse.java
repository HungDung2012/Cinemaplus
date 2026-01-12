package com.cinema.dto.response;

import com.cinema.model.Food;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodResponse {
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private BigDecimal price;
    private Food.FoodCategory category;
    private String categoryName;
    private Food.FoodSize size;
    private String sizeName;
    private Boolean isAvailable;
    private Boolean isCombo;
    private String comboDescription;
    private BigDecimal originalPrice;
    private Integer discountPercent;
    private BigDecimal savedAmount;
    private Integer calories;

    public static FoodResponse fromEntity(Food food) {
        BigDecimal savedAmount = null;
        if (food.getIsCombo() && food.getOriginalPrice() != null) {
            savedAmount = food.getOriginalPrice().subtract(food.getPrice());
        }

        return FoodResponse.builder()
                .id(food.getId())
                .name(food.getName())
                .description(food.getDescription())
                .imageUrl(food.getImageUrl())
                .price(food.getPrice())
                .category(food.getCategory())
                .categoryName(getCategoryName(food.getCategory()))
                .size(food.getSize())
                .sizeName(getSizeName(food.getSize()))
                .isAvailable(food.getIsAvailable())
                .isCombo(food.getIsCombo())
                .comboDescription(food.getComboDescription())
                .originalPrice(food.getOriginalPrice())
                .discountPercent(food.getDiscountPercent())
                .savedAmount(savedAmount)
                .calories(food.getCalories())
                .build();
    }

    private static String getCategoryName(Food.FoodCategory category) {
        return switch (category) {
            case POPCORN -> "Bắp rang";
            case DRINK -> "Đồ uống";
            case SNACK -> "Snack";
            case COMBO -> "Combo";
            case FAST_FOOD -> "Đồ ăn nhanh";
            case CANDY -> "Kẹo bánh";
            case ICE_CREAM -> "Kem";
        };
    }

    private static String getSizeName(Food.FoodSize size) {
        return switch (size) {
            case SMALL -> "Nhỏ";
            case MEDIUM -> "Vừa";
            case LARGE -> "Lớn";
            case EXTRA_LARGE -> "Siêu lớn";
        };
    }
}
