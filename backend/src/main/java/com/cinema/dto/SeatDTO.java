package com.cinema.dto;

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
public class SeatDTO {
    private Long id;
    private String rowName;
    private Integer seatNumber;
    private Seat.SeatType seatType;
    private BigDecimal priceMultiplier;
    private Boolean active;

    // Calculated field
    public String getSeatLabel() {
        return rowName + seatNumber;
    }
}
