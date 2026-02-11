package com.cinema.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "price_lines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "price_header_id", nullable = false)
    @JsonIgnore
    private PriceHeader priceHeader;

    @Enumerated(EnumType.STRING)
    @Column(name = "customer_type")
    private CustomerType customerType; // ADULT, STUDENT, etc.

    @Enumerated(EnumType.STRING)
    @Column(name = "day_type")
    private DayType dayType; // WEEKDAY, WEEKEND, HOLIDAY, SPECIAL

    @Enumerated(EnumType.STRING)
    @Column(name = "time_slot")
    private TimeSlot timeSlot; // MORNING, DAY, EVENING, LATE

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type")
    private Room.RoomType roomType; // STANDARD, IMAX, VIP...

    @Column(nullable = false)
    private BigDecimal price;

    public enum CustomerType {
        ADULT, STUDENT, U22, SENIOR, MEMBER, VIP_MEMBER
    }

    public enum DayType {
        WEEKDAY, // Mon-Thu
        WEEKEND, // Fri-Sun
        HOLIDAY, // Special dates
        HAPPY_DAY // e.g. Tuesday
    }

    public enum TimeSlot {
        MORNING, // Before 10:00
        DAY, // 10:00 - 17:00
        EVENING, // 17:00 - 22:00
        LATE // After 22:00
    }
}
