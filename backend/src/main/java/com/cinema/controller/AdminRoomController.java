package com.cinema.controller;

import com.cinema.audit.AuditAction;
import com.cinema.audit.Auditable;
import com.cinema.dto.RoomDTO;
import com.cinema.dto.request.RoomRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.model.Room;
import com.cinema.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/rooms")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGE_ROOMS')")
public class AdminRoomController {

    private final RoomService roomService;

    @PostMapping
    @Auditable(action = AuditAction.CREATE, entity = "Room", entityClass = Room.class)
    public ResponseEntity<ApiResponse<RoomDTO>> createRoom(
            @RequestBody RoomRequest request) {
        RoomDTO room = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Room created", room));
    }

    @PutMapping("/{id}")
    @Auditable(action = AuditAction.UPDATE, entity = "Room", entityClass = Room.class, entityIdParam = "id")
    public ResponseEntity<ApiResponse<RoomDTO>> updateRoom(
            @PathVariable Long id,
            @RequestBody RoomRequest request) {
        RoomDTO room = roomService.updateRoom(id, request);
        return ResponseEntity.ok(ApiResponse.success("Room updated", room));
    }

    @DeleteMapping("/{id}")
    @Auditable(action = AuditAction.DELETE, entity = "Room", entityClass = Room.class, entityIdParam = "id")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponse.success("Room deleted", null));
    }
}
