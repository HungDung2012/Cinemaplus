package com.cinema.controller;

import com.cinema.dto.request.AutoScheduleRequest;
import com.cinema.dto.request.ScheduleTemplateRequest;
import com.cinema.dto.response.*;
import com.cinema.service.AutoScheduleService;
import com.cinema.service.ScheduleTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/auto-schedule")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGE_SHOWTIMES')")
public class AdminAutoScheduleController {

    private final AutoScheduleService autoScheduleService;
    private final ScheduleTemplateService templateService;

    // ===================== AUTO-SCHEDULE =====================

    @PostMapping("/preview")
    public ResponseEntity<ApiResponse<AutoSchedulePreviewResponse>> previewAutoSchedule(
            @Valid @RequestBody AutoScheduleRequest request) {
        AutoSchedulePreviewResponse preview = autoScheduleService.preview(request);
        return ResponseEntity.ok(ApiResponse.success("Preview lịch chiếu tự động", preview));
    }

    @PostMapping("/execute")
    public ResponseEntity<ApiResponse<AutoScheduleResult>> executeAutoSchedule(
            @Valid @RequestBody AutoScheduleRequest request) {
        AutoScheduleResult result = autoScheduleService.execute(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(result.getMessage(), result));
    }

    // ===================== SCHEDULE TEMPLATES =====================

    @GetMapping("/templates")
    public ResponseEntity<ApiResponse<List<ScheduleTemplateResponse>>> getAllTemplates(
            @RequestParam(required = false) String dayType) {
        List<ScheduleTemplateResponse> templates;
        if (dayType != null && !dayType.isBlank()) {
            templates = templateService.getByDayType(dayType);
        } else {
            templates = templateService.getAllActive();
        }
        return ResponseEntity.ok(ApiResponse.success("Danh sách template", templates));
    }

    @GetMapping("/templates/{id}")
    public ResponseEntity<ApiResponse<ScheduleTemplateResponse>> getTemplateById(@PathVariable Long id) {
        ScheduleTemplateResponse template = templateService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(template));
    }

    @PostMapping("/templates")
    public ResponseEntity<ApiResponse<ScheduleTemplateResponse>> createTemplate(
            @Valid @RequestBody ScheduleTemplateRequest request) {
        ScheduleTemplateResponse template = templateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo template thành công", template));
    }

    @PutMapping("/templates/{id}")
    public ResponseEntity<ApiResponse<ScheduleTemplateResponse>> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody ScheduleTemplateRequest request) {
        ScheduleTemplateResponse template = templateService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật template thành công", template));
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable Long id) {
        templateService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa template thành công", null));
    }
}
