package com.cinema.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.List;

/**
 * Exception được throw khi ghế đã bị đặt bởi người khác.
 * Xử lý tình huống concurrency khi nhiều người đặt cùng 1 ghế cùng lúc.
 */
@Getter
@ResponseStatus(HttpStatus.CONFLICT)
public class SeatAlreadyBookedException extends RuntimeException {
    
    // Danh sách ID các ghế đã bị đặt
    private final List<Long> bookedSeatIds;
    
    // Danh sách label các ghế đã bị đặt (VD: "A1", "B5")
    private final List<String> bookedSeatLabels;
    
    public SeatAlreadyBookedException(String message) {
        super(message);
        this.bookedSeatIds = List.of();
        this.bookedSeatLabels = List.of();
    }
    
    public SeatAlreadyBookedException(Long seatId) {
        super(String.format("Ghế với ID %d đã được đặt bởi người khác", seatId));
        this.bookedSeatIds = List.of(seatId);
        this.bookedSeatLabels = List.of();
    }
    
    public SeatAlreadyBookedException(Long seatId, String seatLabel) {
        super(String.format("Ghế %s đã được đặt bởi người khác", seatLabel));
        this.bookedSeatIds = List.of(seatId);
        this.bookedSeatLabels = List.of(seatLabel);
    }
    
    /**
     * Constructor cho trường hợp nhiều ghế bị đặt cùng lúc
     */
    public SeatAlreadyBookedException(List<Long> seatIds, List<String> seatLabels) {
        super(String.format("Các ghế %s đã được đặt bởi người khác. Vui lòng chọn ghế khác.", 
                String.join(", ", seatLabels)));
        this.bookedSeatIds = seatIds;
        this.bookedSeatLabels = seatLabels;
    }
}
