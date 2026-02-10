package com.cinema.dto;

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
    private String seatTypeCode;
    private String seatTypeName;
    private BigDecimal priceMultiplier;
    private BigDecimal extraFee;
    private String seatColor;
    private Boolean active;

    // Calculated field
    public String getSeatLabel() {
        return rowName + seatNumber;
    }
}
