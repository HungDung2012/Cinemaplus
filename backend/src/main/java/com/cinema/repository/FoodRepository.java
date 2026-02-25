package com.cinema.repository;

import com.cinema.model.Food;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Long> {

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);

    List<Food> findByActiveTrue();

    List<Food> findByCategoryAndActiveTrue(Food.FoodCategory category);

    List<Food> findByIsComboTrueAndActiveTrue();

    List<Food> findByIsComboFalseAndActiveTrue();

    @Query("SELECT f FROM Food f WHERE f.active = true ORDER BY f.sortOrder ASC, f.category ASC")
    List<Food> findAllActiveSorted();

    @Query("SELECT f FROM Food f ORDER BY f.sortOrder ASC, f.category ASC")
    List<Food> findAllSorted();

    @Query("SELECT DISTINCT f.category FROM Food f WHERE f.active = true")
    List<Food.FoodCategory> findAllAvailableCategories();

    // Pageable methods for admin pagination
    Page<Food> findByOrderByNameAsc(Pageable pageable);
    
    Page<Food> findByNameContainingIgnoreCaseOrderByNameAsc(String name, Pageable pageable);
    
    Page<Food> findByCategoryOrderByNameAsc(Food.FoodCategory category, Pageable pageable);
    
    Page<Food> findByIsAvailableOrderByNameAsc(Boolean isAvailable, Pageable pageable);
    
    Page<Food> findByNameContainingIgnoreCaseAndCategoryOrderByNameAsc(String name, Food.FoodCategory category, Pageable pageable);
    
    Page<Food> findByNameContainingIgnoreCaseAndIsAvailableOrderByNameAsc(String name, Boolean isAvailable, Pageable pageable);
    
    Page<Food> findByCategoryAndIsAvailableOrderByNameAsc(Food.FoodCategory category, Boolean isAvailable, Pageable pageable);
    
    Page<Food> findByNameContainingIgnoreCaseAndCategoryAndIsAvailableOrderByNameAsc(String name, Food.FoodCategory category, Boolean isAvailable, Pageable pageable);
}
