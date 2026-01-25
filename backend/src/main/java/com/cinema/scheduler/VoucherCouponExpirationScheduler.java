package com.cinema.scheduler;

import com.cinema.service.CouponService;
import com.cinema.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler để tự động cập nhật trạng thái voucher và coupon hết hạn
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VoucherCouponExpirationScheduler {

    private final VoucherService voucherService;
    private final CouponService couponService;

    /**
     * Chạy mỗi ngày lúc 00:01 để cập nhật voucher hết hạn
     */
    @Scheduled(cron = "0 1 0 * * *")
    public void updateExpiredVouchers() {
        log.info("Running voucher expiration check...");
        try {
            voucherService.updateExpiredVouchers();
            log.info("Voucher expiration check completed.");
        } catch (Exception e) {
            log.error("Error updating expired vouchers: {}", e.getMessage(), e);
        }
    }

    /**
     * Chạy mỗi giờ để cập nhật coupon hết hạn (vì coupon có expiry time chính xác
     * đến giờ)
     */
    @Scheduled(cron = "0 1 * * * *")
    public void updateExpiredCoupons() {
        log.info("Running coupon expiration check...");
        try {
            couponService.updateExpiredCoupons();
            log.info("Coupon expiration check completed.");
        } catch (Exception e) {
            log.error("Error updating expired coupons: {}", e.getMessage(), e);
        }
    }
}
