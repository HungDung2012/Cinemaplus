package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.SeatResponse;
import com.cinema.service.SeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seats")
@RequiredArgsConstructor
public class SeatController {
    
    private final SeatService seatService;
    
    @GetMapping("/room/{roomId}")
    public ResponseEntity<ApiResponse<List<SeatResponse>>> getSeatsByRoom(@PathVariable Long roomId) {
        List<SeatResponse> seats = seatService.getSeatsByRoom(roomId);
        return ResponseEntity.ok(ApiResponse.success(seats));
    }
    
    @GetMapping("/showtime/{showtimeId}/room/{roomId}")
    public ResponseEntity<ApiResponse<List<SeatResponse>>> getSeatsByShowtime(
            @PathVariable Long showtimeId,
            @PathVariable Long roomId) {
        List<SeatResponse> seats = seatService.getSeatsByShowtime(roomId, showtimeId);
        return ResponseEntity.ok(ApiResponse.success(seats));
    }
}
