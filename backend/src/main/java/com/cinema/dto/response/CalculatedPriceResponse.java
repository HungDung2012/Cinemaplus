package com.cinema.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class CalculatedPriceResponse {
    private BigDecimal totalPrice;
    private List<PriceDetail> details;

    @Data
    @Builder
    public static class PriceDetail {
        private String seatCode;
        private BigDecimal originalPrice;
        private BigDecimal finalPrice;
        private String description; // E.g. "Adult - Standard 2D - Weekend"
    }
}
