package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity Promotion - Khuyến mãi, ưu đãi
 */
@Entity
@Table(name = "promotions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title; // Tiêu đề khuyến mãi

    @Column(name = "short_description", length = 500)
    private String shortDescription; // Mô tả ngắn

    @Column(columnDefinition = "TEXT")
    private String content; // Nội dung chi tiết (HTML)

    @Column(name = "image_url", length = 500)
    private String imageUrl; // Ảnh banner khuyến mãi

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl; // Ảnh thumbnail

    @Column(name = "start_date")
    private LocalDate startDate; // Ngày bắt đầu

    @Column(name = "end_date")
    private LocalDate endDate; // Ngày kết thúc

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PromotionStatus status = PromotionStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PromotionType type = PromotionType.GENERAL;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false; // Khuyến mãi nổi bật

    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum PromotionStatus {
        ACTIVE,     // Đang hoạt động
        INACTIVE,   // Tạm dừng
        EXPIRED,    // Hết hạn
        UPCOMING    // Sắp diễn ra
    }

    public enum PromotionType {
        GENERAL,        // Khuyến mãi chung
        TICKET,         // Khuyến mãi vé
        FOOD,           // Khuyến mãi đồ ăn
        COMBO,          // Khuyến mãi combo
        MEMBER,         // Khuyến mãi thành viên
        PARTNER,        // Hợp tác đối tác (ZaloPay, MoMo, etc.)
        SPECIAL_DAY,    // Ngày đặc biệt (Lễ, Tết)
        MOVIE           // Khuyến mãi theo phim
    }

    public boolean isActive() {
        if (status != PromotionStatus.ACTIVE) return false;
        LocalDate now = LocalDate.now();
        if (startDate != null && now.isBefore(startDate)) return false;
        if (endDate != null && now.isAfter(endDate)) return false;
        return true;
    }

    public String getDateRangeDisplay() {
        if (startDate == null && endDate == null) return "";
        if (startDate != null && endDate != null) {
            return formatDate(startDate) + " - " + formatDate(endDate);
        }
        if (startDate != null) {
            return "Từ " + formatDate(startDate);
        }
        return "Đến " + formatDate(endDate);
    }

    private String formatDate(LocalDate date) {
        return String.format("%02d/%02d/%d", date.getDayOfMonth(), date.getMonthValue(), date.getYear());
    }
}
