package com.cinema.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception được throw khi suất chiếu không khả dụng để đặt vé.
 * Các trường hợp:
 * - Suất chiếu đã bị hủy
 * - Suất chiếu đã hết vé
 * - Suất chiếu đã qua hoặc sắp bắt đầu (< 30 phút)
 */
@Getter
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class ShowtimeNotAvailableException extends RuntimeException {
    
    private final Long showtimeId;
    private final String reason;
    
    public ShowtimeNotAvailableException(String message) {
        super(message);
        this.showtimeId = null;
        this.reason = message;
    }
    
    public ShowtimeNotAvailableException(Long showtimeId, String reason) {
        super(String.format("Suất chiếu ID %d không khả dụng: %s", showtimeId, reason));
        this.showtimeId = showtimeId;
        this.reason = reason;
    }
    
    /**
     * Factory method cho trường hợp suất chiếu đã hủy
     */
    public static ShowtimeNotAvailableException cancelled(Long showtimeId) {
        return new ShowtimeNotAvailableException(showtimeId, "Suất chiếu đã bị hủy");
    }
    
    /**
     * Factory method cho trường hợp suất chiếu đã hết vé
     */
    public static ShowtimeNotAvailableException soldOut(Long showtimeId) {
        return new ShowtimeNotAvailableException(showtimeId, "Suất chiếu đã hết vé");
    }
    
    /**
     * Factory method cho trường hợp suất chiếu đã qua
     */
    public static ShowtimeNotAvailableException expired(Long showtimeId) {
        return new ShowtimeNotAvailableException(showtimeId, "Suất chiếu đã qua thời gian chiếu");
    }
    
    /**
     * Factory method cho trường hợp quá gần giờ chiếu (< 30 phút)
     */
    public static ShowtimeNotAvailableException tooCloseToStartTime(Long showtimeId, long minutesRemaining) {
        return new ShowtimeNotAvailableException(showtimeId, 
                String.format("Chỉ còn %d phút đến giờ chiếu. Vui lòng chọn suất chiếu khác (yêu cầu tối thiểu 30 phút)", 
                        minutesRemaining));
    }
}
