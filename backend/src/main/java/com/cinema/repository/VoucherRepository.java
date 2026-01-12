package com.cinema.repository;

import com.cinema.model.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    /**
     * Tìm voucher theo mã code
     */
    Optional<Voucher> findByVoucherCode(String voucherCode);

    /**
     * Tìm voucher theo mã code và PIN để xác thực
     */
    @Query("SELECT v FROM Voucher v WHERE v.voucherCode = :code AND v.pinCode = :pin")
    Optional<Voucher> findByVoucherCodeAndPinCode(
            @Param("code") String voucherCode,
            @Param("pin") String pinCode
    );

    /**
     * Tìm voucher hợp lệ (chưa sử dụng, chưa hết hạn)
     */
    @Query("SELECT v FROM Voucher v WHERE v.voucherCode = :code " +
           "AND v.pinCode = :pin " +
           "AND v.status = 'ACTIVE' " +
           "AND (v.expiryDate IS NULL OR v.expiryDate >= :today)")
    Optional<Voucher> findValidVoucher(
            @Param("code") String voucherCode,
            @Param("pin") String pinCode,
            @Param("today") LocalDate today
    );

    /**
     * Lấy danh sách voucher sắp hết hạn
     */
    @Query("SELECT v FROM Voucher v WHERE v.status = 'ACTIVE' " +
           "AND v.expiryDate BETWEEN :today AND :futureDate")
    List<Voucher> findExpiringVouchers(
            @Param("today") LocalDate today,
            @Param("futureDate") LocalDate futureDate
    );

    /**
     * Kiểm tra voucher code đã tồn tại chưa
     */
    boolean existsByVoucherCode(String voucherCode);

    /**
     * Lấy tất cả voucher đã hết hạn nhưng vẫn ACTIVE (để cập nhật status)
     */
    @Query("SELECT v FROM Voucher v WHERE v.status = 'ACTIVE' " +
           "AND v.expiryDate < :today")
    List<Voucher> findExpiredActiveVouchers(@Param("today") LocalDate today);
}
