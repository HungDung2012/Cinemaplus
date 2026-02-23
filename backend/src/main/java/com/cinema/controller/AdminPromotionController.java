package com.cinema.controller;

import com.cinema.dto.request.PromotionRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.PageResponse;
import com.cinema.model.Promotion;
import com.cinema.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/promotions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPromotionController {

    private final PromotionService promotionService;

    /**
     * Lấy danh sách tất cả khuyến mãi
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Promotion>>> getAllPromotions() {
        return ResponseEntity.ok(ApiResponse.success(promotionService.getAllPromotions()));
    }

    /**
     * Lấy danh sách khuyến mãi với phân trang
     */
    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<PageResponse<Promotion>>> getPromotionsWithPagination(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PageResponse<Promotion> response = promotionService.getAllPromotionsPaged(search, type, active, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Tạo khuyến mãi mới
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Promotion>> createPromotion(
            @RequestBody @Valid PromotionRequest request) {
        Promotion createdPromotion = promotionService.createPromotion(request);
        return ResponseEntity.status(201).body(ApiResponse.success(createdPromotion));
    }

    /**
     * Cập nhật khuyến mãi
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Promotion>> updatePromotion(@PathVariable Long id,
            @RequestBody @Valid PromotionRequest request) {
        try {
            Promotion updatedPromotion = promotionService.updatePromotion(id, request);
            return ResponseEntity.ok(ApiResponse.success(updatedPromotion));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Xóa khuyến mãi
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(@PathVariable Long id) {
        try {
            promotionService.deletePromotion(id);
            return ResponseEntity.ok(ApiResponse.success("Xóa khuyến mãi thành công", null));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
