package com.cinema.dto.request;

import com.cinema.model.Food;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    private String description;

    private String imageUrl;

    @NotNull(message = "Giá không được để trống")
    @DecimalMin(value = "0.0", message = "Giá phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    @NotNull(message = "Danh mục không được để trống")
    private Food.FoodCategory category;

    @NotNull(message = "Kích thước không được để trống")
    private Food.FoodSize size;

    private Boolean isAvailable; // Còn hàng/Hết hàng

    private Boolean active; // Hiển thị/Ẩn

    private Boolean isCombo;

    private String comboDescription;

    private BigDecimal originalPrice; // Optional, for combos

    private Integer discountPercent; // Optional, for combos

    private Integer calories;

    private Integer sortOrder;
}
