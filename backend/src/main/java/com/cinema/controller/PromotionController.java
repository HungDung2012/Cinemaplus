package com.cinema.controller;

import com.cinema.model.Promotion;
import com.cinema.model.Promotion.PromotionType;
import com.cinema.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    /**
     * Lấy tất cả khuyến mãi đang hoạt động
     */
    @GetMapping
    public ResponseEntity<List<Promotion>> getAllPromotions() {
        List<Promotion> promotions = promotionService.getAllActivePromotions();
        return ResponseEntity.ok(promotions);
    }

    /**
     * Lấy khuyến mãi nổi bật
     */
    @GetMapping("/featured")
    public ResponseEntity<List<Promotion>> getFeaturedPromotions() {
        List<Promotion> promotions = promotionService.getFeaturedPromotions();
        return ResponseEntity.ok(promotions);
    }

    /**
     * Lấy khuyến mãi theo loại
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Promotion>> getPromotionsByType(@PathVariable String type) {
        try {
            PromotionType promotionType = PromotionType.valueOf(type.toUpperCase());
            List<Promotion> promotions = promotionService.getPromotionsByType(promotionType);
            return ResponseEntity.ok(promotions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Lấy chi tiết khuyến mãi theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Promotion> getPromotionById(@PathVariable Long id) {
        return promotionService.getPromotionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Tìm kiếm khuyến mãi
     */
    @GetMapping("/search")
    public ResponseEntity<List<Promotion>> searchPromotions(@RequestParam String keyword) {
        List<Promotion> promotions = promotionService.searchPromotions(keyword);
        return ResponseEntity.ok(promotions);
    }

    /**
     * Lấy danh sách các loại khuyến mãi
     */
    @GetMapping("/types")
    public ResponseEntity<List<Map<String, String>>> getPromotionTypes() {
        List<Map<String, String>> types = new java.util.ArrayList<>();
        
        Map<String, String> all = new HashMap<>();
        all.put("value", "ALL");
        all.put("label", "Tất cả");
        types.add(all);
        
        for (PromotionType type : PromotionType.values()) {
            Map<String, String> typeMap = new HashMap<>();
            typeMap.put("value", type.name());
            typeMap.put("label", getTypeLabel(type));
            types.add(typeMap);
        }
        
        return ResponseEntity.ok(types);
    }

    private String getTypeLabel(PromotionType type) {
        return switch (type) {
            case GENERAL -> "Khuyến mãi chung";
            case TICKET -> "Ưu đãi vé";
            case FOOD -> "Ưu đãi đồ ăn";
            case COMBO -> "Combo tiết kiệm";
            case MEMBER -> "Ưu đãi thành viên";
            case PARTNER -> "Đối tác";
            case SPECIAL_DAY -> "Ngày đặc biệt";
            case MOVIE -> "Ưu đãi theo phim";
        };
    }
}
