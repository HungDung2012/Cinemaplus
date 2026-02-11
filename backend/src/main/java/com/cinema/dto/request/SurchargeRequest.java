package com.cinema.dto.request;

import com.cinema.model.Surcharge.SurchargeType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SurchargeRequest {
    private String name;
    private SurchargeType type;
    private String targetId;
    private BigDecimal amount;
    private String color;
    private String code;
    private Boolean active;
}
