package com.cinema.service;

import com.cinema.dto.request.ScheduleTemplateRequest;
import com.cinema.dto.response.ScheduleTemplateResponse;
import com.cinema.exception.BadRequestException;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.ScheduleTemplate;
import com.cinema.model.ScheduleTemplateSlot;
import com.cinema.repository.ScheduleTemplateRepository;
import com.cinema.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleTemplateService {

    private final ScheduleTemplateRepository templateRepository;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // ===================== READ =====================

    public List<ScheduleTemplateResponse> getAllActive() {
        return templateRepository.findAllActiveWithSlots().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ScheduleTemplateResponse> getAll() {
        return templateRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ScheduleTemplateResponse getById(Long id) {
        ScheduleTemplate template = templateRepository.findByIdWithSlots(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template không tồn tại: " + id));
        return toResponse(template);
    }

    public List<ScheduleTemplateResponse> getByDayType(String dayType) {
        ScheduleTemplate.DayType dt = parseDayType(dayType);
        return templateRepository.findByDayTypeAndActiveTrue(dt).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ===================== CREATE =====================

    @Transactional
    public ScheduleTemplateResponse create(ScheduleTemplateRequest request) {
        if (templateRepository.existsByName(request.getName())) {
            throw new BadRequestException("Template với tên '" + request.getName() + "' đã tồn tại");
        }

        ScheduleTemplate template = ScheduleTemplate.builder()
                .name(request.getName())
                .dayType(parseDayType(request.getDayType()))
                .cleaningMinutes(request.getCleaningMinutes() != null ? request.getCleaningMinutes() : 15)
                .bufferMinutes(request.getBufferMinutes() != null ? request.getBufferMinutes() : 10)
                .adsMinutes(request.getAdsMinutes() != null ? request.getAdsMinutes() : 20)
                .active(request.getActive() != null ? request.getActive() : true)
                .createdBy(getCurrentUserId())
                .build();

        if (request.getSlots() != null) {
            for (ScheduleTemplateRequest.SlotRequest slotReq : request.getSlots()) {
                ScheduleTemplateSlot slot = ScheduleTemplateSlot.builder()
                        .startTime(LocalTime.parse(slotReq.getStartTime(), TIME_FMT))
                        .label(slotReq.getLabel())
                        .priority(slotReq.getPriority() != null ? slotReq.getPriority() : 0)
                        .build();
                template.addSlot(slot);
            }
        }

        template = templateRepository.save(template);
        log.info("Created schedule template: id={}, name={}", template.getId(), template.getName());
        return toResponse(template);
    }

    // ===================== UPDATE =====================

    @Transactional
    public ScheduleTemplateResponse update(Long id, ScheduleTemplateRequest request) {
        ScheduleTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template không tồn tại: " + id));

        if (templateRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new BadRequestException("Template với tên '" + request.getName() + "' đã tồn tại");
        }

        template.setName(request.getName());
        template.setDayType(parseDayType(request.getDayType()));
        template.setCleaningMinutes(request.getCleaningMinutes() != null ? request.getCleaningMinutes() : 15);
        template.setBufferMinutes(request.getBufferMinutes() != null ? request.getBufferMinutes() : 10);
        template.setAdsMinutes(request.getAdsMinutes() != null ? request.getAdsMinutes() : 20);
        if (request.getActive() != null) {
            template.setActive(request.getActive());
        }

        // Replace slots
        template.getSlots().clear();
        if (request.getSlots() != null) {
            for (ScheduleTemplateRequest.SlotRequest slotReq : request.getSlots()) {
                ScheduleTemplateSlot slot = ScheduleTemplateSlot.builder()
                        .startTime(LocalTime.parse(slotReq.getStartTime(), TIME_FMT))
                        .label(slotReq.getLabel())
                        .priority(slotReq.getPriority() != null ? slotReq.getPriority() : 0)
                        .build();
                template.addSlot(slot);
            }
        }

        template = templateRepository.save(template);
        log.info("Updated schedule template: id={}, name={}", template.getId(), template.getName());
        return toResponse(template);
    }

    // ===================== DELETE =====================

    @Transactional
    public void delete(Long id) {
        ScheduleTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template không tồn tại: " + id));
        templateRepository.delete(template);
        log.info("Deleted schedule template: id={}, name={}", template.getId(), template.getName());
    }

    // ===================== HELPERS =====================

    private ScheduleTemplate.DayType parseDayType(String dayType) {
        try {
            return ScheduleTemplate.DayType.valueOf(dayType.toUpperCase());
        } catch (Exception e) {
            throw new BadRequestException("Loại ngày không hợp lệ: " + dayType + ". Chấp nhận: WEEKDAY, WEEKEND, HOLIDAY");
        }
    }

    private Long getCurrentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
                return principal.getId();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private ScheduleTemplateResponse toResponse(ScheduleTemplate template) {
        List<ScheduleTemplateResponse.SlotResponse> slotResponses = template.getSlots().stream()
                .map(slot -> ScheduleTemplateResponse.SlotResponse.builder()
                        .id(slot.getId())
                        .startTime(slot.getStartTime().format(TIME_FMT))
                        .label(slot.getLabel())
                        .priority(slot.getPriority())
                        .build())
                .collect(Collectors.toList());

        return ScheduleTemplateResponse.builder()
                .id(template.getId())
                .name(template.getName())
                .dayType(template.getDayType().name())
                .cleaningMinutes(template.getCleaningMinutes())
                .bufferMinutes(template.getBufferMinutes())
                .adsMinutes(template.getAdsMinutes())
                .active(template.getActive())
                .createdBy(template.getCreatedBy())
                .createdAt(template.getCreatedAt() != null ? template.getCreatedAt().toString() : null)
                .updatedAt(template.getUpdatedAt() != null ? template.getUpdatedAt().toString() : null)
                .slots(slotResponses)
                .build();
    }
}
