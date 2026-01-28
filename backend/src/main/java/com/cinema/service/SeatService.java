package com.cinema.service;

import com.cinema.dto.response.SeatResponse;
import com.cinema.model.Seat;
import com.cinema.repository.BookingSeatRepository;
import com.cinema.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SeatService {

    private final SeatRepository seatRepository;
    private final BookingSeatRepository bookingSeatRepository;

    public List<SeatResponse> getSeatsByRoom(Long roomId) {
        return seatRepository.findByRoomIdOrderByRowAndNumber(roomId).stream()
                .map(seat -> mapToResponse(seat, null))
                .collect(Collectors.toList());
    }

    public List<SeatResponse> getSeatsByShowtime(Long roomId, Long showtimeId) {
        List<Long> bookedSeatIds = bookingSeatRepository.findBookedSeatIdsByShowtime(showtimeId);

        return seatRepository.findByRoomIdOrderByRowAndNumber(roomId).stream()
                .map(seat -> {
                    SeatResponse response = mapToResponse(seat, showtimeId);
                    response.setIsBooked(bookedSeatIds.contains(seat.getId()));
                    return response;
                })
                .collect(Collectors.toList());
    }

    private SeatResponse mapToResponse(Seat seat, Long showtimeId) {
        return SeatResponse.builder()
                .id(seat.getId())
                .rowName(seat.getRowName())
                .seatNumber(seat.getSeatNumber())
                .seatLabel(seat.getSeatLabel())
                .seatType(seat.getSeatType())
                .priceMultiplier(seat.getPriceMultiplier())
                .active(seat.getActive())
                .isBooked(false)
                .build();
    }
}
