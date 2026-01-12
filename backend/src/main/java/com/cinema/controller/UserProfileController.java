package com.cinema.controller;

import com.cinema.dto.request.ChangePasswordRequest;
import com.cinema.dto.request.CouponRedeemRequest;
import com.cinema.dto.request.UserProfileUpdateRequest;
import com.cinema.dto.request.VoucherRedeemRequest;
import com.cinema.dto.response.*;
import com.cinema.model.PointHistory;
import com.cinema.model.User;
import com.cinema.service.CouponService;
import com.cinema.service.RewardPointService;
import com.cinema.service.UserProfileService;
import com.cinema.service.VoucherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "API quản lý tài khoản cá nhân")
public class UserProfileController {

    private final UserProfileService userProfileService; 
    private final RewardPointService rewardPointService;
    private final VoucherService voucherService;
    private final CouponService couponService;

    // ==================== PROFILE ====================

    @GetMapping("/profile")
    @Operation(summary = "Lấy thông tin profile", description = "Lấy toàn bộ thông tin tài khoản của người dùng đang đăng nhập")
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal User user) {
        UserProfileResponse profile = userProfileService.getUserProfile(user.getId());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile-update")
    @Operation(summary = "Cập nhật profile", description = "Cập nhật thông tin cá nhân (họ tên, giới tính, ngày sinh, SĐT, địa chỉ, avatar)")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UserProfileUpdateRequest request
    ) {
        UserProfileResponse profile = userProfileService.updateUserProfile(user.getId(), request);
        return ResponseEntity.ok(profile);
    }

    @PostMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu", description = "Đổi mật khẩu tài khoản (cần nhập mật khẩu cũ)")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userProfileService.changePassword(user.getId(), request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }

    // ==================== REWARD POINTS ====================

    @GetMapping("/rewards")
    @Operation(summary = "Lấy thông tin điểm thưởng", description = "Lấy tổng quan điểm thưởng và membership level")
    public ResponseEntity<RewardPointsResponse> getRewardPoints(@AuthenticationPrincipal User user) {
        RewardPointsResponse rewards = rewardPointService.getRewardPoints(user.getId());
        return ResponseEntity.ok(rewards);
    }

    @GetMapping("/point-history")
    @Operation(summary = "Lấy lịch sử điểm", description = "Lấy lịch sử tích/đổi điểm với filter và phân trang")
    public ResponseEntity<Page<PointHistoryResponse>> getPointHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) PointHistory.TransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<PointHistoryResponse> history = rewardPointService.getPointHistory(
                user.getId(), type, startDate, endDate, pageable
        );
        return ResponseEntity.ok(history);
    }

    // ==================== VOUCHERS ====================

    @PostMapping("/redeem-voucher")
    @Operation(summary = "Đổi voucher", description = "Nhập mã voucher và PIN để đổi voucher về tài khoản")
    public ResponseEntity<VoucherResponse> redeemVoucher(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody VoucherRedeemRequest request
    ) {
        VoucherResponse voucher = voucherService.redeemVoucher(user.getId(), request);
        return ResponseEntity.ok(voucher);
    }

    @GetMapping("/vouchers")
    @Operation(summary = "Lấy danh sách voucher", description = "Lấy tất cả voucher của người dùng")
    public ResponseEntity<List<VoucherResponse>> getUserVouchers(@AuthenticationPrincipal User user) {
        List<VoucherResponse> vouchers = voucherService.getUserVouchers(user.getId());
        return ResponseEntity.ok(vouchers);
    }

    @GetMapping("/vouchers/available")
    @Operation(summary = "Lấy voucher khả dụng", description = "Lấy danh sách voucher có thể sử dụng")
    public ResponseEntity<List<VoucherResponse>> getAvailableVouchers(@AuthenticationPrincipal User user) {
        List<VoucherResponse> vouchers = voucherService.getAvailableVouchers(user.getId());
        return ResponseEntity.ok(vouchers);
    }

    @GetMapping("/vouchers/expiring")
    @Operation(summary = "Voucher sắp hết hạn", description = "Lấy danh sách voucher sắp hết hạn trong 7 ngày")
    public ResponseEntity<List<VoucherResponse>> getExpiringVouchers(@AuthenticationPrincipal User user) {
        List<VoucherResponse> vouchers = voucherService.getExpiringVouchers(user.getId());
        return ResponseEntity.ok(vouchers);
    }

    // ==================== COUPONS ====================

    @PostMapping("/redeem-coupon")
    @Operation(summary = "Đổi coupon", description = "Nhập mã coupon và PIN để đổi coupon về tài khoản")
    public ResponseEntity<CouponResponse> redeemCoupon(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CouponRedeemRequest request
    ) {
        CouponResponse coupon = couponService.redeemCoupon(user.getId(), request);
        return ResponseEntity.ok(coupon);
    }

    @GetMapping("/coupons")
    @Operation(summary = "Lấy danh sách coupon", description = "Lấy tất cả coupon của người dùng")
    public ResponseEntity<List<CouponResponse>> getUserCoupons(@AuthenticationPrincipal User user) {
        List<CouponResponse> coupons = couponService.getUserCoupons(user.getId());
        return ResponseEntity.ok(coupons);
    }

    @GetMapping("/coupons/available")
    @Operation(summary = "Lấy coupon khả dụng", description = "Lấy danh sách coupon có thể sử dụng")
    public ResponseEntity<List<CouponResponse>> getAvailableCoupons(@AuthenticationPrincipal User user) {
        List<CouponResponse> coupons = couponService.getAvailableCoupons(user.getId());
        return ResponseEntity.ok(coupons);
    }

    @GetMapping("/coupons/expiring")
    @Operation(summary = "Coupon sắp hết hạn", description = "Lấy danh sách coupon sắp hết hạn trong 24h")
    public ResponseEntity<List<CouponResponse>> getExpiringCoupons(@AuthenticationPrincipal User user) {
        List<CouponResponse> coupons = couponService.getExpiringCoupons(user.getId());
        return ResponseEntity.ok(coupons);
    }

    // ==================== TRANSACTIONS ====================

    @GetMapping("/transactions")
    @Operation(summary = "Lịch sử giao dịch", description = "Lấy lịch sử đặt vé với tìm kiếm và filter")
    public ResponseEntity<Page<TransactionHistoryResponse>> getTransactionHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<TransactionHistoryResponse> transactions = userProfileService.getTransactionHistory(
                user.getId(), search, startDate, endDate, pageable
        );
        return ResponseEntity.ok(transactions);
    }
}
