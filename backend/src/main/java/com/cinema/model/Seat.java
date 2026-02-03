package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "seats", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "room_id", "row_name", "seat_number" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "row_name", nullable = false, length = 5)
    private String rowName; // A, B, C, D...

    @Column(name = "seat_number", nullable = false)
    private Integer seatNumber; // 1, 2, 3...

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seat_type_id", nullable = true) // Nullable for migration
    private com.cinema.model.SeatType seatTypeObject;

    // Temporary field for migration compatibility or fallback
    @Enumerated(EnumType.STRING)
    @Column(name = "seat_type", nullable = true, insertable = false, updatable = false)
    private SeatTypeEnum seatType;

    public enum SeatTypeEnum {
        STANDARD, VIP, COUPLE, DISABLED
    }

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "seat", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BookingSeat> bookingSeats = new ArrayList<>();

    // Helper method to get seat label (e.g., "A1", "B5")
    public String getSeatLabel() {
        return rowName + seatNumber;
    }
}
