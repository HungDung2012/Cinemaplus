package com.cinema.dto.response;

import com.cinema.model.Voucher.VoucherStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class VoucherResponse {
    private Long id;
    private String voucherCode;
    private String pinCode;
    private BigDecimal value;
    private String description;
    private VoucherStatus status;
    private LocalDateTime expiryDate;
    private BigDecimal minPurchaseAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VoucherResponse fromVoucher(com.cinema.model.Voucher voucher) {
        return VoucherResponse.builder()
                .id(voucher.getId())
                .voucherCode(voucher.getVoucherCode())
                .pinCode(voucher.getPinCode())
                .value(voucher.getValue())
                .description(voucher.getDescription())
                .status(voucher.getStatus())
                .expiryDate(voucher.getExpiryDate())
                .minPurchaseAmount(voucher.getMinPurchaseAmount())
                .createdAt(voucher.getCreatedAt())
                .updatedAt(voucher.getUpdatedAt())
                .build();
    }

    public static VoucherResponse fromUserVoucher(com.cinema.model.UserVoucher userVoucher) {
        com.cinema.model.Voucher voucher = userVoucher.getVoucher();
        return VoucherResponse.builder()
                .id(voucher.getId())
                .voucherCode(voucher.getVoucherCode())
                .pinCode(voucher.getPinCode()) // Consider hiding PIN for user view? Existing code implies it's
                                               // returned.
                .value(voucher.getValue())
                .description(voucher.getDescription())
                .status(voucher.getStatus()) // This is Voucher status, maybe UserVoucher status is needed?
                .expiryDate(voucher.getExpiryDate())
                .minPurchaseAmount(voucher.getMinPurchaseAmount())
                .createdAt(voucher.getCreatedAt())
                .updatedAt(voucher.getUpdatedAt())
                .build();
    }
}
