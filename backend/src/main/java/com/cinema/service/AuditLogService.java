package com.cinema.service;

import com.cinema.audit.AuditAction;
import com.cinema.dto.response.AuditLogFilterOptionsResponse;
import com.cinema.dto.response.AuditLogResponse;
import com.cinema.model.AuditLog;
import com.cinema.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public Page<AuditLogResponse> getAuditLogs(
            Long userId,
            String username,
            AuditAction action,
            String entityName,
            String userRole,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            int page,
            int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<AuditLog> specification = Specification.where(null);

        if (userId != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("userId"), userId));
        }
        if (StringUtils.hasText(username)) {
            String pattern = "%" + username.trim().toLowerCase() + "%";
            specification = specification.and((root, query, cb) -> cb.like(cb.lower(root.get("username")), pattern));
        }
        if (action != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("action"), action));
        }
        if (StringUtils.hasText(entityName)) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("entityName"), entityName.trim()));
        }
        if (StringUtils.hasText(userRole)) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("userRole"), userRole.trim()));
        }
        if (fromDate != null) {
            specification = specification.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
        }
        if (toDate != null) {
            specification = specification.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
        }

        return auditLogRepository.findAll(specification, pageable).map(this::toResponse);
    }

    public AuditLogResponse getAuditLogById(Long id) {
        AuditLog auditLog = auditLogRepository.findById(id)
                .orElseThrow(() -> new com.cinema.exception.ResourceNotFoundException("AuditLog", "id", id));
        return toResponse(auditLog);
    }

    public AuditLogFilterOptionsResponse getFilterOptions() {
        return AuditLogFilterOptionsResponse.builder()
                .actions(auditLogRepository.findDistinctActions().stream()
                        .filter(Objects::nonNull)
                        .map(Enum::name)
                        .distinct()
                        .sorted()
                        .toList())
                .entityNames(auditLogRepository.findDistinctEntityNames())
                .usernames(auditLogRepository.findDistinctUsernames())
                .roles(auditLogRepository.findDistinctUserRoles())
                .build();
    }

    private AuditLogResponse toResponse(AuditLog auditLog) {
        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .action(auditLog.getAction())
                .entityName(auditLog.getEntityName())
                .entityId(auditLog.getEntityId())
                .userId(auditLog.getUserId())
                .username(auditLog.getUsername())
                .userRole(auditLog.getUserRole())
                .ipAddress(auditLog.getIpAddress())
                .userAgent(auditLog.getUserAgent())
                .reason(auditLog.getReason())
                .oldValues(auditLog.getOldValues())
                .newValues(auditLog.getNewValues())
                .createdAt(auditLog.getCreatedAt())
                .build();
    }
}
