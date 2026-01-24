package com.cinema.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
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
    private String action; // e.g., "CREATE_PRICE", "DELETE_SHOWTIME"

    @Column(name = "entity_name")
    private String entityName; // e.g., "PriceConfig"

    @Column(name = "entity_id")
    private String entityId;

    private String username;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(columnDefinition = "TEXT")
    private String details;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime timestamp;
}
