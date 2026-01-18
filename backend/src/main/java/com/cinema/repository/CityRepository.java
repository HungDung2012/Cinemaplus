package com.cinema.repository;

import com.cinema.model.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityRepository extends JpaRepository<City, Long> {
    
    Optional<City> findByCode(String code);
    
    Optional<City> findByName(String name);
    
    List<City> findByActiveTrue();
    
    List<City> findByRegionIdAndActiveTrue(Long regionId);
    
    List<City> findByRegionCodeAndActiveTrue(String regionCode);
    
    /**
     * Tìm tất cả thành phố có rạp đang hoạt động
     */
    @Query("SELECT DISTINCT c FROM City c JOIN c.theaters t WHERE t.active = true AND c.active = true ORDER BY c.name")
    List<City> findCitiesWithActiveTheaters();
    
    /**
     * Đếm số rạp trong thành phố
     */
    @Query("SELECT COUNT(t) FROM Theater t WHERE t.city.id = :cityId AND t.active = true")
    Long countActiveTheatersByCityId(Long cityId);
    
    boolean existsByCode(String code);
    
    boolean existsByName(String name);
}
