package com.cinema.config;

import com.cinema.model.User;
import com.cinema.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Khởi tạo dữ liệu mặc định khi ứng dụng khởi động
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createAdminIfNotExists();
    }

    private void createAdminIfNotExists() {
        String adminEmail = "admin@cinema.com";
        
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode("Admin123!"))
                    .fullName("Administrator")
                    .phone("0901234567")
                    .role(User.Role.ADMIN)
                    .active(true)
                    .build();
            
            userRepository.save(admin);
            log.info("=== Admin account created ===");
            log.info("Email: {}", adminEmail);
            log.info("Password: Admin123!");
            log.info("=============================");
        } else {
            // Đảm bảo user có role ADMIN
            userRepository.findByEmail(adminEmail).ifPresent(user -> {
                if (user.getRole() != User.Role.ADMIN) {
                    user.setRole(User.Role.ADMIN);
                    userRepository.save(user);
                    log.info("Updated {} to ADMIN role", adminEmail);
                }
            });
        }
    }
}
