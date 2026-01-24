package com.cinema.repository;

import com.cinema.model.PriceConfig;
import com.cinema.model.Room;
import com.cinema.model.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PriceConfigRepository extends JpaRepository<PriceConfig, Long> {

    Optional<PriceConfig> findByRoomTypeAndDayTypeAndSeatType(
            Room.RoomType roomType,
            PriceConfig.DayType dayType,
            Seat.SeatType seatType);
}
