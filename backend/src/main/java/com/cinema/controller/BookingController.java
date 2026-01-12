package com.cinema.controller;

import com.cinema.dto.request.BookingRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.BookingResponse;
import com.cinema.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller xử lý các API liên quan đến đặt vé xem phim.
 * 
 * Các endpoint:
 * - POST /api/bookings: Tạo đặt vé mới
 * - GET /api/bookings/my-bookings: Lấy danh sách đặt vé của user
 * - GET /api/bookings/{id}: Lấy thông tin đặt vé theo ID
 * - GET /api/bookings/code/{code}: Lấy thông tin đặt vé theo mã
 * - GET /api/bookings/showtime/{showtimeId}/booked-seats: Lấy danh sách ghế đã đặt
 * - POST /api/bookings/{id}/cancel: Hủy đặt vé
 * - POST /api/bookings/{id}/confirm: Xác nhận đặt vé (sau thanh toán)
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Slf4j
public class BookingController {
    
    private final BookingService bookingService;
    
    /**
     * Tạo đặt vé mới.
     * 
     * @param request Thông tin đặt vé (suất chiếu, ghế, đồ ăn...)
     * @return BookingResponse với thông tin đặt vé đã tạo
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody BookingRequest request) {
        log.info("API: Tạo booking mới cho suất chiếu {}", request.getShowtimeId());
        
        BookingResponse booking = bookingService.createBooking(request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đặt vé thành công! Vui lòng thanh toán trong 15 phút.", booking));
    }
    
    /**
     * Lấy danh sách đặt vé của user hiện tại.
     * Yêu cầu authentication.
     * 
     * @return Danh sách BookingResponse
     */
    @GetMapping("/my-bookings")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getUserBookings() {
        log.info("API: Lấy danh sách booking của user");
        
        List<BookingResponse> bookings = bookingService.getUserBookings();
        
        return ResponseEntity.ok(ApiResponse.success(bookings));
    }
    
    /**
     * Lấy thông tin đặt vé theo ID.
     * 
     * @param id ID của booking
     * @return BookingResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(@PathVariable Long id) {
        log.info("API: Lấy booking theo ID: {}", id);
        
        BookingResponse booking = bookingService.getBookingById(id);
        
        return ResponseEntity.ok(ApiResponse.success(booking));
    }
    
    /**
     * Lấy thông tin đặt vé theo mã booking.
     * 
     * @param bookingCode Mã booking (VD: BK1A2B3C4D)
     * @return BookingResponse
     */
    @GetMapping("/code/{bookingCode}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingByCode(
            @PathVariable String bookingCode) {
        log.info("API: Lấy booking theo code: {}", bookingCode);
        
        BookingResponse booking = bookingService.getBookingByCode(bookingCode);
        
        return ResponseEntity.ok(ApiResponse.success(booking));
    }
    
    /**
     * Lấy danh sách ID ghế đã được đặt cho suất chiếu.
     * Dùng để hiển thị sơ đồ ghế trên UI.
     * 
     * @param showtimeId ID của suất chiếu
     * @return Danh sách ID các ghế đã đặt
     */
    @GetMapping("/showtime/{showtimeId}/booked-seats")
    public ResponseEntity<ApiResponse<List<Long>>> getBookedSeats(@PathVariable Long showtimeId) {
        log.info("API: Lấy danh sách ghế đã đặt cho suất chiếu {}", showtimeId);
        
        List<Long> bookedSeatIds = bookingService.getBookedSeatIds(showtimeId);
        
        return ResponseEntity.ok(ApiResponse.success(bookedSeatIds));
    }
    
    /**
     * Hủy đặt vé.
     * Chỉ cho phép hủy booking của chính mình và chưa bắt đầu chiếu.
     * 
     * @param id ID của booking cần hủy
     * @return BookingResponse sau khi hủy
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(@PathVariable Long id) {
        log.info("API: Hủy booking ID: {}", id);
        
        BookingResponse booking = bookingService.cancelBooking(id);
        
        return ResponseEntity.ok(ApiResponse.success("Đã hủy đặt vé thành công", booking));
    }
    
    /**
     * Xác nhận đặt vé sau khi thanh toán.
     * Kiểm tra thời gian giữ chỗ trước khi xác nhận.
     * 
     * @param id ID của booking cần xác nhận
     * @return BookingResponse sau khi xác nhận
     */
    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<BookingResponse>> confirmBooking(@PathVariable Long id) {
        log.info("API: Xác nhận booking ID: {}", id);
        
        BookingResponse booking = bookingService.confirmBooking(id);
        
        return ResponseEntity.ok(ApiResponse.success("Đặt vé đã được xác nhận", booking));
    }
    
    /**
     * Đánh dấu booking hoàn thành.
     * Thường được gọi sau khi khách xem phim xong.
     * 
     * @param id ID của booking
     * @return BookingResponse sau khi cập nhật
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<BookingResponse>> completeBooking(@PathVariable Long id) {
        log.info("API: Hoàn thành booking ID: {}", id);
        
        BookingResponse booking = bookingService.completeBooking(id);
        
        return ResponseEntity.ok(ApiResponse.success("Booking đã hoàn thành", booking));
    }
}
