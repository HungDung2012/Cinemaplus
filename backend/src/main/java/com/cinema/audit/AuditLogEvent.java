package com.cinema.audit;

import java.util.Map;

public record AuditLogEvent(
        AuditAction action,
        String entityName,
        String entityId,
        AuditRequestMetadata requestMetadata,
        String reason,
        Map<String, Object> oldValues,
        Map<String, Object> newValues) {
}
