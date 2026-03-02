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
 * Intercepts all methods in Admin*Controller classes that perform write operations.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogService auditLogService;

    /**
     * Intercept all POST/PUT/DELETE methods in admin controllers.
     * Method naming convention: create*, update*, delete*, bulk*, batch*
     */
    @AfterReturning(
        pointcut = "execution(* com.cinema.controller.Admin*.*(..)) && " +
                   "(@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
                   " @annotation(org.springframework.web.bind.annotation.PutMapping) || " +
                   " @annotation(org.springframework.web.bind.annotation.DeleteMapping))",
        returning = "result"
    )
    public void logAdminAction(JoinPoint joinPoint, Object result) {
        try {
            String methodName = joinPoint.getSignature().getName();
            String className = joinPoint.getTarget().getClass().getSimpleName();
            
            // Derive entity name from controller class name (e.g., AdminMovieController -> Movie)
            String entityName = className
                    .replace("Admin", "")
                    .replace("Controller", "");
            
            // Derive action from method name
            String action = deriveAction(methodName, entityName);
            
            // Try to extract entity ID from arguments
            String entityId = extractEntityId(joinPoint.getArgs());
            
            // Build details string
            String details = String.format("%s.%s() called", className, methodName);
            
            auditLogService.log(action, entityName, entityId, details);
            
        } catch (Exception e) {
            log.error("Error in audit aspect", e);
        }
    }

    private String deriveAction(String methodName, String entityName) {
        String upperEntity = entityName.toUpperCase();
        if (methodName.startsWith("create") || methodName.startsWith("add")) {
            return "CREATE_" + upperEntity;
        } else if (methodName.startsWith("update") || methodName.startsWith("edit") || methodName.startsWith("change")) {
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
        if (args == null || args.length == 0) return null;
        for (Object arg : args) {
            if (arg instanceof Long || arg instanceof Integer) {
                return arg.toString();
            }
        }
        return null;
    }
}
