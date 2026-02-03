package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalTime;

@Entity
@Table(name = "ticket_prices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // e.g., Giá vé cuối tuần

    @Column(nullable = false)
    private BigDecimal basePrice;

    @Column(name = "priority")
    @Builder.Default
    private Integer priority = 0; // Higher number = Higher priority

    // Conditions
    @Column(name = "days_of_week")
    private String daysOfWeek; // e.g., "MONDAY,TUESDAY" or "ALL"

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type")
    private Room.RoomType roomType; // Null means all room types

    @Builder.Default
    private Boolean active = true;
}
