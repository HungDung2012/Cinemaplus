package com.cinema.service;

import com.cinema.dto.request.PaymentRequest;
import com.cinema.dto.response.PaymentResponse;
import com.cinema.exception.BadRequestException;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.Booking;
import com.cinema.model.Payment;
import com.cinema.repository.BookingRepository;
import com.cinema.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    
    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", request.getBookingId()));
        
        // Check if booking already has a payment
        if (paymentRepository.findByBookingId(booking.getId()).isPresent()) {
            throw new BadRequestException("Payment already exists for this booking");
        }
        
        // Check booking status
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Can only pay for pending bookings");
        }
        
        Payment payment = Payment.builder()
                .amount(booking.getFinalAmount())
                .paymentMethod(request.getPaymentMethod())
                .status(Payment.PaymentStatus.PENDING)
                .booking(booking)
                .build();
        
        payment = paymentRepository.save(payment);
        
        return mapToResponse(payment);
    }
    
    @Transactional
    public PaymentResponse processPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
        
        if (payment.getStatus() != Payment.PaymentStatus.PENDING) {
            throw new BadRequestException("Payment is not in pending status");
        }
        
        // Simulate payment processing
        String transactionId = "TXN" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        

        payment.markAsCompleted(transactionId);
        
        // Update booking status
        Booking booking = payment.getBooking();
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        bookingRepository.save(booking);
        
        payment = paymentRepository.save(payment);
        
        return mapToResponse(payment);
    }
    
    public PaymentResponse getPaymentByBookingId(Long bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "bookingId", bookingId));
        return mapToResponse(payment);
    }
    
    private PaymentResponse mapToResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .transactionId(payment.getTransactionId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .paidAt(payment.getPaidAt())
                .bookingId(payment.getBooking().getId())
                .bookingCode(payment.getBooking().getBookingCode())
                .build();
    }
}
