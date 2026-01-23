package com.cinema.service;

import com.cinema.dto.response.CinemaListResponse;
import com.cinema.dto.response.CinemaScheduleResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Deprecated wrapper kept for compatibility during refactor.
 * All cinema-related logic has been moved to {@link TheaterService}.
 */
@Service
@RequiredArgsConstructor
@Deprecated
public class CinemaService {

    private final TheaterService theaterService;

    public CinemaListResponse getAllCinemasGroupedByCity() {
        return theaterService.getAllCinemasGroupedByCity();
    }

    public List<CinemaListResponse.TheaterSummary> getTheatersByCityId(Long cityId) {
        return theaterService.getTheatersByCityId(cityId);
    }

    public List<CinemaListResponse.TheaterSummary> getTheatersByCityCode(String cityCode) {
        return theaterService.getTheatersByCityCode(cityCode);
    }

    public CinemaListResponse.TheaterSummary getTheaterDetail(Long theaterId) {
        return theaterService.getTheaterDetail(theaterId);
    }

    public CinemaScheduleResponse getCinemaSchedule(Long theaterId, java.time.LocalDate date) {
        return theaterService.getCinemaSchedule(theaterId, date);
    }
}
