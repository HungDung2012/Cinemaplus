package com.cinema.service;

import com.cinema.dto.response.PageResponse;
import com.cinema.model.Promotion;
import com.cinema.model.Promotion.PromotionType;
import com.cinema.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
     * Lấy tất cả khuyến mãi với phân trang (admin)
     */
    public PageResponse<Promotion> getAllPromotionsPaged(String search, String type, Boolean active, Pageable pageable) {
        Page<Promotion> promotions;
        if (search != null && !search.trim().isEmpty() && type != null && !type.trim().isEmpty() && active != null) {
            promotions = promotionRepository.findByTitleContainingIgnoreCaseAndTypeAndActiveOrderByCreatedAtDesc(search, Promotion.PromotionType.valueOf(type), active, pageable);
        } else if (search != null && !search.trim().isEmpty() && type != null && !type.trim().isEmpty()) {
            promotions = promotionRepository.findByTitleContainingIgnoreCaseAndTypeOrderByCreatedAtDesc(search, Promotion.PromotionType.valueOf(type), pageable);
        } else if (search != null && !search.trim().isEmpty() && active != null) {
            promotions = promotionRepository.findByTitleContainingIgnoreCaseAndActiveOrderByCreatedAtDesc(search, active, pageable);
        } else if (type != null && !type.trim().isEmpty() && active != null) {
            promotions = promotionRepository.findByTypeAndActiveOrderByCreatedAtDesc(Promotion.PromotionType.valueOf(type), active, pageable);
        } else if (search != null && !search.trim().isEmpty()) {
            promotions = promotionRepository.findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(search, pageable);
        } else if (type != null && !type.trim().isEmpty()) {
            promotions = promotionRepository.findByTypeOrderByCreatedAtDesc(Promotion.PromotionType.valueOf(type), pageable);
        } else if (active != null) {
            promotions = promotionRepository.findByActiveOrderByCreatedAtDesc(active, pageable);
        } else {
            promotions = promotionRepository.findByOrderByCreatedAtDesc(pageable);
        }
        return createPageResponse(promotions);
    }

    /**
     * Tạo khuyến mãi mới từ request
     */
    /**
     * Tạo khuyến mãi mới từ request
     */
    @Transactional
    public Promotion createPromotion(com.cinema.dto.request.PromotionRequest request) {
        if (promotionRepository.existsByTitle(request.getTitle())) {
            throw new com.cinema.exception.DuplicateResourceException(
                    "Tiêu đề khuyến mãi đã tồn tại: " + request.getTitle());
        }
        if (request.getCode() != null && !request.getCode().isEmpty()
                && promotionRepository.existsByCode(request.getCode())) {
            throw new com.cinema.exception.DuplicateResourceException("Mã khuyến mãi đã tồn tại: " + request.getCode());
        }

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
                .code(request.getCode())
                .discountType(
                        request.getDiscountType() != null ? Promotion.DiscountType.valueOf(request.getDiscountType())
                                : null)
                .discountValue(request.getDiscountValue())
                .minPurchase(request.getMinPurchase())
                .maxDiscount(request.getMaxDiscount())
                .usageLimit(request.getUsageLimit())
                .usageCount(0)
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

        if (promotionRepository.existsByTitleAndIdNot(request.getTitle(), id)) {
            throw new com.cinema.exception.DuplicateResourceException(
                    "Tiêu đề khuyến mãi đã tồn tại: " + request.getTitle());
        }
        if (request.getCode() != null && !request.getCode().isEmpty()
                && promotionRepository.existsByCodeAndIdNot(request.getCode(), id)) {
            throw new com.cinema.exception.DuplicateResourceException("Mã khuyến mãi đã tồn tại: " + request.getCode());
        }

        promotion.setTitle(request.getTitle());
        promotion.setShortDescription(request.getShortDescription());
        promotion.setContent(request.getContent());
        promotion.setImageUrl(request.getImageUrl());
        promotion.setThumbnailUrl(request.getThumbnailUrl());
        promotion.setStartDate(request.getStartDate());
        promotion.setEndDate(request.getEndDate());
        promotion.setCode(request.getCode());

        if (request.getDiscountType() != null) {
            promotion.setDiscountType(Promotion.DiscountType.valueOf(request.getDiscountType()));
        }
        promotion.setDiscountValue(request.getDiscountValue());
        promotion.setMinPurchase(request.getMinPurchase());
        promotion.setMaxDiscount(request.getMaxDiscount());
        promotion.setUsageLimit(request.getUsageLimit());

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

    private PageResponse<Promotion> createPageResponse(Page<Promotion> promotions) {
        List<Promotion> content = promotions.getContent();

        return PageResponse.<Promotion>builder()
                .content(content)
                .pageNumber(promotions.getNumber())
                .pageSize(promotions.getSize())
                .totalElements(promotions.getTotalElements())
                .totalPages(promotions.getTotalPages())
                .last(promotions.isLast())
                .first(promotions.isFirst())
                .build();
    }
}
