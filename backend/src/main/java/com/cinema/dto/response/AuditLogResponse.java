package com.cinema.dto.response;

import com.cinema.audit.AuditAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private AuditAction action;
    private String entityName;
    private String entityId;
    private Long userId;
    private String username;
    private String userRole;
    private String ipAddress;
    private String userAgent;
    private String reason;
    private Map<String, Object> oldValues;
    private Map<String, Object> newValues;
    private LocalDateTime createdAt;
}
