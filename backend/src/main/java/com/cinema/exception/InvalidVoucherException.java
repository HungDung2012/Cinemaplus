package com.cinema.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception khi voucher không hợp lệ hoặc không tìm thấy
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidVoucherException extends RuntimeException {

    private final String errorCode;

    public InvalidVoucherException(String message) {
        super(message);
        this.errorCode = "INVALID_VOUCHER";
    }

    public InvalidVoucherException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public InvalidVoucherException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "INVALID_VOUCHER";
    }

    public String getErrorCode() {
        return errorCode;
    }

    // Các error code cụ thể
    public static final String VOUCHER_NOT_FOUND = "VOUCHER_NOT_FOUND";
    public static final String VOUCHER_EXPIRED = "VOUCHER_EXPIRED";
    public static final String VOUCHER_ALREADY_USED = "VOUCHER_ALREADY_USED";
    public static final String VOUCHER_INVALID_PIN = "VOUCHER_INVALID_PIN";
    public static final String VOUCHER_ALREADY_REDEEMED = "VOUCHER_ALREADY_REDEEMED";
    public static final String VOUCHER_MIN_PURCHASE_NOT_MET = "VOUCHER_MIN_PURCHASE_NOT_MET";
}
