package com.cinema.audit;

import com.cinema.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Field;
import java.util.Map;

@Component
public class AuditRequestContextResolver {

    public AuditRequestMetadata resolve() {
        HttpServletRequest request = currentRequest();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        AuditRequestMetadata.AuditRequestMetadataBuilder builder = AuditRequestMetadata.builder()
                .ipAddress(resolveClientIp(request))
                .userAgent(request != null ? trimToLength(request.getHeader("User-Agent"), 1024) : null);

        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            builder.userId(principal.getId())
                    .username(principal.getUsername())
                    .userRole(principal.getRole() != null ? principal.getRole().name() : null);
        } else if (authentication != null && StringUtils.hasText(authentication.getName())
                && !"anonymousUser".equalsIgnoreCase(authentication.getName())) {
            builder.username(authentication.getName());
        }

        return builder.build();
    }

    public String resolveReason(Map<String, Object> arguments) {
        HttpServletRequest request = currentRequest();
        if (request != null) {
            String headerReason = firstNonBlank(
                    request.getHeader("X-Audit-Reason"),
                    request.getHeader("X-Reason"),
                    request.getParameter("reason"));
            if (StringUtils.hasText(headerReason)) {
                return trimToLength(headerReason, 4000);
            }
        }

        if (arguments == null || arguments.isEmpty()) {
            return null;
        }

        Object directReason = arguments.get("reason");
        if (directReason instanceof String value && StringUtils.hasText(value)) {
            return trimToLength(value, 4000);
        }

        Object auditReason = arguments.get("auditReason");
        if (auditReason instanceof String value && StringUtils.hasText(value)) {
            return trimToLength(value, 4000);
        }

        for (Object value : arguments.values()) {
            String extracted = extractReasonFromObject(value);
            if (StringUtils.hasText(extracted)) {
                return trimToLength(extracted, 4000);
            }
        }

        return null;
    }

    private String extractReasonFromObject(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Map<?, ?> map) {
            Object direct = map.get("reason");
            if (direct instanceof String text && StringUtils.hasText(text)) {
                return text;
            }
            Object auditReason = map.get("auditReason");
            if (auditReason instanceof String text && StringUtils.hasText(text)) {
                return text;
            }
            return null;
        }

        for (String fieldName : new String[] { "reason", "auditReason" }) {
            try {
                Field field = value.getClass().getDeclaredField(fieldName);
                field.setAccessible(true);
                Object extracted = field.get(value);
                if (extracted instanceof String text && StringUtils.hasText(text)) {
                    return text;
                }
            } catch (NoSuchFieldException | IllegalAccessException ignored) {
                // Ignore and continue to the next candidate.
            }
        }

        return null;
    }

    private HttpServletRequest currentRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor)) {
            return trimToLength(xForwardedFor.split(",")[0].trim(), 64);
        }
        return trimToLength(request.getRemoteAddr(), 64);
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private String trimToLength(String value, int maxLength) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String normalized = value.trim();
        return normalized.length() <= maxLength ? normalized : normalized.substring(0, maxLength);
    }
}
