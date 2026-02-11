package com.cinema.controller;

import com.cinema.dto.RoomDTO;
import com.cinema.dto.request.RoomRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/rooms")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRoomController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<ApiResponse<RoomDTO>> createRoom(
            @RequestBody RoomRequest request) {
        RoomDTO room = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Room created", room));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomDTO>> updateRoom(
            @PathVariable Long id,
            @RequestBody RoomRequest request) {
        RoomDTO room = roomService.updateRoom(id, request);
        return ResponseEntity.ok(ApiResponse.success("Room updated", room));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponse.success("Room deleted", null));
    }
}
