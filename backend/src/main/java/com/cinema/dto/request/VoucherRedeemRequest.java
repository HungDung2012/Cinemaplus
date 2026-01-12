package com.cinema.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO để nhập mã voucher và PIN
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherRedeemRequest {

    @NotBlank(message = "Mã voucher không được để trống")
    private String voucherCode;

    @NotBlank(message = "Mã PIN không được để trống")
    private String pinCode;
}
