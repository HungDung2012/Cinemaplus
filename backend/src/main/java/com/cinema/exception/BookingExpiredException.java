package com.cinema.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception được throw khi đặt vé hết hạn do không thanh toán kịp thời.
 * Booking có thời gian giữ chỗ (thường là 10-15 phút).
 */
@Getter
@ResponseStatus(HttpStatus.GONE)
public class BookingExpiredException extends RuntimeException {
    
    private final Long bookingId;
    private final String bookingCode;
    
    public BookingExpiredException(String message) {
        super(message);
        this.bookingId = null;
        this.bookingCode = null;
    }
    
    public BookingExpiredException(Long bookingId, String bookingCode) {
        super(String.format("Đặt vé #%s đã hết hạn. Vui lòng đặt vé lại.", bookingCode));
        this.bookingId = bookingId;
        this.bookingCode = bookingCode;
    }
}
