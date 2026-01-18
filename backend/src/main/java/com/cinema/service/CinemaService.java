package com.cinema.service;

import com.cinema.dto.response.CinemaListResponse;
import com.cinema.dto.response.CinemaScheduleResponse;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.City;
import com.cinema.model.Room;
import com.cinema.model.Showtime;
import com.cinema.model.Theater;
import com.cinema.repository.CityRepository;
import com.cinema.repository.ShowtimeRepository;
import com.cinema.repository.TheaterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CinemaService {

    private final TheaterRepository theaterRepository;
    private final ShowtimeRepository showtimeRepository;
    private final CityRepository cityRepository;

    /**
     * Lấy danh sách tất cả rạp, nhóm theo City entity
     */
    @Transactional(readOnly = true)
    public CinemaListResponse getAllCinemasGroupedByCity() {
        List<City> activeCities = cityRepository.findCitiesWithActiveTheaters();
        
        List<CinemaListResponse.CityGroup> cityGroups = activeCities.stream()
                .map(city -> {
                    List<Theater> activeTheaters = city.getTheaters().stream()
                            .filter(t -> t.getActive() != null && t.getActive())
                            .collect(Collectors.toList());
                    
                    return CinemaListResponse.CityGroup.builder()
                            .cityName(city.getName())
                            .cityCode(city.getCode())
                            .theaterCount(activeTheaters.size())
                            .theaters(activeTheaters.stream()
                                    .map(this::mapToTheaterSummary)
                                    .collect(Collectors.toList()))
                            .build();
                })
                .sorted(Comparator.comparing(CinemaListResponse.CityGroup::getCityName))
                .collect(Collectors.toList());
        
        int totalTheaters = cityGroups.stream()
                .mapToInt(CinemaListResponse.CityGroup::getTheaterCount)
                .sum();
        
        return CinemaListResponse.builder()
                .cities(cityGroups)
                .totalTheaters(totalTheaters)
                .build();
    }

    /**
     * Lấy danh sách rạp theo City ID
     */
    @Transactional(readOnly = true)
    public List<CinemaListResponse.TheaterSummary> getTheatersByCityId(Long cityId) {
        List<Theater> theaters = theaterRepository.findByCityIdAndActiveTrue(cityId);
        return theaters.stream()
                .map(this::mapToTheaterSummary)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách rạp theo City code
     */
    @Transactional(readOnly = true)
    public List<CinemaListResponse.TheaterSummary> getTheatersByCityCode(String cityCode) {
        List<Theater> theaters = theaterRepository.findByCityCodeAndActiveTrue(cityCode);
        return theaters.stream()
                .map(this::mapToTheaterSummary)
                .collect(Collectors.toList());
    }

    /**
     * Lấy chi tiết một rạp
     */
    @Transactional(readOnly = true)
    public CinemaListResponse.TheaterSummary getTheaterDetail(Long theaterId) {
        Theater theater = theaterRepository.findById(theaterId)
                .orElseThrow(() -> new ResourceNotFoundException("Theater", "id", theaterId));
        return mapToTheaterSummary(theater);
    }

    /**
     * Lấy lịch chiếu của rạp theo ngày, nhóm theo phim và format
     */
    @Transactional(readOnly = true)
    public CinemaScheduleResponse getCinemaSchedule(Long theaterId, LocalDate date) {
        Theater theater = theaterRepository.findById(theaterId)
                .orElseThrow(() -> new ResourceNotFoundException("Theater", "id", theaterId));
        
        List<Showtime> showtimes = showtimeRepository.findByTheaterAndDateWithDetails(theaterId, date);
        
        // Nhóm theo Movie
        Map<Long, List<Showtime>> showtimesByMovie = showtimes.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getMovie().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
        
        List<CinemaScheduleResponse.MovieSchedule> movieSchedules = showtimesByMovie.entrySet().stream()
                .map(entry -> buildMovieSchedule(entry.getValue()))
                .collect(Collectors.toList());
        
        return CinemaScheduleResponse.builder()
                .theaterId(theater.getId())
                .theaterName(theater.getName())
                .theaterAddress(theater.getAddress())
                .theaterPhone(theater.getHotline() != null ? theater.getHotline() : theater.getPhone())
                .theaterImageUrl(theater.getImageUrl())
                .scheduleDate(date)
                .movies(movieSchedules)
                .build();
    }

    /**
     * Build MovieSchedule từ list showtimes của một phim
     */
    private CinemaScheduleResponse.MovieSchedule buildMovieSchedule(List<Showtime> showtimes) {
        if (showtimes.isEmpty()) return null;
        
        Showtime firstShowtime = showtimes.get(0);
        var movie = firstShowtime.getMovie();
        
        // Nhóm theo RoomType (format)
        Map<Room.RoomType, List<Showtime>> showtimesByFormat = showtimes.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getRoom().getRoomType(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
        
        List<CinemaScheduleResponse.FormatSchedule> formats = showtimesByFormat.entrySet().stream()
                .map(entry -> buildFormatSchedule(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
        
        return CinemaScheduleResponse.MovieSchedule.builder()
                .movieId(movie.getId())
                .movieTitle(movie.getTitle())
                .posterUrl(movie.getPosterUrl())
                .duration(movie.getDuration())
                .ageRating(movie.getAgeRating())
                .genre(movie.getGenre())
                .rating(movie.getRating())
                .formats(formats)
                .build();
    }

    /**
     * Build FormatSchedule từ list showtimes của một format
     */
    private CinemaScheduleResponse.FormatSchedule buildFormatSchedule(Room.RoomType roomType, List<Showtime> showtimes) {
        List<CinemaScheduleResponse.ShowtimeSlot> slots = showtimes.stream()
                .map(this::mapToShowtimeSlot)
                .sorted(Comparator.comparing(CinemaScheduleResponse.ShowtimeSlot::getStartTime))
                .collect(Collectors.toList());
        
        return CinemaScheduleResponse.FormatSchedule.builder()
                .format(getFormatDisplay(roomType))
                .roomType(roomType.name())
                .showtimes(slots)
                .build();
    }

    /**
     * Map Showtime sang ShowtimeSlot
     */
    private CinemaScheduleResponse.ShowtimeSlot mapToShowtimeSlot(Showtime showtime) {
        return CinemaScheduleResponse.ShowtimeSlot.builder()
                .showtimeId(showtime.getId())
                .startTime(showtime.getStartTime())
                .endTime(showtime.getEndTime())
                .basePrice(showtime.getBasePrice())
                .status(showtime.getStatus().name())
                .roomName(showtime.getRoom().getName())
                .availableSeats(null) // TODO: Calculate available seats
                .build();
    }

    /**
     * Map Theater sang TheaterSummary
     */
    private CinemaListResponse.TheaterSummary mapToTheaterSummary(Theater theater) {
        return CinemaListResponse.TheaterSummary.builder()
                .id(theater.getId())
                .name(theater.getName())
                .address(theater.getAddress())
                .phone(theater.getHotline() != null ? theater.getHotline() : theater.getPhone())
                .imageUrl(theater.getImageUrl())
                .mapUrl(theater.getMapUrl())
                .totalRooms(theater.getRooms() != null ? theater.getRooms().size() : 0)
                .build();
    }

    /**
     * Convert tên thành phố sang code
     */
    private String convertToCityCode(String cityName) {
        if (cityName == null) return "";
        return cityName
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d")
                .replaceAll("[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]", "A")
                .replaceAll("[ÈÉẸẺẼÊỀẾỆỂỄ]", "E")
                .replaceAll("[ÌÍỊỈĨ]", "I")
                .replaceAll("[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]", "O")
                .replaceAll("[ÙÚỤỦŨƯỪỨỰỬỮ]", "U")
                .replaceAll("[ỲÝỴỶỸ]", "Y")
                .replaceAll("[Đ]", "D")
                .replaceAll("\\s+", "_");
    }

    /**
     * Lấy tên hiển thị cho format phòng chiếu
     */
    private String getFormatDisplay(Room.RoomType roomType) {
        return switch (roomType) {
            case STANDARD_2D -> "2D Phụ đề Việt";
            case STANDARD_3D -> "3D Phụ đề Việt";
            case IMAX -> "IMAX 2D";
            case IMAX_3D -> "IMAX 3D";
            case VIP_4DX -> "4DX 3D Phụ đề Việt | Rạp 4DX";
        };
    }
}
