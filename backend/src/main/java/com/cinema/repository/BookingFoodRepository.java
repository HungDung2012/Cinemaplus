package com.cinema.repository;

import com.cinema.model.BookingFood;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingFoodRepository extends JpaRepository<BookingFood, Long> {

    List<BookingFood> findByBookingId(Long bookingId);

    // ==================== ANALYTICS ====================

    @Query("SELECT new map(f.name as foodName, f.id as foodId, f.category as category, " +
           "SUM(bf.quantity) as totalQuantity, SUM(bf.totalPrice) as totalRevenue) " +
           "FROM BookingFood bf " +
           "JOIN bf.food f " +
           "JOIN bf.booking b " +
           "WHERE b.status IN ('CONFIRMED', 'COMPLETED') " +
           "AND (:startDate IS NULL OR b.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR b.createdAt <= :endDate) " +
           "GROUP BY f.id, f.name, f.category " +
           "ORDER BY totalRevenue DESC")
    List<java.util.Map<String, Object>> getTopSellingFoods(
           @Param("startDate") LocalDateTime startDate,
           @Param("endDate") LocalDateTime endDate,
           Pageable pageable);

    @Query("SELECT new map(f.category as category, " +
           "SUM(bf.quantity) as totalQuantity, SUM(bf.totalPrice) as totalRevenue) " +
           "FROM BookingFood bf " +
           "JOIN bf.food f " +
           "JOIN bf.booking b " +
           "WHERE b.status IN ('CONFIRMED', 'COMPLETED') " +
           "AND (:startDate IS NULL OR b.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR b.createdAt <= :endDate) " +
           "GROUP BY f.category " +
           "ORDER BY totalRevenue DESC")
    List<java.util.Map<String, Object>> getFoodRevenueByCategory(
           @Param("startDate") LocalDateTime startDate,
           @Param("endDate") LocalDateTime endDate);
}
