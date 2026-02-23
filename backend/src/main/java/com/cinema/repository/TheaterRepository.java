package com.cinema.repository;

import com.cinema.model.Theater;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TheaterRepository extends JpaRepository<Theater, Long> {
    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);

    List<Theater> findByActiveTrue();

    // Tìm theo City entity
    List<Theater> findByCityIdAndActiveTrue(Long cityId);

    List<Theater> findByCityCodeAndActiveTrue(String cityCode);

    // Tìm theo Region thông qua City
    @Query("SELECT t FROM Theater t WHERE t.city.region.id = :regionId AND t.active = true")
    List<Theater> findByRegionIdAndActiveTrue(Long regionId);

    @Query("SELECT t FROM Theater t WHERE t.city.region.code = :regionCode AND t.active = true")
    List<Theater> findByRegionCodeAndActiveTrue(String regionCode);

    /**
     * Lấy tất cả thành phố (City entity) có rạp đang hoạt động
     */
    @Query("SELECT DISTINCT t.city.name FROM Theater t WHERE t.active = true AND t.city IS NOT NULL ORDER BY t.city.name")
    List<String> findAllActiveCityNames();

    /**
     * Đếm số rạp theo City ID
     */
    @Query("SELECT COUNT(t) FROM Theater t WHERE t.city.id = :cityId AND t.active = true")
    Long countByCityId(Long cityId);

    /**
     * Tìm theaters chưa được gán vào City (dùng cho migration)
     */
    @Query("SELECT t FROM Theater t WHERE t.city IS NULL")
    List<Theater> findTheatersWithoutCity();

    // Pageable methods for admin pagination
    Page<Theater> findByActiveTrueOrderByNameAsc(Pageable pageable);
    
    Page<Theater> findByNameContainingAndActiveTrueOrderByNameAsc(String name, Pageable pageable);
    
    @Query("SELECT t FROM Theater t WHERE t.city.name = :cityName AND t.active = true ORDER BY t.name ASC")
    Page<Theater> findByCityNameAndActiveTrueOrderByNameAsc(String cityName, Pageable pageable);
    
    @Query("SELECT t FROM Theater t WHERE t.name LIKE %:name% AND t.city.name = :cityName AND t.active = true ORDER BY t.name ASC")
    Page<Theater> findByNameContainingAndCityNameAndActiveTrueOrderByNameAsc(String name, String cityName, Pageable pageable);
}
