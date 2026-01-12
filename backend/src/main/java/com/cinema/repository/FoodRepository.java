package com.cinema.repository;

import com.cinema.model.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Long> {

    List<Food> findByIsAvailableTrue();

    List<Food> findByCategoryAndIsAvailableTrue(Food.FoodCategory category);

    List<Food> findByIsComboTrueAndIsAvailableTrue();

    List<Food> findByIsComboFalseAndIsAvailableTrue();

    @Query("SELECT f FROM Food f WHERE f.isAvailable = true ORDER BY f.sortOrder ASC, f.category ASC")
    List<Food> findAllAvailableSorted();

    @Query("SELECT DISTINCT f.category FROM Food f WHERE f.isAvailable = true")
    List<Food.FoodCategory> findAllAvailableCategories();
}
