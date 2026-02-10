package com.cinema.repository;

import com.cinema.model.PriceHeader;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PriceHeaderRepository extends JpaRepository<PriceHeader, Long> {

    // Find active headers valid for a given date, ordered by priority desc
    @Query("SELECT p FROM PriceHeader p WHERE p.active = true AND :date BETWEEN p.startDate AND p.endDate ORDER BY p.priority DESC")
    List<PriceHeader> findActiveHeadersForDate(LocalDate date);
}
