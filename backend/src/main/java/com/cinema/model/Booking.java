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
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_code", nullable = false, unique = true, length = 20)
    private String bookingCode;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "final_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal finalAmount;

    @Column(name = "seat_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal seatAmount = BigDecimal.ZERO;

    @Column(name = "food_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal foodAmount = BigDecimal.ZERO;

    @Column(name = "number_of_seats", nullable = false)
    private Integer numberOfSeats;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Column(length = 500)
    private String notes;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BookingSeat> bookingSeats = new ArrayList<>();

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BookingFood> bookingFoods = new ArrayList<>();

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Payment payment;

    public enum BookingStatus {
        PENDING, CONFIRMED, CANCELLED, EXPIRED, COMPLETED
    }

    // Helper method to add booking seat
    public void addBookingSeat(BookingSeat bookingSeat) {
        bookingSeats.add(bookingSeat);
        bookingSeat.setBooking(this);
    }

    // Helper method to add booking food
    public void addBookingFood(BookingFood bookingFood) {
        bookingFoods.add(bookingFood);
        bookingFood.setBooking(this);
    }
    
}
