package com.cinema.service;

import com.cinema.dto.request.CreateUserRequest;
import com.cinema.dto.request.UpdateUserRequest;
import com.cinema.dto.response.PageResponse;
import com.cinema.dto.response.UserResponse;
import com.cinema.model.User;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();

    PageResponse<UserResponse> getAllUsersPaged(String search, String role, Pageable pageable);

    UserResponse getUserById(Long id);

    UserResponse createUser(CreateUserRequest request);

    UserResponse updateUser(Long id, UpdateUserRequest request);

    void deleteUser(Long id);

    UserResponse updateUserRole(Long id, User.Role role);

    com.cinema.dto.response.UserDetailResponse getUserDetails(Long id);
}
