package com.cinema.service;

import com.cinema.dto.request.CreateUserRequest;
import com.cinema.dto.request.UpdateUserRequest;
import com.cinema.dto.response.UserResponse;
import com.cinema.model.User;

import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();

    UserResponse getUserById(Long id);

    UserResponse createUser(CreateUserRequest request);

    UserResponse updateUser(Long id, UpdateUserRequest request);

    void deleteUser(Long id);

    UserResponse updateUserRole(Long id, User.Role role);
}
