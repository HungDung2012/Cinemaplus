package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "seat_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // e.g., STANDARD, VIP, COUPLE

    @Column(nullable = false)
    private String name; // e.g., Ghế Thường

    @Column(name = "price_multiplier", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal priceMultiplier = BigDecimal.ONE;

    @Column(name = "extra_fee", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal extraFee = BigDecimal.ZERO;

    @Column(length = 20)
    private String color; // Hex code mostly

    @Builder.Default
    private Boolean active = true;
}
