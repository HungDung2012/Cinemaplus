package com.cinema.service;

import com.cinema.model.AuditLog;
import com.cinema.model.User;
import com.cinema.repository.AuditLogRepository;
import com.cinema.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    /**
     * Log an admin action with full details
     */
    @Transactional
    public void log(String action, String entityName, String entityId, String details) {
        log(action, entityName, entityId, details, null, null);
    }

    /**
     * Log an admin action with old/new value snapshots for change tracking
     */
    @Transactional
    public void log(String action, String entityName, String entityId, String details,
                    Object oldValue, Object newValue) {
        try {
            AuditLog.AuditLogBuilder builder = AuditLog.builder()
                    .action(action)
                    .entityName(entityName)
                    .entityId(entityId)
                    .details(details)
                    .ipAddress(getClientIp());

            // Get current user info from SecurityContext
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
                builder.userId(principal.getId())
                       .username(principal.getUsername())
                       .userRole(principal.getRole() != null ? principal.getRole().name() : null);
            }

            // Serialize old/new values as JSON
            if (oldValue != null) {
                builder.oldValue(toJson(oldValue));
            }
            if (newValue != null) {
                builder.newValue(toJson(newValue));
            }

            auditLogRepository.save(builder.build());
        } catch (Exception e) {
            log.error("Failed to write audit log: action={}, entity={}, id={}", action, entityName, entityId, e);
        }
    }

    /**
     * Get audit logs with filters
     */
    public Page<AuditLog> getAuditLogs(String username, String action, String entityName,
                                        String userRole, LocalDateTime fromDate, LocalDateTime toDate,
                                        int page, int size) {
        return auditLogRepository.findWithFilters(
                username, action, entityName, userRole, fromDate, toDate,
                PageRequest.of(page, size));
    }

    /**
     * Get all audit logs with simple pagination
     */
    public Page<AuditLog> getAll(int page, int size) {
        return auditLogRepository.findAllByOrderByTimestampDesc(PageRequest.of(page, size));
    }

    /**
     * Get distinct filter options for the UI dropdowns
     */
    public List<String> getDistinctActions() {
        return auditLogRepository.findDistinctActions();
    }

    public List<String> getDistinctEntityNames() {
        return auditLogRepository.findDistinctEntityNames();
    }

    public List<String> getDistinctUsernames() {
        return auditLogRepository.findDistinctUsernames();
    }

    // =================== HELPERS ===================

    private String getClientIp() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String xff = request.getHeader("X-Forwarded-For");
                if (xff != null && !xff.isEmpty()) {
                    return xff.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            log.debug("Could not determine client IP", e);
        }
        return null;
    }

    private String toJson(Object obj) {
        try {
            if (obj instanceof String) return (String) obj;
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.warn("Failed to serialize object to JSON", e);
            return obj.toString();
        }
    }
}
