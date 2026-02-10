package com.cinema.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class CalculatePriceRequest {
    private Long showtimeId;
    private List<Long> seatIds;
    private Long userId; // Optional, can be null for guests
}
