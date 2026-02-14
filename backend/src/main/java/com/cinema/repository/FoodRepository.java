package com.cinema.repository;

import com.cinema.model.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Long> {

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
}
