package com.cinema.dto.request;

import java.time.LocalDate;
import lombok.Data;

@Data
public class PriceHeaderRequest {
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer priority;
    private Boolean active;
}
