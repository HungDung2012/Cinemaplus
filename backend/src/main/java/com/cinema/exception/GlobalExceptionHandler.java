package com.cinema.exception;

import com.cinema.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler cho toàn bộ ứng dụng.
 * Xử lý và format các exception thành response thống nhất.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadRequestException(BadRequestException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<Object>> handleDuplicateResourceException(DuplicateResourceException ex) {
        log.warn("Duplicate resource: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage()));
    }
    
    /**
     * Xử lý exception khi ghế đã bị đặt bởi người khác.
     * Trả về thông tin chi tiết về các ghế bị conflict.
     */
    @ExceptionHandler(SeatAlreadyBookedException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleSeatAlreadyBookedException(
            SeatAlreadyBookedException ex) {
        log.warn("Seat already booked: {}", ex.getMessage());
        
        // Tạo response với thông tin chi tiết về ghế bị conflict
        Map<String, Object> details = new HashMap<>();
        details.put("bookedSeatIds", ex.getBookedSeatIds());
        details.put("bookedSeatLabels", ex.getBookedSeatLabels());
        
        ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .success(false)
                .message(ex.getMessage())
                .data(details)
                .build();
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }
    
    /**
     * Xử lý exception khi suất chiếu không khả dụng.
     */
    @ExceptionHandler(ShowtimeNotAvailableException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleShowtimeNotAvailableException(
            ShowtimeNotAvailableException ex) {
        log.warn("Showtime not available: {}", ex.getMessage());
        
        Map<String, Object> details = new HashMap<>();
        details.put("showtimeId", ex.getShowtimeId());
        details.put("reason", ex.getReason());
        
        ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .success(false)
                .message(ex.getMessage())
                .data(details)
                .build();
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    /**
     * Xử lý exception khi booking hết hạn giữ chỗ.
     */
    @ExceptionHandler(BookingExpiredException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleBookingExpiredException(
            BookingExpiredException ex) {
        log.warn("Booking expired: {}", ex.getMessage());
        
        Map<String, Object> details = new HashMap<>();
        details.put("bookingId", ex.getBookingId());
        details.put("bookingCode", ex.getBookingCode());
        
        ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .success(false)
                .message(ex.getMessage())
                .data(details)
                .build();
        
        return ResponseEntity.status(HttpStatus.GONE).body(response);
    }
    
    /**
     * Xử lý exception khi thanh toán thất bại.
     */
    @ExceptionHandler(PaymentFailedException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handlePaymentFailedException(
            PaymentFailedException ex) {
        log.error("Payment failed: {}", ex.getMessage());
        
        Map<String, Object> details = new HashMap<>();
        details.put("bookingId", ex.getBookingId());
        details.put("paymentMethod", ex.getPaymentMethod());
        details.put("failureReason", ex.getFailureReason());
        
        ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .success(false)
                .message(ex.getMessage())
                .data(details)
                .build();
        
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(response);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        log.warn("Validation failed: {}", errors);
        
        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message("Dữ liệu không hợp lệ")
                .data(errors)
                .build();
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    /**
     * Xử lý exception khi voucher không hợp lệ.
     */
    @ExceptionHandler(InvalidVoucherException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleInvalidVoucherException(
            InvalidVoucherException ex) {
        log.warn("Invalid voucher: {}", ex.getMessage());
        
        Map<String, Object> details = new HashMap<>();
        details.put("errorCode", ex.getErrorCode());
        
        ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .success(false)
                .message(ex.getMessage())
                .data(details)
                .build();
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    /**
     * Xử lý exception khi coupon không hợp lệ.
     */
    @ExceptionHandler(InvalidCouponException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleInvalidCouponException(
            InvalidCouponException ex) {
        log.warn("Invalid coupon: {}", ex.getMessage());
        
        Map<String, Object> details = new HashMap<>();
        details.put("errorCode", ex.getErrorCode());
        
        ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .success(false)
                .message(ex.getMessage())
                .data(details)
                .build();
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentialsException(BadCredentialsException ex) {
        log.warn("Bad credentials: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Email hoặc mật khẩu không chính xác"));
    }
    
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Object>> handleAuthenticationException(AuthenticationException ex) {
        log.warn("Authentication failed: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGlobalException(Exception ex) {
        log.error("Unexpected error occurred", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau."));
    }
}
