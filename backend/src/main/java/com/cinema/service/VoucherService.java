package com.cinema.service;

import com.cinema.dto.request.VoucherRedeemRequest;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final UserRepository userRepository;

    /**
     * Nhập mã voucher và PIN để đổi voucher
     */
    @Transactional
    public VoucherResponse redeemVoucher(Long userId, VoucherRedeemRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ProfileUpdateException("Không tìm thấy người dùng"));

        // Tìm voucher
        Voucher voucher = voucherRepository.findByVoucherCode(request.getVoucherCode())
                .orElseThrow(() -> new InvalidVoucherException(
                        "Mã voucher không tồn tại",
                        InvalidVoucherException.VOUCHER_NOT_FOUND
                ));

        // Kiểm tra PIN
        if (!voucher.getPinCode().equals(request.getPinCode())) {
            throw new InvalidVoucherException(
                    "Mã PIN không đúng",
                    InvalidVoucherException.VOUCHER_INVALID_PIN
            );
        }

        // Kiểm tra trạng thái voucher
        if (voucher.getStatus() != Voucher.VoucherStatus.ACTIVE) {
            throw new InvalidVoucherException(
                    "Voucher đã được sử dụng hoặc đã hủy",
                    InvalidVoucherException.VOUCHER_ALREADY_USED
            );
        }

        // Kiểm tra hết hạn
        if (voucher.getExpiryDate() != null && voucher.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new InvalidVoucherException(
                    "Voucher đã hết hạn",
                    InvalidVoucherException.VOUCHER_EXPIRED
            );
        }

        // Kiểm tra user đã có voucher này chưa
        if (userVoucherRepository.existsByUserIdAndVoucherId(userId, voucher.getId())) {
            throw new InvalidVoucherException(
                    "Bạn đã đổi voucher này rồi",
                    InvalidVoucherException.VOUCHER_ALREADY_REDEEMED
            );
        }

        // Cập nhật voucher status thành USED (vì mỗi voucher chỉ được 1 người dùng)
        voucher.setStatus(Voucher.VoucherStatus.USED);
        voucherRepository.save(voucher);

        // Tạo UserVoucher
        UserVoucher userVoucher = UserVoucher.builder()
                .user(user)
                .voucher(voucher)
                .status(UserVoucher.UseStatus.AVAILABLE)
                .redeemedAt(LocalDateTime.now())
                .build();
        userVoucherRepository.save(userVoucher);

        log.info("User {} redeemed voucher {}", userId, voucher.getVoucherCode());

        return VoucherResponse.fromUserVoucher(userVoucher);
    }

    /**
     * Lấy danh sách voucher của user
     */
    @Transactional(readOnly = true)
    public List<VoucherResponse> getUserVouchers(Long userId) {
        List<UserVoucher> userVouchers = userVoucherRepository.findByUserIdOrderByRedeemedAtDesc(userId);
        return userVouchers.stream()
                .map(VoucherResponse::fromUserVoucher)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách voucher của user với phân trang
     */
    @Transactional(readOnly = true)
    public Page<VoucherResponse> getUserVouchers(Long userId, Pageable pageable) {
        Page<UserVoucher> userVouchers = userVoucherRepository.findByUserIdOrderByRedeemedAtDesc(userId, pageable);
        return userVouchers.map(VoucherResponse::fromUserVoucher);
    }

    /**
     * Lấy danh sách voucher có thể sử dụng của user
     */
    @Transactional(readOnly = true)
    public List<VoucherResponse> getAvailableVouchers(Long userId) {
        List<UserVoucher> availableVouchers = userVoucherRepository.findAvailableVouchersForUser(userId);
        return availableVouchers.stream()
                .map(VoucherResponse::fromUserVoucher)
                .collect(Collectors.toList());
    }

    /**
     * Sử dụng voucher cho booking
     */
    @Transactional
    public void useVoucher(Long userId, Long userVoucherId, Long bookingId) {
        UserVoucher userVoucher = userVoucherRepository.findById(userVoucherId)
                .orElseThrow(() -> new InvalidVoucherException("Không tìm thấy voucher"));

        // Validate
        if (!userVoucher.getUser().getId().equals(userId)) {
            throw new InvalidVoucherException("Voucher không thuộc về bạn");
        }

        if (userVoucher.getStatus() != UserVoucher.UseStatus.AVAILABLE) {
            throw new InvalidVoucherException(
                    "Voucher không còn khả dụng",
                    InvalidVoucherException.VOUCHER_ALREADY_USED
            );
        }

        if (!userVoucher.getVoucher().isValid()) {
            throw new InvalidVoucherException(
                    "Voucher đã hết hạn",
                    InvalidVoucherException.VOUCHER_EXPIRED
            );
        }

        // Update status
        userVoucher.setStatus(UserVoucher.UseStatus.USED);
        userVoucher.setUsedAt(LocalDateTime.now());
        userVoucher.setUsedForBookingId(bookingId);
        userVoucherRepository.save(userVoucher);

        log.info("User {} used voucher {} for booking {}", userId, userVoucher.getVoucher().getVoucherCode(), bookingId);
    }

    /**
     * Lấy giá trị voucher (để tính discount)
     */
    @Transactional(readOnly = true)
    public java.math.BigDecimal getVoucherValue(Long userVoucherId) {
        UserVoucher userVoucher = userVoucherRepository.findById(userVoucherId)
                .orElseThrow(() -> new InvalidVoucherException("Không tìm thấy voucher"));

        if (userVoucher.getStatus() != UserVoucher.UseStatus.AVAILABLE) {
            throw new InvalidVoucherException("Voucher không còn khả dụng");
        }

        return userVoucher.getVoucher().getValue();
    }

    /**
     * Lấy voucher sắp hết hạn của user (trong 7 ngày)
     */
    @Transactional(readOnly = true)
    public List<VoucherResponse> getExpiringVouchers(Long userId) {
        LocalDate futureDate = LocalDate.now().plusDays(7);
        List<UserVoucher> expiringVouchers = userVoucherRepository.findExpiringUserVouchers(userId, futureDate);
        return expiringVouchers.stream()
                .map(VoucherResponse::fromUserVoucher)
                .collect(Collectors.toList());
    }

    /**
     * Job để cập nhật status các voucher hết hạn
     */
    @Transactional
    public void updateExpiredVouchers() {
        // Cập nhật Voucher
        List<Voucher> expiredVouchers = voucherRepository.findExpiredActiveVouchers(LocalDate.now());
        for (Voucher voucher : expiredVouchers) {
            voucher.setStatus(Voucher.VoucherStatus.EXPIRED);
        }
        voucherRepository.saveAll(expiredVouchers);

        // Cập nhật UserVoucher
        List<UserVoucher> expiredUserVouchers = userVoucherRepository.findExpiredAvailableUserVouchers();
        for (UserVoucher uv : expiredUserVouchers) {
            uv.setStatus(UserVoucher.UseStatus.EXPIRED);
        }
        userVoucherRepository.saveAll(expiredUserVouchers);

        log.info("Updated {} expired vouchers, {} expired user vouchers", 
                expiredVouchers.size(), expiredUserVouchers.size());
    }
}
