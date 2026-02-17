package com.cinema.dto.response;

import com.cinema.model.UserVoucher;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserVoucherDto {
    private Long id;
    private Long voucherId;
    private String code;
    private String description;
    private UserVoucher.UseStatus status;
    private LocalDateTime redeemedAt;
    private LocalDateTime usedAt;
}
