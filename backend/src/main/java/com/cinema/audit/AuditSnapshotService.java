package com.cinema.audit;

import com.cinema.dto.response.ApiResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.core.io.InputStreamSource;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.util.ClassUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditSnapshotService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };
    private static final int MAX_DEPTH = 6;

    private final ObjectMapper objectMapper;

    @PersistenceContext
    private EntityManager entityManager;

    public Map<String, Object> captureEntitySnapshot(Class<?> entityClass, String entityId) {
        if (entityClass == null || entityClass == Void.class || entityId == null || entityId.isBlank()) {
            return null;
        }

        try {
            Object identifier = convertIdentifier(entityClass, entityId);
            Object entity = entityManager.find(entityClass, identifier);
            if (entity == null) {
                return null;
            }
            return normalizeToMap(captureValue(entity, 0));
        } catch (Exception exception) {
            log.debug("Unable to capture audit snapshot for entity {}#{}", entityClass.getSimpleName(), entityId, exception);
            return null;
        }
    }

    public Map<String, Object> capturePayloadSnapshot(Object payload) {
        return normalizeToMap(captureValue(payload, 0));
    }

    public String extractEntityId(Object payload) {
        Object unwrapped = unwrapPayload(payload);
        if (unwrapped == null) {
            return null;
        }
        if (unwrapped instanceof Number || unwrapped instanceof CharSequence || unwrapped instanceof UUID) {
            return unwrapped.toString();
        }
        if (unwrapped instanceof Map<?, ?> map) {
            Object id = map.get("id");
            if (id != null) {
                return id.toString();
            }
            Object entityId = map.get("entityId");
            return entityId != null ? entityId.toString() : null;
        }
        try {
            Field idField = findField(unwrapped.getClass(), "id");
            if (idField != null) {
                idField.setAccessible(true);
                Object id = idField.get(unwrapped);
                return id != null ? id.toString() : null;
            }
        } catch (IllegalAccessException ignored) {
            return null;
        }
        return null;
    }

    public Object unwrapPayload(Object payload) {
        if (payload == null) {
            return null;
        }
        if (payload instanceof org.springframework.http.ResponseEntity<?> responseEntity) {
            return unwrapPayload(responseEntity.getBody());
        }
        if (payload instanceof ApiResponse<?> apiResponse) {
            return unwrapPayload(apiResponse.getData());
        }
        return payload;
    }

    private Object captureValue(Object value, int depth) {
        if (value == null || depth > MAX_DEPTH) {
            return null;
        }

        Object unwrapped = unwrapPayload(value);
        if (unwrapped == null || shouldSkip(unwrapped)) {
            return null;
        }

        if (isSimpleValue(unwrapped)) {
            return unwrapped;
        }

        if (unwrapped instanceof Map<?, ?> map) {
            Map<String, Object> normalized = new LinkedHashMap<>();
            map.forEach((key, nestedValue) -> {
                Object captured = captureValue(nestedValue, depth + 1);
                if (captured != null) {
                    normalized.put(String.valueOf(key), captured);
                }
            });
            maskSensitive(normalized);
            return normalized;
        }

        if (unwrapped instanceof Collection<?> collection) {
            List<Object> items = new ArrayList<>();
            for (Object item : collection) {
                Object captured = captureValue(item, depth + 1);
                if (captured != null) {
                    items.add(captured);
                }
            }
            return items;
        }

        if (unwrapped.getClass().isArray()) {
            int length = Array.getLength(unwrapped);
            List<Object> items = new ArrayList<>(length);
            for (int index = 0; index < length; index++) {
                Object captured = captureValue(Array.get(unwrapped, index), depth + 1);
                if (captured != null) {
                    items.add(captured);
                }
            }
            return items;
        }

        if (isEntity(unwrapped)) {
            return captureEntity(unwrapped, depth + 1);
        }

        try {
            Map<String, Object> converted = objectMapper.convertValue(unwrapped, MAP_TYPE);
            Map<String, Object> normalized = new LinkedHashMap<>();
            converted.forEach((key, nestedValue) -> {
                Object captured = captureValue(nestedValue, depth + 1);
                if (captured != null) {
                    normalized.put(key, captured);
                }
            });
            maskSensitive(normalized);
            return normalized;
        } catch (IllegalArgumentException exception) {
            return unwrapped.toString();
        }
    }

    private Map<String, Object> captureEntity(Object entity, int depth) {
        Object unproxied = Hibernate.unproxy(entity);
        Class<?> entityClass = ClassUtils.getUserClass(Hibernate.getClass(unproxied));
        Map<String, Object> snapshot = new LinkedHashMap<>();

        for (Field field : getAllFields(entityClass)) {
            if (Modifier.isStatic(field.getModifiers()) || field.isSynthetic()) {
                continue;
            }
            if (field.getName().equals("serialVersionUID")) {
                continue;
            }

            field.setAccessible(true);
            try {
                if (isMultiValuedAssociation(field)) {
                    continue;
                }

                Object fieldValue = field.get(unproxied);
                if (fieldValue == null) {
                    snapshot.put(field.getName(), null);
                    continue;
                }

                if (isToOneAssociation(field)) {
                    Object associatedId = entityManager.getEntityManagerFactory()
                            .getPersistenceUnitUtil()
                            .getIdentifier(fieldValue);
                    snapshot.put(field.getName() + "Id", associatedId);
                    continue;
                }

                Object captured = captureValue(fieldValue, depth + 1);
                if (captured != null || fieldValue == null) {
                    snapshot.put(field.getName(), captured);
                }
            } catch (IllegalAccessException exception) {
                log.debug("Unable to read field {} from {}", field.getName(), entityClass.getSimpleName(), exception);
            }
        }

        maskSensitive(snapshot);
        return snapshot;
    }

    private Map<String, Object> normalizeToMap(Object captured) {
        if (captured == null) {
            return null;
        }
        if (captured instanceof Map<?, ?> map) {
            Map<String, Object> normalized = new LinkedHashMap<>();
            map.forEach((key, value) -> normalized.put(String.valueOf(key), value));
            return normalized;
        }
        Map<String, Object> wrapper = new LinkedHashMap<>();
        wrapper.put("value", captured);
        return wrapper;
    }

    private Object convertIdentifier(Class<?> entityClass, String rawValue) {
        Class<?> identifierType = entityManager.getMetamodel()
                .entity(entityClass)
                .getIdType()
                .getJavaType();

        if (Long.class.equals(identifierType) || long.class.equals(identifierType)) {
            return Long.valueOf(rawValue);
        }
        if (Integer.class.equals(identifierType) || int.class.equals(identifierType)) {
            return Integer.valueOf(rawValue);
        }
        if (UUID.class.equals(identifierType)) {
            return UUID.fromString(rawValue);
        }
        return rawValue;
    }

    private boolean isEntity(Object value) {
        return value != null && ClassUtils.getUserClass(value).isAnnotationPresent(Entity.class);
    }

    private boolean isSimpleValue(Object value) {
        return value instanceof String
                || value instanceof Number
                || value instanceof Boolean
                || value instanceof Enum<?>
                || value instanceof UUID
                || value instanceof BigDecimal
                || value instanceof LocalDate
                || value instanceof LocalDateTime
                || value instanceof LocalTime
                || value instanceof OffsetDateTime
                || value instanceof ZonedDateTime;
    }

    private boolean shouldSkip(Object value) {
        return value instanceof jakarta.servlet.ServletRequest
                || value instanceof jakarta.servlet.ServletResponse
                || value instanceof Authentication
                || value instanceof MultipartFile
                || value instanceof InputStream
                || value instanceof InputStreamSource
                || value instanceof org.springframework.validation.BindingResult;
    }

    private boolean isToOneAssociation(Field field) {
        return field.isAnnotationPresent(ManyToOne.class) || field.isAnnotationPresent(OneToOne.class);
    }

    private boolean isMultiValuedAssociation(Field field) {
        return field.isAnnotationPresent(OneToMany.class)
                || field.isAnnotationPresent(ManyToMany.class)
                || Collection.class.isAssignableFrom(field.getType());
    }

    private List<Field> getAllFields(Class<?> type) {
        List<Field> fields = new ArrayList<>();
        Class<?> current = type;
        while (current != null && !Object.class.equals(current)) {
            for (Field field : current.getDeclaredFields()) {
                fields.add(field);
            }
            current = current.getSuperclass();
        }
        return fields;
    }

    private Field findField(Class<?> type, String fieldName) {
        Class<?> current = type;
        while (current != null && !Object.class.equals(current)) {
            try {
                return current.getDeclaredField(fieldName);
            } catch (NoSuchFieldException ignored) {
                current = current.getSuperclass();
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private void maskSensitive(Map<String, Object> target) {
        if (target == null) {
            return;
        }

        target.replaceAll((key, value) -> {
            if (isSensitiveKey(key)) {
                return value == null ? null : "********";
            }
            if (value instanceof Map<?, ?> nestedMap) {
                maskSensitive((Map<String, Object>) nestedMap);
            } else if (value instanceof List<?> list) {
                list.stream()
                        .filter(Objects::nonNull)
                        .filter(Map.class::isInstance)
                        .map(Map.class::cast)
                        .forEach(item -> maskSensitive((Map<String, Object>) item));
            }
            return value;
        });
    }

    private boolean isSensitiveKey(String key) {
        String normalized = key == null ? "" : key.toLowerCase();
        return normalized.contains("password")
                || normalized.contains("token")
                || normalized.contains("secret")
                || normalized.contains("pin")
                || normalized.contains("cvv")
                || normalized.contains("cardnumber");
    }
}
