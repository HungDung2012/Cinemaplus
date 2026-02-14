package com.cinema.dto.request;

import com.cinema.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    private String fullName;
    private String phone;
    private String address;
    private User.Gender gender;
    private LocalDate dateOfBirth;
    private User.Role role;
    private Boolean active;
    // Password update usually handled separately, but can be included if Admin
    // resets it
    private String password;
}
