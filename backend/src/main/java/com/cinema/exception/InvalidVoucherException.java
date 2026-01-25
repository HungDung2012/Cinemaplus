package com.cinema.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import lombok.Getter;

@ResponseStatus(HttpStatus.BAD_REQUEST)
@Getter
public class InvalidVoucherException extends RuntimeException {

    private final String errorCode;

    public static final String VOUCHER_NOT_FOUND = "VOUCHER_NOT_FOUND";
    public static final String VOUCHER_EXPIRED = "VOUCHER_EXPIRED";
    public static final String VOUCHER_ALREADY_USED = "VOUCHER_ALREADY_USED";
    public static final String VOUCHER_INVALID = "VOUCHER_INVALID";

    public InvalidVoucherException(String message) {
        super(message);
        this.errorCode = VOUCHER_INVALID;
    }

    public InvalidVoucherException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
}
