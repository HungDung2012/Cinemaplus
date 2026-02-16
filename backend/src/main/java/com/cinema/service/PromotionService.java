package com.cinema.service;

import com.cinema.model.Promotion;
import com.cinema.model.Promotion.PromotionType;
import com.cinema.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private final PromotionRepository promotionRepository;

    /**
     * Lấy tất cả khuyến mãi đang hoạt động
     */
    public List<Promotion> getAllActivePromotions() {
        return promotionRepository.findAllActive(LocalDate.now());
    }

    /**
     * Lấy khuyến mãi theo loại
     */
    public List<Promotion> getPromotionsByType(PromotionType type) {
        return promotionRepository.findAllActiveByType(type, LocalDate.now());
    }

    /**
     * Lấy khuyến mãi nổi bật
     */
    public List<Promotion> getFeaturedPromotions() {
        return promotionRepository.findFeatured(LocalDate.now());
    }

    /**
     * Lấy chi tiết khuyến mãi theo ID
     */
    @Transactional
    public Optional<Promotion> getPromotionById(Long id) {
        Optional<Promotion> promotion = promotionRepository.findById(id);
        // Tăng lượt xem
        promotion.ifPresent(p -> promotionRepository.incrementViewCount(id));
        return promotion;
    }

    /**
     * Tìm kiếm khuyến mãi
     */
    public List<Promotion> searchPromotions(String keyword) {
        return promotionRepository.searchByTitle(keyword);
    }

    /**
     * Lấy tất cả khuyến mãi (admin)
     */
    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }

    /**
     * Tạo khuyến mãi mới từ request
     */
    @Transactional
    public Promotion createPromotion(com.cinema.dto.request.PromotionRequest request) {
        Promotion promotion = Promotion.builder()
                .title(request.getTitle())
                .shortDescription(request.getShortDescription())
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .thumbnailUrl(request.getThumbnailUrl())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(request.getStatus() != null ? request.getStatus() : Promotion.PromotionStatus.ACTIVE)
                .type(request.getType())
                .isFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .viewCount(0)
                .build();
        return promotionRepository.save(promotion);
    }

    /**
     * Cập nhật khuyến mãi từ request
     */
    @Transactional
    public Promotion updatePromotion(Long id, com.cinema.dto.request.PromotionRequest request) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khuyến mãi với ID: " + id));

        promotion.setTitle(request.getTitle());
        promotion.setShortDescription(request.getShortDescription());
        promotion.setContent(request.getContent());
        promotion.setImageUrl(request.getImageUrl());
        promotion.setThumbnailUrl(request.getThumbnailUrl());
        promotion.setStartDate(request.getStartDate());
        promotion.setEndDate(request.getEndDate());

        if (request.getStatus() != null) {
            promotion.setStatus(request.getStatus());
        }

        if (request.getType() != null) {
            promotion.setType(request.getType());
        }

        if (request.getIsFeatured() != null) {
            promotion.setIsFeatured(request.getIsFeatured());
        }

        if (request.getSortOrder() != null) {
            promotion.setSortOrder(request.getSortOrder());
        }

        return promotionRepository.save(promotion);
    }

    /**
     * Xóa khuyến mãi
     */
    @Transactional
    public void deletePromotion(Long id) {
        if (!promotionRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy khuyến mãi với ID: " + id);
        }
        promotionRepository.deleteById(id);
    }
}
