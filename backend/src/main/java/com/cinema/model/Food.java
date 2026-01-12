package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "foods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Food {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FoodCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FoodSize size;

    @Column(name = "is_available")
    @Builder.Default
    private Boolean isAvailable = true;

    @Column(name = "is_combo")
    @Builder.Default
    private Boolean isCombo = false;

    @Column(name = "combo_description")
    private String comboDescription;

    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice; // Giá gốc nếu là combo

    @Column(name = "discount_percent")
    private Integer discountPercent; // % giảm giá nếu là combo

    @Column(name = "calories")
    private Integer calories;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum FoodCategory {
        POPCORN,        // Bắp rang
        DRINK,          // Đồ uống
        SNACK,          // Snack
        COMBO,          // Combo
        FAST_FOOD,      // Đồ ăn nhanh
        CANDY,          // Kẹo bánh
        ICE_CREAM       // Kem
    }

    public enum FoodSize {
        SMALL,      // Nhỏ
        MEDIUM,     // Vừa
        LARGE,      // Lớn
        EXTRA_LARGE // Siêu lớn
    }
}
