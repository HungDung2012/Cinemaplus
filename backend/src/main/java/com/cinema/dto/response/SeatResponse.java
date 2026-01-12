package com.cinema.dto.response;

import com.cinema.model.Seat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatResponse {
    private Long id;
    private String rowName;
    private Integer seatNumber;
    private String seatLabel;
    private Seat.SeatType seatType;
    private BigDecimal priceMultiplier;
    private Boolean active;
    private Boolean isBooked; // For showing availability in a specific showtime
}
