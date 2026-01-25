package com.cinema.repository;

import com.cinema.model.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {
        Optional<Voucher> findByVoucherCode(String voucherCode);

        boolean existsByVoucherCode(String voucherCode);
}
