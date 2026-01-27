package com.cinema.controller;

import com.cinema.dto.request.VoucherRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.PageResponse;
import com.cinema.model.Voucher;
import com.cinema.service.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/vouchers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Voucher>>> getAllVouchers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                voucherService.getAllVouchers(PageRequest.of(page, size))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Voucher>> createVoucher(@Valid @RequestBody VoucherRequest request) {
        return ResponseEntity.ok(ApiResponse.success(voucherService.createVoucher(request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVoucher(@PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
