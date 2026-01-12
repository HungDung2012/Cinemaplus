package com.cinema.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO cho việc tạo đặt vé mới.
 * Bao gồm thông tin suất chiếu, ghế ngồi và đồ ăn (optional).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequest {
    
    /**
     * ID của suất chiếu (bắt buộc)
     */
    @NotNull(message = "Vui lòng chọn suất chiếu")
    private Long showtimeId;
    
    /**
     * Danh sách ID các ghế được chọn (bắt buộc, ít nhất 1 ghế)
     */
    @NotEmpty(message = "Vui lòng chọn ít nhất 1 ghế")
    private List<Long> seatIds;
    
    /**
     * Danh sách đồ ăn kèm theo (tùy chọn)
     */
    private List<FoodItem> foodItems;
    
    /**
     * Mã giảm giá (tùy chọn)
     */
    private String discountCode;
    
    /**
     * Ghi chú của khách hàng
     */
    private String notes;
    
    /**
     * Inner class đại diện cho một món đồ ăn trong đơn đặt vé
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FoodItem {
        
        @NotNull(message = "ID đồ ăn không được để trống")
        private Long foodId;
        
        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 1, message = "Số lượng phải ít nhất là 1")
        private Integer quantity;
    }
}

