package com.cinema.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception được throw khi thanh toán thất bại.
 */
@Getter
@ResponseStatus(HttpStatus.PAYMENT_REQUIRED)
public class PaymentFailedException extends RuntimeException {
    
    private final Long bookingId;
    private final String paymentMethod;
    private final String failureReason;
    
    public PaymentFailedException(String message) {
        super(message);
        this.bookingId = null;
        this.paymentMethod = null;
        this.failureReason = message;
    }
    
    public PaymentFailedException(Long bookingId, String paymentMethod, String failureReason) {
        super(String.format("Thanh toán thất bại cho đơn đặt vé #%d bằng phương thức %s: %s", 
                bookingId, paymentMethod, failureReason));
        this.bookingId = bookingId;
        this.paymentMethod = paymentMethod;
        this.failureReason = failureReason;
    }
    
    /**
     * Factory method cho trường hợp hết thời gian thanh toán
     */
    public static PaymentFailedException timeout(Long bookingId) {
        return new PaymentFailedException(bookingId, null, "Hết thời gian thanh toán. Vui lòng đặt vé lại.");
    }
    
    /**
     * Factory method cho trường hợp giao dịch bị từ chối
     */
    public static PaymentFailedException declined(Long bookingId, String paymentMethod) {
        return new PaymentFailedException(bookingId, paymentMethod, "Giao dịch bị từ chối bởi ngân hàng/ví điện tử");
    }
}
