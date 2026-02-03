package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.model.SeatType;
import com.cinema.model.TicketPrice;
import com.cinema.repository.SeatTypeRepository;
import com.cinema.repository.TicketPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class PriceController {

    private final TicketPriceRepository ticketPriceRepository;
    private final SeatTypeRepository seatTypeRepository;

    // ================== Ticket Prices ==================
    @GetMapping("/ticket-prices")
    public ResponseEntity<ApiResponse<List<TicketPrice>>> getAllTicketPrices() {
        return ResponseEntity.ok(ApiResponse.success(ticketPriceRepository.findAll()));
    }

    @PostMapping("/ticket-prices")
    public ResponseEntity<ApiResponse<TicketPrice>> createTicketPrice(@RequestBody TicketPrice ticketPrice) {
        return ResponseEntity.ok(ApiResponse.success(ticketPriceRepository.save(ticketPrice)));
    }

    // ================== Seat Types ==================
    @GetMapping("/seat-types")
    public ResponseEntity<ApiResponse<List<SeatType>>> getAllSeatTypes() {
        return ResponseEntity.ok(ApiResponse.success(seatTypeRepository.findAll()));
    }

    @PostMapping("/seat-types")
    public ResponseEntity<ApiResponse<SeatType>> createSeatType(@RequestBody SeatType seatType) {
        return ResponseEntity.ok(ApiResponse.success(seatTypeRepository.save(seatType)));
    }
}
