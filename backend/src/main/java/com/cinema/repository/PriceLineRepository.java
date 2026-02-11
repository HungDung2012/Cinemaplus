package com.cinema.repository;

import com.cinema.model.PriceLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceLineRepository extends JpaRepository<PriceLine, Long> {
    List<PriceLine> findByPriceHeaderId(Long headerId);

    java.util.Optional<PriceLine> findByPriceHeaderIdAndCustomerTypeAndDayTypeAndTimeSlotAndRoomType(
            Long headerId,
            PriceLine.CustomerType customerType,
            PriceLine.DayType dayType,
            PriceLine.TimeSlot timeSlot,
            com.cinema.model.Room.RoomType roomType);
}
