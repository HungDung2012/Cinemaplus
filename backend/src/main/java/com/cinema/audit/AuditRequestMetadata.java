package com.cinema.audit;

import lombok.Builder;

@Builder
public record AuditRequestMetadata(
        Long userId,
        String username,
        String userRole,
        String ipAddress,
        String userAgent) {
}
