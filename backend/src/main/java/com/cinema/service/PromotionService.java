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
     * Tạo khuyến mãi mới
     */
    public Promotion createPromotion(Promotion promotion) {
        return promotionRepository.save(promotion);
    }

    /**
     * Cập nhật khuyến mãi
     */
    public Promotion updatePromotion(Promotion promotion) {
        return promotionRepository.save(promotion);
    }

    /**
     * Xóa khuyến mãi
     */
    public void deletePromotion(Long id) {
        promotionRepository.deleteById(id);
    }
}
