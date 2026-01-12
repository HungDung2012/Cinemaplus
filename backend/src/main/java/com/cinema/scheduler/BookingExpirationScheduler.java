package com.cinema.scheduler;

import com.cinema.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler tự động xử lý các booking hết hạn giữ chỗ.
 * 
 * <p>Quy trình:</p>
 * <ul>
 *   <li>Chạy mỗi phút để kiểm tra booking PENDING</li>
 *   <li>Các booking PENDING quá 15 phút sẽ bị expire</li>
 *   <li>Ghế của booking expired sẽ được giải phóng cho người khác đặt</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingExpirationScheduler {
    
    private final BookingService bookingService;
    
    /**
     * Chạy mỗi phút để expire các booking quá hạn giữ chỗ.
     * 
     * <p>Cron expression: "0 * * * * *" = chạy vào giây 0 của mỗi phút</p>
     */
    @Scheduled(cron = "0 * * * * *")
    public void expireOldBookings() {
        log.debug("Bắt đầu kiểm tra booking hết hạn giữ chỗ...");
        
        try {
            int expiredCount = bookingService.expirePendingBookings();
            
            if (expiredCount > 0) {
                log.info("Đã expire {} booking hết hạn giữ chỗ", expiredCount);
            }
        } catch (Exception e) {
            log.error("Lỗi khi expire booking: {}", e.getMessage(), e);
        }
    }
}
