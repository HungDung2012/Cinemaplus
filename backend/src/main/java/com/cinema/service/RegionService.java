package com.cinema.service;

import com.cinema.dto.response.RegionResponse;
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
        return RegionResponse.builder()
                .id(region.getId())
                .name(region.getName())
                .code(region.getCode())
                .theaterCount(region.getTheaters() != null ? region.getTheaters().size() : 0)
                .build();
    }
}
