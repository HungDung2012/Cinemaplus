package com.cinema.service;

import com.cinema.dto.response.RoomResponse;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.Room;
import com.cinema.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {
    
    private final RoomRepository roomRepository;
    
    public List<RoomResponse> getRoomsByTheater(Long theaterId) {
        return roomRepository.findByTheaterIdAndActiveTrue(theaterId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public RoomResponse getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", id));
        return mapToResponse(room);
    }
    
    private RoomResponse mapToResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .totalSeats(room.getTotalSeats())
                .rowsCount(room.getRowsCount())
                .columnsCount(room.getColumnsCount())
                .roomType(room.getRoomType())
                .active(room.getActive())
                .theaterId(room.getTheater().getId())
                .theaterName(room.getTheater().getName())
                .build();
    }
}
