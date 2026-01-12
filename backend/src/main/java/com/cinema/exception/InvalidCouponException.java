package com.cinema.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception khi coupon không hợp lệ hoặc không tìm thấy
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidCouponException extends RuntimeException {

    private final String errorCode;

    public InvalidCouponException(String message) {
        super(message);
        this.errorCode = "INVALID_COUPON";
    }

    public InvalidCouponException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public InvalidCouponException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "INVALID_COUPON";
    }

    public String getErrorCode() {
        return errorCode;
    }

    // Các error code cụ thể
    public static final String COUPON_NOT_FOUND = "COUPON_NOT_FOUND";
    public static final String COUPON_EXPIRED = "COUPON_EXPIRED";
    public static final String COUPON_NOT_STARTED = "COUPON_NOT_STARTED";
    public static final String COUPON_ALREADY_USED = "COUPON_ALREADY_USED";
    public static final String COUPON_INVALID_PIN = "COUPON_INVALID_PIN";
    public static final String COUPON_ALREADY_REDEEMED = "COUPON_ALREADY_REDEEMED";
    public static final String COUPON_USAGE_LIMIT_REACHED = "COUPON_USAGE_LIMIT_REACHED";
    public static final String COUPON_MIN_PURCHASE_NOT_MET = "COUPON_MIN_PURCHASE_NOT_MET";
}
