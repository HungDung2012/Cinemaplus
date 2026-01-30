package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.RoomResponse;
import com.cinema.dto.RoomDTO;
import com.cinema.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/theater/{theaterId}")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getRoomsByTheater(@PathVariable Long theaterId) {
        List<RoomResponse> rooms = roomService.getRoomsByTheater(theaterId);
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomDTO>> getRoomById(@PathVariable Long id) {
        RoomDTO room = roomService.getRoomLayout(id);
        return ResponseEntity.ok(ApiResponse.success(room));
    }
}
