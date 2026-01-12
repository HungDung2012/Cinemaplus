package com.cinema.service;

import com.cinema.dto.response.TheaterResponse;
import com.cinema.exception.ResourceNotFoundException;
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
    
    public List<TheaterResponse> getTheatersByCity(String city) {
        return theaterRepository.findByCityAndActiveTrue(city).stream()
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
        TheaterResponse response = modelMapper.map(theater, TheaterResponse.class);
        response.setTotalRooms(theater.getRooms() != null ? theater.getRooms().size() : 0);
        if (theater.getRegion() != null) {
            response.setRegionId(theater.getRegion().getId());
            response.setRegionName(theater.getRegion().getName());
        }
        return response;
    }
}
