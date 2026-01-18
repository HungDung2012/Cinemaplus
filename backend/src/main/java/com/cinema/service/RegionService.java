package com.cinema.service;

import com.cinema.dto.response.RegionResponse;
import com.cinema.model.City;
import com.cinema.model.Region;
import com.cinema.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegionService {

    private final RegionRepository regionRepository;

    public List<RegionResponse> getAllRegions() {
        return regionRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private RegionResponse mapToResponse(Region region) {
        // Đếm tổng số theaters trong region thông qua cities
        int theaterCount = 0;
        if (region.getCities() != null) {
            for (City city : region.getCities()) {
                if (city.getTheaters() != null) {
                    theaterCount += (int) city.getTheaters().stream()
                            .filter(t -> t.getActive() != null && t.getActive())
                            .count();
                }
            }
        }

        return RegionResponse.builder()
                .id(region.getId())
                .name(region.getName())
                .code(region.getCode())
                .theaterCount(theaterCount)
                .build();
    }
}
