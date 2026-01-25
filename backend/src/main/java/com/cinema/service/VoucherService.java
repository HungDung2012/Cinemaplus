package com.cinema.service;

import com.cinema.dto.request.VoucherRedeemRequest;
import com.cinema.dto.response.PageResponse;
import com.cinema.dto.response.VoucherResponse;
import com.cinema.exception.InvalidVoucherException;
import com.cinema.exception.ProfileUpdateException;
import com.cinema.model.User;
import com.cinema.model.UserVoucher;
import com.cinema.model.Voucher;
import com.cinema.repository.UserRepository;
import com.cinema.repository.UserVoucherRepository;
import com.cinema.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final UserRepository userRepository;

    public PageResponse<Voucher> getAllVouchers(Pageable pageable) {
        Page<Voucher> page = voucherRepository.findAll(pageable);
        return PageResponse.<Voucher>builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional
    public Voucher createVoucher(Voucher voucher) {
        if (voucher.getVoucherCode() == null || voucher.getVoucherCode().isEmpty()) {
            voucher.setVoucherCode(generateUniqueCode());
        }
        if (voucher.getPinCode() == null) {
            voucher.setPinCode(generatePin());
        }
        return voucherRepository.save(voucher);
    }

    @Transactional
    public void deleteVoucher(Long id) {
        voucherRepository.deleteById(id);
    }

    private String generateUniqueCode() {
        return "VOC" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generatePin() {
        return String.valueOf((int) (Math.random() * 9000) + 1000);
    }

    // ================= USER METHODS =================

    @Transactional
    public VoucherResponse redeemVoucher(Long userId, VoucherRedeemRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ProfileUpdateException("Không tìm thấy người dùng"));

        Voucher voucher = voucherRepository.findByVoucherCode(request.getVoucherCode())
                .orElseThrow(() -> new InvalidVoucherException("Mã voucher không tồn tại"));

        if (!voucher.getPinCode().equals(request.getPinCode())) {
            throw new InvalidVoucherException("Mã PIN không đúng");
        }

        if (voucher.getStatus() != Voucher.VoucherStatus.ACTIVE) {
            throw new InvalidVoucherException("Voucher không còn hiệu lực");
        }

        if (voucher.getExpiryDate() != null && voucher.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new InvalidVoucherException("Voucher đã hết hạn");
        }

        if (userVoucherRepository.existsByUserIdAndVoucherId(userId, voucher.getId())) {
            throw new InvalidVoucherException("Bạn đã đổi voucher này rồi");
        }

        // Voucher usually has fixed value, not usage limit like coupon?
        // Assuming voucher is unique per code or multi-use?
        // Based on CouponService provided, we treat it similarly.

        UserVoucher userVoucher = UserVoucher.builder()
                .user(user)
                .voucher(voucher)
                .status(UserVoucher.UseStatus.AVAILABLE)
                .redeemedAt(LocalDateTime.now())
                .build();

        userVoucherRepository.save(userVoucher);

        // If voucher is single-use globally (like a gift card), mark as USED?
        // But logic seems to imply "Redeem to Wallet" then "Use".
        // Let's assume multi-redeemable by different users unless unique.

        return VoucherResponse.fromUserVoucher(userVoucher);
    }

    @Transactional(readOnly = true)
    public List<VoucherResponse> getUserVouchers(Long userId) {
        return userVoucherRepository.findByUserIdOrderByRedeemedAtDesc(userId)
                .stream()
                .map(VoucherResponse::fromUserVoucher)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VoucherResponse> getAvailableVouchers(Long userId) {
        return userVoucherRepository.findAvailableVouchersForUser(userId, LocalDateTime.now())
                .stream()
                .map(VoucherResponse::fromUserVoucher)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VoucherResponse> getExpiringVouchers(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusDays(7);
        return userVoucherRepository.findExpiringUserVouchers(userId, now, future)
                .stream()
                .map(VoucherResponse::fromUserVoucher)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateExpiredVouchers() {
        log.info("Checking for expired vouchers...");
        LocalDateTime now = LocalDateTime.now();
        // Simple logic: update status of expired UserVouchers
        List<UserVoucher> expired = userVoucherRepository.findExpiredAvailableUserVouchers(now);
        for (UserVoucher uv : expired) {
            uv.setStatus(UserVoucher.UseStatus.EXPIRED);
        }
        userVoucherRepository.saveAll(expired);

        // Also update Voucher entity status if needed (e.g. if expiryDate global
        // passed)
        List<Voucher> expiredVouchers = voucherRepository.findAll().stream()
                .filter(v -> v.getStatus() == Voucher.VoucherStatus.ACTIVE
                        && v.getExpiryDate() != null
                        && v.getExpiryDate().isBefore(now))
                .collect(Collectors.toList());

        for (Voucher v : expiredVouchers) {
            v.setStatus(Voucher.VoucherStatus.EXPIRED);
        }
        voucherRepository.saveAll(expiredVouchers);
    }
}
