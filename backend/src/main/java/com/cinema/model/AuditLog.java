package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_username", columnList = "username"),
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_entity", columnList = "entity_name"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp"),
    @Index(name = "idx_audit_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // e.g., "CREATE_MOVIE", "DELETE_SHOWTIME", "UPDATE_ROLE"

    @Column(name = "entity_name")
    private String entityName; // e.g., "Movie", "Showtime", "User"

    @Column(name = "entity_id")
    private String entityId;

    @Column(name = "user_id")
    private Long userId;

    private String username;

    @Column(name = "user_role")
    private String userRole; // e.g., "ADMIN", "MANAGER", "STAFF"

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue; // JSON snapshot of entity before change

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue; // JSON snapshot of entity after change

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime timestamp;
}
