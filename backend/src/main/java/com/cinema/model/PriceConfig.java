package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_configs", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "room_type", "day_type", "seat_type" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Determinants
    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false)
    private Room.RoomType roomType;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_type", nullable = false)
    private DayType dayType;

    @Enumerated(EnumType.STRING)
    @Column(name = "seat_type", nullable = false)
    private Seat.SeatType seatType;

    // Price
    @Column(name = "base_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum DayType {
        WEEKDAY, // Mon-Thu
        WEEKEND, // Fri-Sun
        HOLIDAY // Specific dates (logic to be handled in service)
    }
}
