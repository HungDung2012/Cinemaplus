package com.cinema.audit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Map;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLoggingAspect {

    private final AuditSnapshotService auditSnapshotService;
    private final AuditRequestContextResolver requestContextResolver;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Around("@annotation(auditable)")
    public Object audit(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Map<String, Object> arguments = resolveArguments(signature.getParameterNames(), joinPoint.getArgs());

        String initialEntityId = resolveEntityId(auditable, arguments, null);
        Map<String, Object> oldValues = shouldCaptureOldValues(auditable, initialEntityId)
                ? auditSnapshotService.captureEntitySnapshot(auditable.entityClass(), initialEntityId)
                : null;

        Object result = joinPoint.proceed();
        if (shouldSkipLogging(result)) {
            return result;
        }

        try {
            String resolvedEntityId = resolveEntityId(auditable, arguments, result);
            Map<String, Object> newValues = resolveNewValues(auditable, arguments, result, resolvedEntityId);
            applicationEventPublisher.publishEvent(new AuditLogEvent(
                    auditable.action(),
                    auditable.entity(),
                    resolvedEntityId,
                    requestContextResolver.resolve(),
                    requestContextResolver.resolveReason(arguments),
                    oldValues,
                    newValues));
        } catch (Exception exception) {
            log.error("Failed to publish audit event for {} {}", auditable.action(), auditable.entity(), exception);
        }

        return result;
    }

    private boolean shouldSkipLogging(Object result) {
        if (result instanceof org.springframework.http.ResponseEntity<?> responseEntity) {
            if (!responseEntity.getStatusCode().is2xxSuccessful()) {
                return true;
            }
            Object body = responseEntity.getBody();
            if (body instanceof com.cinema.dto.response.ApiResponse<?> apiResponse) {
                return !apiResponse.isSuccess();
            }
        }
        if (result instanceof com.cinema.dto.response.ApiResponse<?> apiResponse) {
            return !apiResponse.isSuccess();
        }
        return false;
    }

    private Map<String, Object> resolveArguments(String[] parameterNames, Object[] args) {
        Map<String, Object> arguments = new LinkedHashMap<>();
        if (parameterNames == null || args == null) {
            return arguments;
        }
        for (int index = 0; index < parameterNames.length; index++) {
            arguments.put(parameterNames[index], index < args.length ? args[index] : null);
        }
        return arguments;
    }

    private String resolveEntityId(Auditable auditable, Map<String, Object> arguments, Object result) {
        if (StringUtils.hasText(auditable.entityIdParam())) {
            Object value = arguments.get(auditable.entityIdParam());
            if (value != null) {
                return value.toString();
            }
        }
        return auditSnapshotService.extractEntityId(result);
    }

    private boolean shouldCaptureOldValues(Auditable auditable, String entityId) {
        return auditable.entityClass() != Void.class
                && StringUtils.hasText(entityId)
                && (auditable.action() == AuditAction.UPDATE || auditable.action() == AuditAction.DELETE);
    }

    private Map<String, Object> resolveNewValues(
            Auditable auditable,
            Map<String, Object> arguments,
            Object result,
            String entityId) {
        if (auditable.action() == AuditAction.DELETE) {
            return null;
        }

        if (auditable.entityClass() != Void.class && StringUtils.hasText(entityId)
                && (auditable.action() == AuditAction.CREATE || auditable.action() == AuditAction.UPDATE)) {
            Map<String, Object> entitySnapshot = auditSnapshotService.captureEntitySnapshot(auditable.entityClass(), entityId);
            if (entitySnapshot != null) {
                return entitySnapshot;
            }
        }

        if (auditable.captureResponseBody()) {
            Map<String, Object> responseSnapshot = auditSnapshotService.capturePayloadSnapshot(result);
            if (responseSnapshot != null) {
                return responseSnapshot;
            }
        }

        if (auditable.captureRequestPayload()) {
            return auditSnapshotService.capturePayloadSnapshot(arguments);
        }

        return null;
    }
}
