package com.cinema.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception khi không đủ điểm thưởng
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InsufficientPointsException extends RuntimeException {

    private final Integer currentPoints;
    private final Integer requiredPoints;

    public InsufficientPointsException(String message) {
        super(message);
        this.currentPoints = null;
        this.requiredPoints = null;
    }

    public InsufficientPointsException(Integer currentPoints, Integer requiredPoints) {
        super(String.format("Không đủ điểm. Điểm hiện tại: %d, cần: %d", currentPoints, requiredPoints));
        this.currentPoints = currentPoints;
        this.requiredPoints = requiredPoints;
    }

    public InsufficientPointsException(String message, Throwable cause) {
        super(message, cause);
        this.currentPoints = null;
        this.requiredPoints = null;
    }

    public Integer getCurrentPoints() {
        return currentPoints;
    }

    public Integer getRequiredPoints() {
        return requiredPoints;
    }
}
