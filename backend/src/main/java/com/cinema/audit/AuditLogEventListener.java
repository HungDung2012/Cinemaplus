package com.cinema.audit;

import com.cinema.model.AuditLog;
import com.cinema.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogEventListener {

    private final AuditLogRepository auditLogRepository;

    @Async("auditTaskExecutor")
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handle(AuditLogEvent event) {
        try {
            AuditRequestMetadata metadata = event.requestMetadata();
            auditLogRepository.save(AuditLog.builder()
                    .action(event.action())
                    .entityName(event.entityName())
                    .entityId(event.entityId())
                    .userId(metadata != null ? metadata.userId() : null)
                    .username(metadata != null ? metadata.username() : null)
                    .userRole(metadata != null ? metadata.userRole() : null)
                    .ipAddress(metadata != null ? metadata.ipAddress() : null)
                    .userAgent(metadata != null ? metadata.userAgent() : null)
                    .reason(event.reason())
                    .oldValues(event.oldValues())
                    .newValues(event.newValues())
                    .build());
        } catch (Exception exception) {
            log.error("Failed to persist audit log for {} {}", event.action(), event.entityName(), exception);
        }
    }
}
