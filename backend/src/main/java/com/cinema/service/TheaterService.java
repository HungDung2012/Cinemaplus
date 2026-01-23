package com.cinema.service;

import com.cinema.dto.response.CinemaListResponse;
import com.cinema.dto.response.CinemaScheduleResponse;
import com.cinema.dto.response.TheaterResponse;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.City;
import com.cinema.model.Region;
import com.cinema.model.Room;
import com.cinema.model.Showtime;
import com.cinema.model.Theater;
import com.cinema.repository.CityRepository;
import com.cinema.repository.ShowtimeRepository;
import com.cinema.repository.TheaterRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TheaterService {

    private final TheaterRepository theaterRepository;
    private final ModelMapper modelMapper;
    private final ShowtimeRepository showtimeRepository;
    private final CityRepository cityRepository;

    // Existing theater APIs
    public List<TheaterResponse> getAllTheaters() {
    return theaterRepository.findByActiveTrue().stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
    }

    public List<TheaterResponse> getTheatersByCity(Long cityId) {
    return theaterRepository.findByCityIdAndActiveTrue(cityId).stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
    }

    public List<TheaterResponse> getTheatersByCityCode(String cityCode) {
    return theaterRepository.findByCityCodeAndActiveTrue(cityCode).stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
    }

    public List<TheaterResponse> getTheatersByRegion(Long regionId) {
    return theaterRepository.findByRegionIdAndActiveTrue(regionId).stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
    }

    public List<TheaterResponse> getTheatersByRegionCode(String regionCode) {
    return theaterRepository.findByRegionCodeAndActiveTrue(regionCode).stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
    }

    public TheaterResponse getTheaterById(Long id) {
    Theater theater = theaterRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Theater", "id", id));
    return mapToResponse(theater);
    }

    private TheaterResponse mapToResponse(Theater theater) {
    TheaterResponse response = TheaterResponse.builder()
        .id(theater.getId())
        .name(theater.getName())
        .address(theater.getAddress())
        .phone(theater.getPhone())
        .email(theater.getEmail())
        .imageUrl(theater.getImageUrl())
        .description(theater.getDescription())
        .active(theater.getActive())
        .totalRooms(theater.getRooms() != null ? theater.getRooms().size() : 0)
        .build();

    City city = theater.getCity();
    if (city != null) {
        response.setCityId(city.getId());
        response.setCityName(city.getName());
        response.setCityCode(city.getCode());

        Region region = city.getRegion();
        if (region != null) {
        response.setRegionId(region.getId());
        response.setRegionName(region.getName());
        response.setRegionCode(region.getCode());
        }
    }

    return response;
    }

    // ---------------- Cinema-like APIs moved here ----------------

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

    @Transactional(readOnly = true)
    public List<CinemaListResponse.TheaterSummary> getTheatersByCityId(Long cityId) {
    List<Theater> theaters = theaterRepository.findByCityIdAndActiveTrue(cityId);
    return theaters.stream()
        .map(this::mapToTheaterSummary)
        .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CinemaListResponse.TheaterSummary> getTheatersByCityCode(String cityCode) {
    List<Theater> theaters = theaterRepository.findByCityCodeAndActiveTrue(cityCode);
    return theaters.stream()
        .map(this::mapToTheaterSummary)
        .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CinemaListResponse.TheaterSummary getTheaterDetail(Long theaterId) {
    Theater theater = theaterRepository.findById(theaterId)
        .orElseThrow(() -> new ResourceNotFoundException("Theater", "id", theaterId));
    return mapToTheaterSummary(theater);
    }

    @Transactional(readOnly = true)
    public CinemaScheduleResponse getCinemaSchedule(Long theaterId, LocalDate date) {
    Theater theater = theaterRepository.findById(theaterId)
        .orElseThrow(() -> new ResourceNotFoundException("Theater", "id", theaterId));

    List<Showtime> showtimes = showtimeRepository.findByTheaterAndDateWithDetails(theaterId, date);

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

    private CinemaScheduleResponse.MovieSchedule buildMovieSchedule(List<Showtime> showtimes) {
    if (showtimes.isEmpty()) return null;

    Showtime firstShowtime = showtimes.get(0);
    var movie = firstShowtime.getMovie();

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

    private CinemaScheduleResponse.ShowtimeSlot mapToShowtimeSlot(Showtime showtime) {
    return CinemaScheduleResponse.ShowtimeSlot.builder()
        .showtimeId(showtime.getId())
        .startTime(showtime.getStartTime())
        .endTime(showtime.getEndTime())
        .basePrice(showtime.getBasePrice())
        .status(showtime.getStatus().name())
        .roomName(showtime.getRoom().getName())
        .availableSeats(null)
        .build();
    }

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
