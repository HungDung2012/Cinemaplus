package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(length = 15)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(length = 255)
    private String avatar;
    
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Gender gender;
    
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "membership_level", nullable = false)
    @Builder.Default
    private MembershipLevel membershipLevel = MembershipLevel.NORMAL;
    
    @Column(name = "total_spending", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalSpending = BigDecimal.ZERO;
    
    @Column(name = "current_points")
    @Builder.Default
    private Integer currentPoints = 0;
    
    @Column(name = "total_points_earned")
    @Builder.Default
    private Integer totalPointsEarned = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Booking> bookings = new ArrayList<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PointHistory> pointHistories = new ArrayList<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<UserVoucher> userVouchers = new ArrayList<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<UserCoupon> userCoupons = new ArrayList<>();

    public enum Role {
        USER, ADMIN
    }
    
    public enum Gender {
        MALE, FEMALE, OTHER
    }
    
    public enum MembershipLevel {
        NORMAL, VIP, PLATINUM
    }
}
