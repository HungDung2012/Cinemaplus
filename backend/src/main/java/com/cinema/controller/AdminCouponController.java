package com.cinema.controller;

import com.cinema.dto.request.CouponRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.CouponResponse;
import com.cinema.dto.response.PageResponse;
import com.cinema.model.Coupon;
import com.cinema.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
public class AdminCouponController {

    private final CouponService couponService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CouponResponse>>> getAllCoupons(
            @PageableDefault(size = 10) Pageable pageable) {
        Page<Coupon> page = couponService.getAllCoupons(pageable);

        PageResponse<CouponResponse> response = PageResponse.<CouponResponse>builder()
                .content(page.getContent().stream()
                        .map(CouponResponse::fromCoupon)
                        .collect(Collectors.toList()))
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CouponResponse>> getCouponById(@PathVariable Long id) {
        Coupon coupon = couponService.getCouponById(id);
        return ResponseEntity.ok(ApiResponse.success(CouponResponse.fromCoupon(coupon)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CouponResponse>> createCoupon(@Valid @RequestBody CouponRequest request) {
        Coupon coupon = couponService.createCoupon(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(CouponResponse.fromCoupon(coupon)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CouponResponse>> updateCoupon(@PathVariable Long id,
            @Valid @RequestBody CouponRequest request) {
        Coupon coupon = couponService.updateCoupon(id, request);
        return ResponseEntity.ok(ApiResponse.success(CouponResponse.fromCoupon(coupon)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
