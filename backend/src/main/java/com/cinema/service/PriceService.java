package com.cinema.service;

import com.cinema.model.PriceConfig;
import com.cinema.model.Room;
import com.cinema.model.Seat;
import com.cinema.model.Showtime;
import com.cinema.repository.PriceConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PriceService {

    private final PriceConfigRepository priceConfigRepository;

    public BigDecimal calculatePrice(Showtime showtime, Seat seat) {
        Room room = showtime.getRoom();
        PriceConfig.DayType dayType = determineDayType(showtime.getShowDate());

        Optional<PriceConfig> config = priceConfigRepository.findByRoomTypeAndDayTypeAndSeatType(
                room.getRoomType(),
                dayType,
                seat.getSeatType());

        if (config.isPresent()) {
            return config.get().getBasePrice();
        }

        // Fallback logic if specific config is missing
        // 1. Base price from showtime
        BigDecimal finalPrice = showtime.getBasePrice();

        // 2. Adjust by Seat Type multiplier
        if (seat.getPriceMultiplier() != null) {
            finalPrice = finalPrice.multiply(seat.getPriceMultiplier());
        }

        return finalPrice;
    }

    private PriceConfig.DayType determineDayType(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY || day == DayOfWeek.FRIDAY) {
            // Treat Friday evening as weekend? For simplicity, Fri-Sun is Weekend
            return PriceConfig.DayType.WEEKEND;
        }
        return PriceConfig.DayType.WEEKDAY;
    }

    @Transactional
    public PriceConfig createOrUpdatePriceConfig(PriceConfig config) {
        Optional<PriceConfig> existing = priceConfigRepository.findByRoomTypeAndDayTypeAndSeatType(
                config.getRoomType(), config.getDayType(), config.getSeatType());

        if (existing.isPresent()) {
            PriceConfig update = existing.get();
            update.setBasePrice(config.getBasePrice());
            update.setActive(config.getActive());
            return priceConfigRepository.save(update);
        }

        return priceConfigRepository.save(config);
    }
}
