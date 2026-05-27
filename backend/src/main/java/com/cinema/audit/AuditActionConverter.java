package com.cinema.audit;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.util.StringUtils;

import java.util.Locale;

@Converter
public class AuditActionConverter implements AttributeConverter<AuditAction, String> {

    @Override
    public String convertToDatabaseColumn(AuditAction attribute) {
        return attribute != null ? attribute.name() : null;
    }

    @Override
    public AuditAction convertToEntityAttribute(String dbData) {
        if (!StringUtils.hasText(dbData)) {
            return null;
        }

        String normalized = dbData.trim().toUpperCase(Locale.ROOT);

        try {
            return AuditAction.valueOf(normalized);
        } catch (IllegalArgumentException ignored) {
            // Fall through to legacy normalization rules.
        }

        if (normalized.contains("LOGIN")) {
            return AuditAction.LOGIN;
        }
        if (normalized.contains("EXPORT") || normalized.contains("REPORT")) {
            return AuditAction.EXPORT;
        }
        if (normalized.startsWith("DELETE") || normalized.startsWith("REMOVE")) {
            return AuditAction.DELETE;
        }
        if (normalized.startsWith("CREATE") || normalized.startsWith("ADD") || normalized.startsWith("BATCH")) {
            return AuditAction.CREATE;
        }
        if (normalized.startsWith("UPDATE") || normalized.startsWith("EDIT") || normalized.startsWith("CHANGE")) {
            return AuditAction.UPDATE;
        }

        // Keep the record readable instead of failing the whole API.
        return AuditAction.UPDATE;
    }
}
