package com.cinema.controller;

import com.cinema.audit.AuditAction;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.AuditLogFilterOptionsResponse;
import com.cinema.dto.response.AuditLogResponse;
import com.cinema.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('VIEW_AUDIT_LOGS')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) String entityName,
            @RequestParam(required = false) String userRole,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getAuditLogs(
                userId,
                username,
                action,
                entityName,
                userRole,
                fromDate,
                toDate,
                page,
                size)));
    }

    @GetMapping("/filters")
    public ResponseEntity<ApiResponse<AuditLogFilterOptionsResponse>> getFilterOptions() {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getFilterOptions()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AuditLogResponse>> getAuditLog(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getAuditLogById(id)));
    }
}
