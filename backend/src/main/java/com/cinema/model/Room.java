package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "total_seats", nullable = false)
    private Integer totalSeats;

    @Column(name = "rows_count")
    private Integer rowsCount;

    @Column(name = "columns_count")
    private Integer columnsCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false)
    @Builder.Default
    private RoomType roomType = RoomType.STANDARD_2D;

    @Column(name = "seat_layout", columnDefinition = "TEXT")
    private String seatLayout; // JSON structure for grid editor

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "theater_id", nullable = false)
    private Theater theater;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Seat> seats = new ArrayList<>();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Showtime> showtimes = new ArrayList<>();

    public enum RoomType {
        STANDARD_2D, STANDARD_3D, IMAX, IMAX_3D, VIP_4DX
    }
}
