package com.cinema.dto.request;

import com.cinema.model.PriceLine.CustomerType;
import com.cinema.model.PriceLine.DayType;
import com.cinema.model.PriceLine.TimeSlot;
import com.cinema.model.Room.RoomType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PriceLineRequest {
    private Long id;
    private CustomerType customerType;
    private DayType dayType;
    private TimeSlot timeSlot;
    private RoomType roomType;
    private BigDecimal price;
}
