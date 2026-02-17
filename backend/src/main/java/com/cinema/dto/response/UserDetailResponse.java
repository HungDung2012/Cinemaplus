package com.cinema.dto.response;

import com.cinema.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private String avatar;
    private User.Role role;
    private Boolean active;
    private LocalDateTime createdAt;

    // Extended details
    private LocalDate dateOfBirth;
    private User.Gender gender;
    private User.MembershipLevel membershipLevel;
    private BigDecimal totalSpending;
    private Integer currentPoints;
    private Integer totalPointsEarned;

    // Associated data
    private List<BookingResponse> recentBookings;
    private List<UserVoucherDto> vouchers;
    private List<UserCouponDto> coupons;
}
