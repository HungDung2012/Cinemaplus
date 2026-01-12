package com.cinema.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO trả về lịch sử giao dịch của người dùng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionHistoryResponse {

    private Long bookingId;
    private String bookingCode;
    private LocalDateTime bookingTime;
    private String status;
    private String statusDisplay;

    // Thông tin phim
    private String movieTitle;
    private String moviePoster;

    // Thông tin suất chiếu
    private LocalDateTime showtimeStart;
    private String theaterName;
    private String roomName;

    // Thông tin ghế
    private List<String> seatNames;
    private Integer seatCount;

    // Thông tin đồ ăn
    private List<FoodItemResponse> foodItems;

    // Thông tin thanh toán
    private BigDecimal ticketPrice;
    private BigDecimal foodPrice;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String paymentStatus;

    // Điểm thưởng
    private Integer pointsEarned;
    private Integer pointsUsed;

    // Voucher/Coupon đã dùng
    private String voucherCode;
    private String couponCode;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FoodItemResponse {
        private String foodName;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal subtotal;
    }
}
