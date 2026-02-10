package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "surcharges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Surcharge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // e.g. "VIP Seat", "Blockbuster", "Tet Holiday"

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private SurchargeType type;

    @Column(name = "target_id")
    private String targetId; // ID of the SeatType, Movie, or Date (if applicable)

    @Column(nullable = false)
    private BigDecimal amount;

    @Builder.Default
    private Boolean active = true;

    // Is this a flat fee or percentage? (Simple for now: flat amount)

    public enum SurchargeType {
        SEAT_TYPE, // Linked to SeatType code
        MOVIE_TYPE, // Linked to Movie properties (e.g. Blockbuster)
        DATE_TYPE, // Specific Date
        FORMAT_3D // 3D Glasses etc
    }
}
