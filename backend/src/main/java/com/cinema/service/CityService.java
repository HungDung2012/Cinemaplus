package com.cinema.service;

import com.cinema.dto.response.CityResponse;

import com.cinema.exception.DuplicateResourceException;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.City;
import com.cinema.model.Theater;
import com.cinema.repository.CityRepository;
import com.cinema.repository.TheaterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CityService {

    private final CityRepository cityRepository;
    private final TheaterRepository theaterRepository;

    /**
     * Lấy tất cả thành phố đang hoạt động
     */
    public List<CityResponse> getAllCities() {
        return cityRepository.findByActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy thành phố theo ID
     */
    public CityResponse getCityById(Long id) {
        City city = cityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("City", "id", id));
        return mapToResponse(city);
    }

    /**
     * Lấy thành phố theo code
     */
    public CityResponse getCityByCode(String code) {
        City city = cityRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("City", "code", code));
        return mapToResponse(city);
    }

    /**
     * Lấy danh sách thành phố theo region
     */
    public List<CityResponse> getCitiesByRegion(City.RegionType regionType) {
        return cityRepository.findByRegionTypeAndActiveTrue(regionType).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách thành phố theo region code
     */
    public List<CityResponse> getCitiesByRegionCode(String regionCode) {
        try {
            City.RegionType regionType = City.RegionType.valueOf(regionCode.toUpperCase());
            return getCitiesByRegion(regionType);
        } catch (IllegalArgumentException e) {
            return List.of();
        }
    }

    /**
     * Lấy danh sách thành phố có rạp đang hoạt động
     */
    public List<CityResponse> getCitiesWithActiveTheaters() {
        return cityRepository.findCitiesWithActiveTheaters().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Tạo mới thành phố
     */
    @Transactional
    public CityResponse createCity(String name, String code, City.RegionType regionType) {
        // Validate
        if (cityRepository.existsByCode(code)) {
            throw new DuplicateResourceException("City", "code", code);
        }
        if (cityRepository.existsByName(name)) {
            throw new DuplicateResourceException("City", "name", name);
        }

        City city = City.builder()
                .name(name)
                .code(code)
                .regionType(regionType)
                .active(true)
                .build();

        City savedCity = cityRepository.save(city);
        log.info("Created new city: {} with code: {} in region: {}", name, code, regionType.name());

        return mapToResponse(savedCity);
    }

    /**
     * MIGRATION METHOD: Gán các Theater chưa có City vào City mặc định
     * Phương thức này sẽ:
     * 1. Tìm tất cả Theater chưa được gán vào City
     * 2. Tạo City mặc định cho mỗi Region nếu chưa tồn tại
     * 3. Gán Theater vào City mặc định của Region tương ứng
     * 
     * @return Số lượng theater đã được migrate
     */
    @Transactional
    public int migrateTheatersToCities() {
        log.info("Starting migration: Assigning theaters without city to default cities...");

        // Đảm bảo có City mặc định cho mỗi Region
        createDefaultCitiesForAllRegions();

        // Tìm tất cả theaters chưa có city
        List<Theater> theatersWithoutCity = theaterRepository.findTheatersWithoutCity();

        if (theatersWithoutCity.isEmpty()) {
            log.info("No theaters need migration. All theaters already have a city assigned.");
            return 0;
        }

        log.info("Found {} theaters without city assignment", theatersWithoutCity.size());

        // Lấy city mặc định đầu tiên (nếu có)
        City defaultCity = cityRepository.findAll().stream()
                .filter(c -> c.getActive() != null && c.getActive())
                .findFirst()
                .orElse(null);

        if (defaultCity == null) {
            log.error("No default city available for migration");
            return 0;
        }

        int migratedCount = 0;
        for (Theater theater : theatersWithoutCity) {
            theater.setCity(defaultCity);
            theaterRepository.save(theater);
            log.info("Migrated theater '{}' to city '{}'", theater.getName(), defaultCity.getName());
            migratedCount++;
        }

        log.info("Migration completed. Total theaters migrated: {}", migratedCount);
        return migratedCount;
    }

    /**
     * Tạo City mặc định cho mỗi Region (dùng khi khởi tạo hệ thống)
     */
    @Transactional
    public void createDefaultCitiesForAllRegions() {
        log.info("Creating default cities for all regions...");

        for (City.RegionType regionType : City.RegionType.values()) {
            String defaultCityName = getDefaultCityForRegion(regionType.name());
            String cityCode = generateCityCode(defaultCityName);

            if (!cityRepository.existsByCode(cityCode)) {
                City city = City.builder()
                        .name(defaultCityName)
                        .code(cityCode)
                        .regionType(regionType)
                        .active(true)
                        .build();

                cityRepository.save(city);
                log.info("Created default city '{}' for region '{}'", defaultCityName, regionType.name());
            }
        }
    }

    // ==================== Helper Methods ====================

    private CityResponse mapToResponse(City city) {
        CityResponse response = CityResponse.builder()
                .id(city.getId())
                .name(city.getName())
                .code(city.getCode())
                .provinceCode(city.getProvinceCode())
                .active(city.getActive())
                .build();

        if (city.getRegionType() != null) {
            City.RegionType regionType = city.getRegionType();
            response.setRegionCode(regionType.name());
            // Set name based on enum
            if (regionType == City.RegionType.NORTH)
                response.setRegionName("Miền Bắc");
            else if (regionType == City.RegionType.CENTRAL)
                response.setRegionName("Miền Trung");
            else if (regionType == City.RegionType.SOUTH)
                response.setRegionName("Miền Nam");
        }

        Long theaterCount = cityRepository.countActiveTheatersByCityId(city.getId());
        response.setTheaterCount(theaterCount != null ? theaterCount.intValue() : 0);

        return response;
    }

    private String generateCityCode(String cityName) {
        if (cityName == null || cityName.trim().isEmpty()) {
            return "UNKNOWN";
        }

        // Normalize Vietnamese characters and convert to code
        String normalized = Normalizer.normalize(cityName, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String withoutDiacritics = pattern.matcher(normalized).replaceAll("");

        return withoutDiacritics
                .toUpperCase()
                .replaceAll("[^A-Z0-9]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
    }

    private String getDefaultCityForRegion(String regionCode) {
        return switch (regionCode) {
            case "NORTH" -> "Hà Nội";
            case "CENTRAL" -> "Đà Nẵng";
            case "SOUTH" -> "TP. Hồ Chí Minh";
            default -> "Thành phố khác";
        };
    }
}
