package com.cinema.dto.response;

import com.cinema.model.Voucher;
import com.cinema.model.UserVoucher;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO trả về thông tin voucher của người dùng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherResponse {

    private Long id;
    private Long userVoucherId;
    private String voucherCode;
    private BigDecimal value;
    private String description;
    private LocalDateTime expiryDate;
    private BigDecimal minPurchaseAmount;

    // Trạng thái
    private Voucher.VoucherStatus voucherStatus;
    private UserVoucher.UseStatus useStatus;
    private String statusDisplay;

    // Thông tin sử dụng
    private LocalDateTime redeemedAt;
    private LocalDateTime usedAt;
    private Long usedForBookingId;

    // Helper fields
    private Boolean isExpired;
    private Boolean isUsable;
    private Integer daysUntilExpiry;

    /**
     * Factory method để tạo từ UserVoucher entity
     */
    public static VoucherResponse fromUserVoucher(UserVoucher userVoucher) {
        Voucher voucher = userVoucher.getVoucher();
        boolean isExpired = voucher.getExpiryDate() != null && 
                           voucher.getExpiryDate().isBefore(LocalDateTime.now());
        boolean isUsable = userVoucher.getStatus() == UserVoucher.UseStatus.AVAILABLE && 
                          voucher.isValid();

        Integer daysUntilExpiry = null;
        if (voucher.getExpiryDate() != null) {
            daysUntilExpiry = (int) java.time.temporal.ChronoUnit.DAYS.between(
                LocalDateTime.now(), voucher.getExpiryDate()
            );
        }

        return VoucherResponse.builder()
                .id(voucher.getId())
                .userVoucherId(userVoucher.getId())
                .voucherCode(maskCode(voucher.getVoucherCode()))
                .value(voucher.getValue())
                .description(voucher.getDescription())
                .expiryDate(voucher.getExpiryDate())
                .minPurchaseAmount(voucher.getMinPurchaseAmount())
                .voucherStatus(voucher.getStatus())
                .useStatus(userVoucher.getStatus())
                .statusDisplay(getStatusDisplay(userVoucher.getStatus()))
                .redeemedAt(userVoucher.getRedeemedAt())
                .usedAt(userVoucher.getUsedAt())
                .usedForBookingId(userVoucher.getUsedForBookingId())
                .isExpired(isExpired)
                .isUsable(isUsable)
                .daysUntilExpiry(daysUntilExpiry)
                .build();
    }

    /**
     * Mask voucher code để bảo mật (chỉ hiện 4 ký tự đầu và cuối)
     */
    private static String maskCode(String code) {
        if (code == null || code.length() <= 8) {
            return code;
        }
        return code.substring(0, 4) + "****" + code.substring(code.length() - 4);
    }

    private static String getStatusDisplay(UserVoucher.UseStatus status) {
        return switch (status) {
            case AVAILABLE -> "Có thể sử dụng";
            case USED -> "Đã sử dụng";
            case EXPIRED -> "Đã hết hạn";
        };
    }
}
