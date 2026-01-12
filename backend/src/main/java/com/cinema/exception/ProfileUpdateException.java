package com.cinema.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception khi cập nhật profile thất bại
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class ProfileUpdateException extends RuntimeException {

    public ProfileUpdateException(String message) {
        super(message);
    }

    public ProfileUpdateException(String message, Throwable cause) {
        super(message, cause);
    }
}
