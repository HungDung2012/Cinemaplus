package com.cinema.service;

import com.cinema.dto.response.TheaterResponse;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.City;
import com.cinema.model.Region;
import com.cinema.model.Theater;
import com.cinema.repository.TheaterRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TheaterService {
    
    private final TheaterRepository theaterRepository;
    private final ModelMapper modelMapper;
    
    public List<TheaterResponse> getAllTheaters() {
        return theaterRepository.findByActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<TheaterResponse> getTheatersByCity(Long cityId) {
        return theaterRepository.findByCityIdAndActiveTrue(cityId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TheaterResponse> getTheatersByCityCode(String cityCode) {
        return theaterRepository.findByCityCodeAndActiveTrue(cityCode).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TheaterResponse> getTheatersByRegion(Long regionId) {
        return theaterRepository.findByRegionIdAndActiveTrue(regionId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TheaterResponse> getTheatersByRegionCode(String regionCode) {
        return theaterRepository.findByRegionCodeAndActiveTrue(regionCode).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public TheaterResponse getTheaterById(Long id) {
        Theater theater = theaterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Theater", "id", id));
        return mapToResponse(theater);
    }
    
    private TheaterResponse mapToResponse(Theater theater) {
        TheaterResponse response = TheaterResponse.builder()
                .id(theater.getId())
                .name(theater.getName())
                .address(theater.getAddress())
                .phone(theater.getPhone())
                .email(theater.getEmail())
                .imageUrl(theater.getImageUrl())
                .description(theater.getDescription())
                .active(theater.getActive())
                .totalRooms(theater.getRooms() != null ? theater.getRooms().size() : 0)
                .build();

        // Set City information
        City city = theater.getCity();
        if (city != null) {
            response.setCityId(city.getId());
            response.setCityName(city.getName());
            response.setCityCode(city.getCode());
            
            // Set Region information through City
            Region region = city.getRegion();
            if (region != null) {
                response.setRegionId(region.getId());
                response.setRegionName(region.getName());
                response.setRegionCode(region.getCode());
            }
        }

        return response;
    }
}
