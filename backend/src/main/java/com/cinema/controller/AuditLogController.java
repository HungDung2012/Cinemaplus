package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.model.AuditLog;
import com.cinema.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<AuditLog> logs = auditLogRepository.findAllByOrderByTimestampDesc(
                PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
