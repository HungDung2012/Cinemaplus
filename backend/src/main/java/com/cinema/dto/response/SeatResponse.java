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
    private String seatTypeCode;
    private String seatTypeName;
    private BigDecimal priceMultiplier;
    private BigDecimal extraFee;
    private String seatColor;
    private Boolean active;
    private Boolean isBooked; // For showing availability in a specific showtime
}
