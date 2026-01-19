package com.cinema.repository;

import com.cinema.model.Promotion;
import com.cinema.model.Promotion.PromotionStatus;
import com.cinema.model.Promotion.PromotionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    // Lấy tất cả khuyến mãi đang hoạt động
    @Query("SELECT p FROM Promotion p WHERE p.status = 'ACTIVE' " +
           "AND (p.startDate IS NULL OR p.startDate <= :today) " +
           "AND (p.endDate IS NULL OR p.endDate >= :today) " +
           "ORDER BY p.isFeatured DESC, p.sortOrder ASC, p.createdAt DESC")
    List<Promotion> findAllActive(@Param("today") LocalDate today);

    // Lấy khuyến mãi đang hoạt động theo loại
    @Query("SELECT p FROM Promotion p WHERE p.status = 'ACTIVE' AND p.type = :type " +
           "AND (p.startDate IS NULL OR p.startDate <= :today) " +
           "AND (p.endDate IS NULL OR p.endDate >= :today) " +
           "ORDER BY p.isFeatured DESC, p.sortOrder ASC, p.createdAt DESC")
    List<Promotion> findAllActiveByType(@Param("type") PromotionType type, @Param("today") LocalDate today);

    // Lấy khuyến mãi nổi bật
    @Query("SELECT p FROM Promotion p WHERE p.status = 'ACTIVE' AND p.isFeatured = true " +
           "AND (p.startDate IS NULL OR p.startDate <= :today) " +
           "AND (p.endDate IS NULL OR p.endDate >= :today) " +
           "ORDER BY p.sortOrder ASC, p.createdAt DESC")
    List<Promotion> findFeatured(@Param("today") LocalDate today);

    // Lấy khuyến mãi với phân trang
    Page<Promotion> findByStatus(PromotionStatus status, Pageable pageable);

    // Tăng lượt xem
    @Modifying
    @Query("UPDATE Promotion p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    void incrementViewCount(@Param("id") Long id);

    // Tìm kiếm khuyến mãi theo tiêu đề
    @Query("SELECT p FROM Promotion p WHERE p.status = 'ACTIVE' " +
           "AND LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY p.createdAt DESC")
    List<Promotion> searchByTitle(@Param("keyword") String keyword);
}
