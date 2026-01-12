package com.cinema.repository;

import com.cinema.model.Theater;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TheaterRepository extends JpaRepository<Theater, Long> {
    List<Theater> findByActiveTrue();
    List<Theater> findByCity(String city);
    List<Theater> findByCityAndActiveTrue(String city);
    List<Theater> findByRegionIdAndActiveTrue(Long regionId);
    List<Theater> findByRegionCodeAndActiveTrue(String regionCode);
}
