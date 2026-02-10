package com.cinema.repository;

import com.cinema.model.Surcharge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurchargeRepository extends JpaRepository<Surcharge, Long> {
    List<Surcharge> findByActiveTrue();
}
