package com.cinema.service;

import com.cinema.model.*;
import com.cinema.repository.TicketPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PricingService {

    private final TicketPriceRepository ticketPriceRepository;

    public BigDecimal calculateTicketPrice(Showtime showtime, Seat seat) {
        BigDecimal basePrice = showtime.getBasePrice();

        // 1. Find matching TicketPrice rule
        // Rules are sorted by priority DESC
        List<TicketPrice> rules = ticketPriceRepository.findAllActiveRules();

        TicketPrice matchedRule = rules.stream()
                .filter(rule -> isRuleApplicable(rule, showtime))
                .findFirst()
                .orElse(null);

        if (matchedRule != null) {
            basePrice = matchedRule.getBasePrice();
            log.debug("Applied pricing rule: {} (Price: {})", matchedRule.getName(), basePrice);
        }

        // 2. Apply Seat Type Multiplier/Extra Fee
        BigDecimal finalPrice = basePrice;

        if (seat.getSeatTypeObject() != null) {
            SeatType type = seat.getSeatTypeObject();
            if (type.getPriceMultiplier() != null) {
                finalPrice = finalPrice.multiply(type.getPriceMultiplier());
            }
            if (type.getExtraFee() != null) {
                finalPrice = finalPrice.add(type.getExtraFee());
            }
        } else {
            // Fallback for legacy data (if any)
            // Use hardcoded logic if needed, or just keep basePrice
        }

        return finalPrice;
    }

    private boolean isRuleApplicable(TicketPrice rule, Showtime showtime) {
        // Check Room Type
        if (rule.getRoomType() != null && showtime.getRoom().getRoomType() != rule.getRoomType()) {
            return false;
        }

        // Check Day of Week
        LocalDate showDate = showtime.getShowDate();
        if (rule.getDaysOfWeek() != null && !rule.getDaysOfWeek().toUpperCase().contains("ALL")) {
            String dayOfWeek = showDate.getDayOfWeek().name(); // MONDAY, TUESDAY...
            if (!rule.getDaysOfWeek().contains(dayOfWeek)) {
                return false;
            }
        }

        // Check Time
        LocalTime showTime = showtime.getStartTime();
        if (rule.getStartTime() != null && showTime.isBefore(rule.getStartTime())) {
            return false;
        }
        if (rule.getEndTime() != null && showTime.isAfter(rule.getEndTime())) {
            return false;
        }

        return true;
    }
}
