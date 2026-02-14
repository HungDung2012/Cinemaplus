package com.cinema.service.impl;

import com.cinema.dto.request.CreateUserRequest;
import com.cinema.dto.request.UpdateUserRequest;
import com.cinema.dto.response.UserResponse;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.User;
import com.cinema.repository.UserRepository;
import com.cinema.service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
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
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return modelMapper.map(user, UserResponse.class);
    }

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
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
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setRole(role);
        User updatedUser = userRepository.save(user);
        return modelMapper.map(updatedUser, UserResponse.class);
    }
}
