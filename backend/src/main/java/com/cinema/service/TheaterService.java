package com.cinema.service;

import com.cinema.dto.response.GroupedTheaterResponse;
import com.cinema.dto.response.TheaterScheduleResponse;
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
                                .phone(theater.getHotline() != null ? theater.getHotline() : theater.getPhone())
                                .email(theater.getEmail())
                                .imageUrl(theater.getImageUrl())
                                .mapUrl(theater.getMapUrl())
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
        public GroupedTheaterResponse getTheatersGroupedByCity() {
                List<City> activeCities = cityRepository.findCitiesWithActiveTheaters();

                List<GroupedTheaterResponse.CityGroup> cityGroups = activeCities.stream()
                                .map(city -> {
                                        List<Theater> activeTheaters = city.getTheaters().stream()
                                                        .filter(t -> t.getActive() != null && t.getActive())
                                                        .collect(Collectors.toList());

                                        return GroupedTheaterResponse.CityGroup.builder()
                                                        .cityName(city.getName())
                                                        .cityCode(city.getCode())
                                                        .theaterCount(activeTheaters.size())
                                                        .theaters(activeTheaters.stream()
                                                                        .map(this::mapToTheaterSummary)
                                                                        .collect(Collectors.toList()))
                                                        .build();
                                })
                                .sorted(Comparator.comparing(GroupedTheaterResponse.CityGroup::getCityName))
                                .collect(Collectors.toList());

                int totalTheaters = cityGroups.stream()
                                .mapToInt(GroupedTheaterResponse.CityGroup::getTheaterCount)
                                .sum();

                return GroupedTheaterResponse.builder()
                                .cities(cityGroups)
                                .totalTheaters(totalTheaters)
                                .build();
        }

        @Transactional(readOnly = true)
        public TheaterScheduleResponse getTheaterSchedule(Long theaterId, LocalDate date) {
                Theater theater = theaterRepository.findById(theaterId)
                                .orElseThrow(() -> new ResourceNotFoundException("Theater", "id", theaterId));

                List<Showtime> showtimes = showtimeRepository.findByTheaterAndDateWithDetails(theaterId, date);

                Map<Long, List<Showtime>> showtimesByMovie = showtimes.stream()
                                .collect(Collectors.groupingBy(
                                                s -> s.getMovie().getId(),
                                                LinkedHashMap::new,
                                                Collectors.toList()));

                List<TheaterScheduleResponse.MovieSchedule> movieSchedules = showtimesByMovie.entrySet().stream()
                                .map(entry -> buildMovieSchedule(entry.getValue()))
                                .collect(Collectors.toList());

                return TheaterScheduleResponse.builder()
                                .theaterId(theater.getId())
                                .theaterName(theater.getName())
                                .theaterAddress(theater.getAddress())
                                .theaterPhone(theater.getHotline() != null ? theater.getHotline() : theater.getPhone())
                                .theaterImageUrl(theater.getImageUrl())
                                .scheduleDate(date)
                                .movies(movieSchedules)
                                .build();
        }

        private TheaterScheduleResponse.MovieSchedule buildMovieSchedule(List<Showtime> showtimes) {
                if (showtimes.isEmpty())
                        return null;

                Showtime firstShowtime = showtimes.get(0);
                var movie = firstShowtime.getMovie();

                Map<Room.RoomType, List<Showtime>> showtimesByFormat = showtimes.stream()
                                .collect(Collectors.groupingBy(
                                                s -> s.getRoom().getRoomType(),
                                                LinkedHashMap::new,
                                                Collectors.toList()));

                List<TheaterScheduleResponse.FormatSchedule> formats = showtimesByFormat.entrySet().stream()
                                .map(entry -> buildFormatSchedule(entry.getKey(), entry.getValue()))
                                .collect(Collectors.toList());

                return TheaterScheduleResponse.MovieSchedule.builder()
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

        private TheaterScheduleResponse.FormatSchedule buildFormatSchedule(Room.RoomType roomType,
                        List<Showtime> showtimes) {
                List<TheaterScheduleResponse.ShowtimeSlot> slots = showtimes.stream()
                                .map(this::mapToShowtimeSlot)
                                .sorted(Comparator.comparing(TheaterScheduleResponse.ShowtimeSlot::getStartTime))
                                .collect(Collectors.toList());

                return TheaterScheduleResponse.FormatSchedule.builder()
                                .format(getFormatDisplay(roomType))
                                .roomType(roomType.name())
                                .showtimes(slots)
                                .build();
        }

        private TheaterScheduleResponse.ShowtimeSlot mapToShowtimeSlot(Showtime showtime) {
                return TheaterScheduleResponse.ShowtimeSlot.builder()
                                .showtimeId(showtime.getId())
                                .startTime(showtime.getStartTime())
                                .endTime(showtime.getEndTime())
                                .basePrice(showtime.getBasePrice())
                                .status(showtime.getStatus().name())
                                .roomName(showtime.getRoom().getName())
                                .availableSeats(null)
                                .build();
        }

        private GroupedTheaterResponse.TheaterSummary mapToTheaterSummary(Theater theater) {
                return GroupedTheaterResponse.TheaterSummary.builder()
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
                if (cityName == null)
                        return "";
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

        // ---------------- Admin APIs ----------------

        @Transactional
        public TheaterResponse createTheater(com.cinema.dto.request.TheaterRequest request) {
                Theater theater = new Theater();
                mapRequestToTheater(request, theater);

                if (request.getCityId() != null) {
                        City city = cityRepository.findById(request.getCityId())
                                        .orElseThrow(() -> new ResourceNotFoundException("City", "id",
                                                        request.getCityId()));
                        theater.setCity(city);
                } else if (request.getCityName() != null && !request.getCityName().isEmpty()) {
                        City city = cityRepository.findByName(request.getCityName())
                                        .orElseThrow(() -> new ResourceNotFoundException("City", "name",
                                                        request.getCityName()));
                        theater.setCity(city);
                }

                Theater saved = theaterRepository.save(theater);
                return mapToResponse(saved);
        }

        @Transactional
        public TheaterResponse updateTheater(Long id, com.cinema.dto.request.TheaterRequest request) {
                Theater theater = theaterRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Theater", "id", id));

                if (request.getName() != null)
                        theater.setName(request.getName());
                if (request.getAddress() != null)
                        theater.setAddress(request.getAddress());
                if (request.getPhone() != null) {
                        theater.setPhone(request.getPhone());
                        theater.setHotline(request.getPhone());
                }
                if (request.getEmail() != null)
                        theater.setEmail(request.getEmail());
                if (request.getDescription() != null)
                        theater.setDescription(request.getDescription());
                if (request.getImageUrl() != null)
                        theater.setImageUrl(request.getImageUrl());
                if (request.getMapUrl() != null)
                        theater.setMapUrl(request.getMapUrl());
                if (request.getActive() != null)
                        theater.setActive(request.getActive());

                if (request.getCityId() != null) {
                        City city = cityRepository.findById(request.getCityId())
                                        .orElseThrow(() -> new ResourceNotFoundException("City", "id",
                                                        request.getCityId()));
                        theater.setCity(city);
                } else if (request.getCityName() != null && !request.getCityName().isEmpty()) {
                        City city = cityRepository.findByName(request.getCityName())
                                        .orElseThrow(() -> new ResourceNotFoundException("City", "name",
                                                        request.getCityName()));
                        theater.setCity(city);
                }

                Theater saved = theaterRepository.save(theater);
                return mapToResponse(saved);
        }

        @Transactional
        public void deleteTheater(Long id) {
                if (!theaterRepository.existsById(id)) {
                        throw new ResourceNotFoundException("Theater", "id", id);
                }
                theaterRepository.deleteById(id);
        }

        private void mapRequestToTheater(com.cinema.dto.request.TheaterRequest request, Theater theater) {
                theater.setName(request.getName());
                theater.setAddress(request.getAddress());
                theater.setPhone(request.getPhone());
                theater.setHotline(request.getPhone());
                theater.setEmail(request.getEmail());
                theater.setDescription(request.getDescription());
                theater.setImageUrl(request.getImageUrl());
                theater.setMapUrl(request.getMapUrl());
                theater.setActive(request.getActive() != null ? request.getActive() : true);
        }
}
