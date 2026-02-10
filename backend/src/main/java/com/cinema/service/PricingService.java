package com.cinema.service;

import com.cinema.model.*;
import com.cinema.repository.PriceHeaderRepository;
import com.cinema.repository.PriceLineRepository;
import com.cinema.repository.SurchargeRepository;
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

    private final PriceHeaderRepository priceHeaderRepository;
    private final PriceLineRepository priceLineRepository;
    private final SurchargeRepository surchargeRepository;
    private final com.cinema.repository.ShowtimeRepository showtimeRepository;
    private final com.cinema.repository.SeatRepository seatRepository;
    private final com.cinema.repository.UserRepository userRepository;

    /**
     * Calculate final ticket price based on Showtime, Seat, and User profile.
     */
    public BigDecimal calculateTicketPrice(Showtime showtime, Seat seat, User user) {
        // 1. Determine Factors
        PriceLine.CustomerType customerType = deriveCustomerType(user);
        PriceLine.DayType dayType = determineDayType(showtime.getShowDate());
        PriceLine.TimeSlot timeSlot = determineTimeSlot(showtime.getStartTime());
        Room.RoomType roomType = showtime.getRoom().getRoomType();

        // Movie Format? Assuming mapped from RoomType or Showtime Format string
        // For simplicity, we assume RoomType implies format (IMAX, 3D, etc.)

        log.debug("Calculating price for: Customer={}, Day={}, Time={}, Room={}",
                customerType, dayType, timeSlot, roomType);

        // 2. Find Base Price from Rate Card
        BigDecimal basePrice = findBasePrice(showtime.getShowDate(), customerType, dayType, timeSlot, roomType);

        // 3. Apply Surcharges
        BigDecimal surcharges = calculateSurcharges(seat, showtime);

        // 4. Final Total
        return basePrice.add(surcharges);
    }

    private BigDecimal findBasePrice(LocalDate date, PriceLine.CustomerType customerType,
            PriceLine.DayType dayType, PriceLine.TimeSlot timeSlot,
            Room.RoomType roomType) {
        // Find active header
        List<PriceHeader> headers = priceHeaderRepository.findActiveHeadersForDate(date);
        if (headers.isEmpty()) {
            log.warn("No active Price Header found for date {}. Using fallback price.", date);
            return new BigDecimal("50000"); // FALLBACK to avoid crash, but should calculate
        }

        PriceHeader header = headers.get(0); // Highest priority

        // Find matching line
        // Optimization: In real app, cache this or use a specific DB query
        return header.getPriceLines().stream()
                .filter(line -> line.getCustomerType() == customerType &&
                        line.getDayType() == dayType &&
                        line.getTimeSlot() == timeSlot &&
                        line.getRoomType() == roomType)
                .map(PriceLine::getPrice)
                .findFirst()
                .orElseGet(() -> {
                    log.warn("No Price Line found for criteria. Factors: {}/{}./{}/{}. Using fallback.",
                            customerType, dayType, timeSlot, roomType);
                    // Try to find a "Standard" fallback in the same header?
                    // For now, return a safe default
                    return new BigDecimal("50000");
                });
    }

    private BigDecimal calculateSurcharges(Seat seat, Showtime showtime) {
        BigDecimal totalSurcharge = BigDecimal.ZERO;
        List<Surcharge> surcharges = surchargeRepository.findByActiveTrue();

        for (Surcharge s : surcharges) {
            switch (s.getType()) {
                case SEAT_TYPE:
                    // Check if seat matches target
                    if (seat.getSeatTypeObject() != null &&
                            seat.getSeatTypeObject().getCode().equalsIgnoreCase(s.getTargetId())) {
                        totalSurcharge = totalSurcharge.add(s.getAmount());
                    }
                    break;
                case MOVIE_TYPE:
                    // Check if movie is blockbuster? (Need field in Movie)
                    // if (showtime.getMovie().isBlockbuster() &&
                    // "BLOCKBUSTER".equals(s.getTargetId())) ...
                    break;
                case DATE_TYPE:
                    // Holiday surcharge?
                    break;
                case FORMAT_3D:
                    // If showtime.format == 3D
                    if (showtime.getFormat() != null && showtime.getFormat().contains("3D")) {
                        totalSurcharge = totalSurcharge.add(s.getAmount());
                    }
                    break;
            }
        }
        return totalSurcharge;
    }

    public PriceLine.CustomerType deriveCustomerType(User user) {
        if (user == null)
            return PriceLine.CustomerType.ADULT;

        // Simple age logic
        if (user.getDateOfBirth() != null) {
            int age = java.time.Period.between(user.getDateOfBirth(), LocalDate.now()).getYears();
            if (age <= 22)
                return PriceLine.CustomerType.U22; // Or STUDENT
            if (age >= 60)
                return PriceLine.CustomerType.SENIOR;
        }

        // Member logic could be here
        if (user.getRole() == User.Role.USER) {
            return PriceLine.CustomerType.MEMBER;
        }

        return PriceLine.CustomerType.ADULT;
    }

    public PriceLine.DayType determineDayType(LocalDate date) {
        // Holiday logic (Hardcoded or DB)
        // Check DB Holidays...

        java.time.DayOfWeek dow = date.getDayOfWeek();
        if (dow == java.time.DayOfWeek.FRIDAY ||
                dow == java.time.DayOfWeek.SATURDAY ||
                dow == java.time.DayOfWeek.SUNDAY) {
            return PriceLine.DayType.WEEKEND;
        }
        return PriceLine.DayType.WEEKDAY;
    }

    public PriceLine.TimeSlot determineTimeSlot(LocalTime time) {
        if (time.isBefore(LocalTime.of(10, 0)))
            return PriceLine.TimeSlot.MORNING;
        if (time.isBefore(LocalTime.of(17, 0)))
            return PriceLine.TimeSlot.DAY;
        if (time.isBefore(LocalTime.of(22, 0)))
            return PriceLine.TimeSlot.EVENING;
        return PriceLine.TimeSlot.LATE;
    }

    public com.cinema.dto.response.CalculatedPriceResponse calculateBookingPrice(Long showtimeId, List<Long> seatIds,
            Long userId) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new RuntimeException("Showtime not found"));

        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        List<Seat> seats = seatRepository.findAllById(seatIds);
        BigDecimal totalPrice = BigDecimal.ZERO;
        List<com.cinema.dto.response.CalculatedPriceResponse.PriceDetail> details = new java.util.ArrayList<>();

        for (Seat seat : seats) {
            BigDecimal price = calculateTicketPrice(showtime, seat, user);
            totalPrice = totalPrice.add(price);

            PriceLine.CustomerType cType = deriveCustomerType(user);
            PriceLine.DayType dType = determineDayType(showtime.getShowDate());
            PriceLine.TimeSlot tSlot = determineTimeSlot(showtime.getStartTime());

            String desc = cType + " | " + dType + " | " + tSlot;
            if (seat.getSeatTypeObject() != null) {
                desc += " | " + seat.getSeatTypeObject().getName();
            }

            details.add(com.cinema.dto.response.CalculatedPriceResponse.PriceDetail.builder()
                    .seatCode(seat.getRowName() + seat.getSeatNumber())
                    .originalPrice(price)
                    .finalPrice(price)
                    .description(desc)
                    .build());
        }

        return com.cinema.dto.response.CalculatedPriceResponse.builder()
                .totalPrice(totalPrice)
                .details(details)
                .build();
    }
}
