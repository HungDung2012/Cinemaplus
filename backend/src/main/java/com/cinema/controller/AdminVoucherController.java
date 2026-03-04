package com.cinema.controller;

import com.cinema.dto.request.VoucherRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.PageResponse;
import com.cinema.dto.response.VoucherResponse;
import com.cinema.model.Voucher;
import com.cinema.service.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/vouchers")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGE_VOUCHERS')")
public class AdminVoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<VoucherResponse>>> getAllVouchers(
            @PageableDefault(size = 10) Pageable pageable) {
        PageResponse<Voucher> page = voucherService.getAllVouchers(pageable);

        // Convert Page<Voucher> to Page<VoucherResponse>
        PageResponse<VoucherResponse> response = PageResponse.<VoucherResponse>builder()
                .content(page.getContent().stream()
                        .map(VoucherResponse::fromVoucher)
                        .collect(Collectors.toList()))
                .pageNumber(page.getPageNumber())
                .pageSize(page.getPageSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherResponse>> getVoucherById(@PathVariable Long id) {
        Voucher voucher = voucherService.getVoucherById(id);
        return ResponseEntity.ok(ApiResponse.success(VoucherResponse.fromVoucher(voucher)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VoucherResponse>> createVoucher(@Valid @RequestBody VoucherRequest request) {
        Voucher voucher = voucherService.createVoucher(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(VoucherResponse.fromVoucher(voucher)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherResponse>> updateVoucher(@PathVariable Long id,
            @Valid @RequestBody VoucherRequest request) {
        Voucher voucher = voucherService.updateVoucher(id, request);
        return ResponseEntity.ok(ApiResponse.success(VoucherResponse.fromVoucher(voucher)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVoucher(@PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
