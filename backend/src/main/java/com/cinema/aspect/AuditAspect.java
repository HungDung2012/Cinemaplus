package com.cinema.aspect;

import com.cinema.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

/**
 * AOP Aspect that automatically logs admin controller actions to the audit log.
 * Intercepts all methods in Admin*Controller classes that perform write
 * operations.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogService auditLogService;
    private final jakarta.persistence.EntityManager entityManager;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @org.aspectj.lang.annotation.Around("execution(* com.cinema.controller.*.*(..)) && " +
            "(@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
            " @annotation(org.springframework.web.bind.annotation.PutMapping) || " +
            " @annotation(org.springframework.web.bind.annotation.DeleteMapping))")
    public Object logAdminAction(org.aspectj.lang.ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        // Ignore specific controllers that shouldn't be audited like this
        if (className.equals("AuthController") || className.equals("HealthController")
                || className.equals("TmdbController") || className.equals("PaymentController")) {
            return joinPoint.proceed();
        }

        String methodName = joinPoint.getSignature().getName();
        String entityName = deriveEntityName(className);
        String action = deriveAction(methodName, entityName);
        String entityId = extractEntityId(joinPoint.getArgs());
        String details = String.format("Thực hiện %s trên %s (Controller: %s)", action, entityName, className);

        Object oldValue = null;
        Object newValue = null;

        // 1. Try to fetch old value before execution
        if (entityId != null && (methodName.startsWith("update") || methodName.startsWith("edit")
                || methodName.startsWith("delete") || methodName.startsWith("remove"))) {
            oldValue = fetchOldEntityState(entityName, entityId);
        }

        // 2. Execute the actual controller method
        Object result;
        try {
            result = joinPoint.proceed();
        } catch (Throwable t) {
            // Log failure if needed, but we just rethrow here
            throw t;
        }

        // 3. Try to capture new value
        if (methodName.startsWith("delete") || methodName.startsWith("remove")) {
            // New value is null for deletions
            newValue = null;
        } else {
            newValue = extractNewValueFromResponse(result);
            if (newValue == null) {
                // Fallback to request payload if response doesn't contain data
                newValue = extractRequestPayload(joinPoint.getArgs());
            }
        }

        // 4. Fallback for oldValue on creation (it's null)
        if (oldValue == null && (methodName.startsWith("update") || methodName.startsWith("edit"))
                && newValue != null) {
            // If we couldn't fetch old value but it's an update, let's at least capture the
            // request payload as old value if available to show intent
            Object payload = extractRequestPayload(joinPoint.getArgs());
            if (payload != newValue)
                oldValue = payload;
        }

        // Clean up data for serialization (mask passwords, ignore lazy lists)
        Object sanitizedOld = sanitizeForLog(oldValue);
        Object sanitizedNew = sanitizeForLog(newValue);

        // Finally, log asynchronously or normally
        try {
            auditLogService.log(action, entityName, entityId, details, sanitizedOld, sanitizedNew);
        } catch (Exception e) {
            log.error("Failed to save audit log in aspect", e);
        }

        return result;
    }

    private String deriveEntityName(String className) {
        String name = className.replace("Admin", "").replace("Controller", "").replace("Public", "");
        if (name.isEmpty())
            return "System";
        return name;
    }

    private String deriveAction(String methodName, String entityName) {
        String upperEntity = entityName.toUpperCase();
        if (methodName.startsWith("create") || methodName.startsWith("add")) {
            return "CREATE_" + upperEntity;
        } else if (methodName.startsWith("update") || methodName.startsWith("edit")
                || methodName.startsWith("change")) {
            return "UPDATE_" + upperEntity;
        } else if (methodName.startsWith("delete") || methodName.startsWith("remove")) {
            return "DELETE_" + upperEntity;
        } else if (methodName.startsWith("bulk") || methodName.startsWith("batch")) {
            return "BATCH_" + upperEntity;
        } else {
            return methodName.toUpperCase() + "_" + upperEntity;
        }
    }

    private String extractEntityId(Object[] args) {
        if (args == null || args.length == 0)
            return null;
        for (Object arg : args) {
            if (arg instanceof Long || arg instanceof Integer || arg instanceof String) {
                // If it's a simple type, it might be the ID. Especially if it's the first or
                // second arg.
                // Spring usually resolves @PathVariable before @RequestBody
                return arg.toString();
            }
        }
        return null;
    }

    private Object extractNewValueFromResponse(Object result) {
        if (result instanceof org.springframework.http.ResponseEntity) {
            Object body = ((org.springframework.http.ResponseEntity<?>) result).getBody();
            if (body instanceof com.cinema.dto.response.ApiResponse) {
                return ((com.cinema.dto.response.ApiResponse<?>) body).getData();
            }
            return body;
        }
        return result;
    }

    private Object extractRequestPayload(Object[] args) {
        if (args == null || args.length == 0)
            return null;
        for (Object arg : args) {
            if (arg != null && arg.getClass().getName().contains("Request")) {
                return arg;
            }
            // If it's a model entity
            if (arg != null && arg.getClass().getName().contains("model")) {
                return arg;
            }
        }
        return null;
    }

    private Object fetchOldEntityState(String entityName, String entityId) {
        try {
            Class<?> entityClass = null;
            // Try standard model package
            try {
                entityClass = Class.forName("com.cinema.model." + entityName);
            } catch (ClassNotFoundException e) {
                // Specific mapped names
                if (entityName.equals("Price"))
                    entityClass = Class.forName("com.cinema.model.PriceHeader");
                else if (entityName.equals("Stats"))
                    return null; // No state
            }

            if (entityClass != null) {
                Long id = Long.parseLong(entityId);
                Object entity = entityManager.find(entityClass, id);
                if (entity != null) {
                    // Detach to avoid altering the session state during serialization extraction
                    entityManager.detach(entity);
                    return entity;
                }
            }
        } catch (Exception e) {
            log.trace("Could not fetch old entity state for {} id {}", entityName, entityId, e);
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Object sanitizeForLog(Object obj) {
        if (obj == null)
            return null;
        try {
            // Convert to Map to strip unwanted complex Hibernate proxies/lists
            String json = objectMapper.writeValueAsString(obj);
            java.util.Map<String, Object> map = objectMapper.readValue(json, java.util.Map.class);
            maskSensitive(map);
            return map;
        } catch (Exception e) {
            // If mapping fails, just return toString
            return obj.toString();
        }
    }

    @SuppressWarnings("unchecked")
    private void maskSensitive(java.util.Map<String, Object> map) {
        if (map == null)
            return;
        String[] sensitiveKeys = { "password", "token", "secret", "cvv", "cardNumber" };
        for (String key : map.keySet()) {
            for (String sKey : sensitiveKeys) {
                if (key.toLowerCase().contains(sKey)) {
                    map.put(key, "********");
                }
            }
            if (map.get(key) instanceof java.util.Map) {
                maskSensitive((java.util.Map<String, Object>) map.get(key));
            } else if (map.get(key) instanceof java.util.List) {
                java.util.List<?> list = (java.util.List<?>) map.get(key);
                for (Object item : list) {
                    if (item instanceof java.util.Map) {
                        maskSensitive((java.util.Map<String, Object>) item);
                    }
                }
            }
        }
    }
}
