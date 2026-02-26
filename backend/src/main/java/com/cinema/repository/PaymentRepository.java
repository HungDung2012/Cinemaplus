package com.cinema.repository;

import com.cinema.model.Payment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByBookingId(Long bookingId);
    Optional<Payment> findByTransactionId(String transactionId);

    /**
     * Pessimistic Lock khi cập nhật trạng thái Payment.
     * Tránh Race Condition khi IPN webhook và returnUrl callback gọi về cùng lúc.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.id = :id")
    Optional<Payment> findByIdWithLock(@Param("id") Long id);

    /**
     * Tìm Payment theo bookingCode (thông qua Booking) + Pessimistic Lock.
     * Dùng khi xử lý IPN — cổng thanh toán trả về orderId = bookingCode.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p JOIN p.booking b WHERE b.bookingCode = :bookingCode")
    Optional<Payment> findByBookingCodeWithLock(@Param("bookingCode") String bookingCode);

    @Query("SELECT p FROM Payment p JOIN FETCH p.booking b WHERE b.bookingCode = :bookingCode")
    Optional<Payment> findByBookingCode(@Param("bookingCode") String bookingCode);
}
