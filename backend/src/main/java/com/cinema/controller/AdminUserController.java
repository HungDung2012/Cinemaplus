package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.UserResponse;
import com.cinema.model.User;
import com.cinema.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsers() {
        List<User> users = userRepository.findAll();
        List<UserResponse> resp = users.stream()
                .map(u -> modelMapper.map(u, UserResponse.class))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.cinema.exception.ResourceNotFoundException("User", "id", id));
        UserResponse resp = modelMapper.map(user, UserResponse.class);
        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(@PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String role = body.get("role");
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.cinema.exception.ResourceNotFoundException("User", "id", id));
        try {
            user.setRole(User.Role.valueOf(role));
            userRepository.save(user);
            return ResponseEntity.ok(ApiResponse.success(modelMapper.map(user, UserResponse.class)));
        } catch (IllegalArgumentException ex) {
            throw new com.cinema.exception.BadRequestException("Invalid role: " + role);
        }
    }
}
