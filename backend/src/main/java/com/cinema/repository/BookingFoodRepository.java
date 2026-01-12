package com.cinema.repository;

import com.cinema.model.BookingFood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingFoodRepository extends JpaRepository<BookingFood, Long> {

    List<BookingFood> findByBookingId(Long bookingId);
}
