package com.cinema.service.impl;

import com.cinema.dto.request.CreateUserRequest;
import com.cinema.dto.request.UpdateUserRequest;
import com.cinema.dto.response.PageResponse;
import com.cinema.dto.response.UserResponse;
import com.cinema.exception.DuplicateResourceException;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.User;
import com.cinema.repository.UserRepository;
import com.cinema.service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> modelMapper.map(user, UserResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    public PageResponse<UserResponse> getAllUsersPaged(String search, String role, Pageable pageable) {
        Page<User> users;
        if (search != null && !search.trim().isEmpty() && role != null && !role.trim().isEmpty()) {
            users = userRepository.findByFullNameContainingIgnoreCaseAndRoleAndActiveTrueOrderByCreatedAtDesc(search, User.Role.valueOf(role), pageable);
        } else if (search != null && !search.trim().isEmpty()) {
            users = userRepository.findByFullNameContainingIgnoreCaseAndActiveTrueOrderByCreatedAtDesc(search, pageable);
        } else if (role != null && !role.trim().isEmpty()) {
            users = userRepository.findByRoleAndActiveTrueOrderByCreatedAtDesc(User.Role.valueOf(role), pageable);
        } else {
            users = userRepository.findByActiveTrueOrderByCreatedAtDesc(pageable);
        }
        return createPageResponse(users);
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return modelMapper.map(user, UserResponse.class);
    }

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email '" + request.getEmail() + "' đã tồn tại");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .role(request.getRole() != null ? request.getRole() : User.Role.USER)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        User savedUser = userRepository.save(user);
        return modelMapper.map(savedUser, UserResponse.class);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        // Check duplicate email if email is being updated (though request doesn't have
        // email field typically for update, but handling just in case or if logic
        // changes)
        // UpdateUserRequest currently doesn't seem to have email based on previous
        // view, but let's check.
        // Based on view_file of UserServiceImpl earlier, UpdateUserRequest did NOT have
        // email in the set fields block.
        // Wait, let me re-check UpdateUserRequest. I'll stick to what I saw.
        // setFullName, setPhone... I don't see setEmail.
        // If email is not updateable, then no check needed.
        // However, looking at the code I saw earlier:
        /*
         * 71: if (request.getFullName() != null)
         * 72: user.setFullName(request.getFullName());
         */
        // It didn't seem to update email. Let's verify UpdateUserRequest to be sure.

        if (request.getFullName() != null)
            user.setFullName(request.getFullName());
        if (request.getPhone() != null)
            user.setPhone(request.getPhone());
        if (request.getAddress() != null)
            user.setAddress(request.getAddress());
        if (request.getGender() != null)
            user.setGender(request.getGender());
        if (request.getDateOfBirth() != null)
            user.setDateOfBirth(request.getDateOfBirth());
        if (request.getRole() != null)
            user.setRole(request.getRole());
        if (request.getActive() != null)
            user.setActive(request.getActive());

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updatedUser = userRepository.save(user);
        return modelMapper.map(updatedUser, UserResponse.class);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userRepository.deleteById(id);
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(Long id, User.Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setRole(role);
        User updatedUser = userRepository.save(user);
        return modelMapper.map(updatedUser, UserResponse.class);
    }

    @Override
    @Transactional(readOnly = true)
    public com.cinema.dto.response.UserDetailResponse getUserDetails(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Map Bookings
        java.util.List<com.cinema.dto.response.BookingResponse> recentBookings = user.getBookings().stream()
                .sorted((b1, b2) -> b2.getCreatedAt().compareTo(b1.getCreatedAt())) // Newest first
                .limit(10) // Limit to 10 recent bookings
                .map(this::mapToBookingResponse)
                .collect(java.util.stream.Collectors.toList());

        // Map Vouchers
        java.util.List<com.cinema.dto.response.UserVoucherDto> vouchers = user.getUserVouchers().stream()
                .map(uv -> com.cinema.dto.response.UserVoucherDto.builder()
                        .id(uv.getId())
                        .voucherId(uv.getVoucher().getId())
                        .code(uv.getVoucher().getVoucherCode())
                        .description(uv.getVoucher().getDescription())
                        .status(uv.getStatus())
                        .redeemedAt(uv.getRedeemedAt())
                        .usedAt(uv.getUsedAt())
                        .build())
                .collect(java.util.stream.Collectors.toList());

        // Map Coupons
        java.util.List<com.cinema.dto.response.UserCouponDto> coupons = user.getUserCoupons().stream()
                .map(uc -> com.cinema.dto.response.UserCouponDto.builder()
                        .id(uc.getId())
                        .couponId(uc.getCoupon().getId())
                        .code(uc.getCoupon().getCouponCode())
                        .description(uc.getCoupon().getDescription())
                        .status(uc.getStatus())
                        .redeemedAt(uc.getRedeemedAt())
                        .usedAt(uc.getUsedAt())
                        .build())
                .collect(java.util.stream.Collectors.toList());

        return com.cinema.dto.response.UserDetailResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .membershipLevel(user.getMembershipLevel())
                .totalSpending(user.getTotalSpending())
                .currentPoints(user.getCurrentPoints())
                .totalPointsEarned(user.getTotalPointsEarned())
                .recentBookings(recentBookings)
                .vouchers(vouchers)
                .coupons(coupons)
                .build();
    }

    // Helper to reuse booking mapping logic if not already available in
    // BookingService
    // Ideally this should be in a Mapper or BookingService, but for now we
    // duplicate small logic or inject BookingMapper
    // To avoid circular dependency with BookingService, we implement a simple
    // mapper here or use ModelMapper
    private com.cinema.dto.response.BookingResponse mapToBookingResponse(com.cinema.model.Booking booking) {
        return com.cinema.dto.response.BookingResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .totalAmount(booking.getTotalAmount())
                .finalAmount(booking.getFinalAmount())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .movieTitle(booking.getShowtime().getMovie().getTitle())
                .theaterName(booking.getShowtime().getRoom().getTheater().getName())
                .showDate(booking.getShowtime().getShowDate())
                .startTime(booking.getShowtime().getStartTime())
                .build();
    }

    private PageResponse<UserResponse> createPageResponse(Page<User> users) {
        List<UserResponse> content = users.getContent().stream()
                .map(user -> modelMapper.map(user, UserResponse.class))
                .collect(Collectors.toList());

        return PageResponse.<UserResponse>builder()
                .content(content)
                .pageNumber(users.getNumber())
                .pageSize(users.getSize())
                .totalElements(users.getTotalElements())
                .totalPages(users.getTotalPages())
                .last(users.isLast())
                .first(users.isFirst())
                .build();
    }
}
