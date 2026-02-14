package com.cinema.controller;

import com.cinema.dto.request.CreateUserRequest;
import com.cinema.dto.request.UpdateUserRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.UserResponse;
import com.cinema.model.User;
import com.cinema.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(userService.createUser(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateUser(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // Deprecated or alternative endpoint for just updating role
    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(@PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String roleStr = body.get("role");
        try {
            User.Role role = User.Role.valueOf(roleStr);
            return ResponseEntity.ok(ApiResponse.success(userService.updateUserRole(id, role)));
        } catch (IllegalArgumentException ex) {
            throw new com.cinema.exception.BadRequestException("Invalid role: " + roleStr);
        }
    }
}
