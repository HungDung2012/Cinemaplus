package com.cinema.service;

import com.cinema.dto.request.ShowtimeRequest;
import com.cinema.dto.response.ShowtimeResponse;
import com.cinema.exception.BadRequestException;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.Movie;
import com.cinema.model.Room;
import com.cinema.model.Showtime;
import com.cinema.repository.BookingSeatRepository;
import com.cinema.repository.MovieRepository;
import com.cinema.repository.RoomRepository;
import com.cinema.repository.ShowtimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShowtimeService {

        private final ShowtimeRepository showtimeRepository;
        private final MovieRepository movieRepository;
        private final RoomRepository roomRepository;
        private final BookingSeatRepository bookingSeatRepository;

        public List<ShowtimeResponse> getShowtimesByMovie(Long movieId) {
                return showtimeRepository.findByMovieId(movieId).stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        public List<ShowtimeResponse> getShowtimesByMovieAndTheater(Long movieId, Long theaterId) {
                return showtimeRepository
                                .findByMovieIdAndRoomTheaterIdOrderByShowDateAscStartTimeAsc(movieId, theaterId)
                                .stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        public List<ShowtimeResponse> getShowtimesByMovieAndDate(Long movieId, LocalDate date) {
                return showtimeRepository.findAvailableByMovieAndDate(movieId, date).stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        public List<ShowtimeResponse> getShowtimesByMovieTheaterAndDate(Long movieId, Long theaterId, LocalDate date) {
                return showtimeRepository.findByMovieTheaterAndDate(movieId, theaterId, date).stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        public List<ShowtimeResponse> getShowtimesByTheaterAndDate(Long theaterId, LocalDate date) {
                return showtimeRepository.findByTheaterAndDate(theaterId, date).stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        public com.cinema.dto.response.PageResponse<ShowtimeResponse> searchShowtimes(
                        LocalDate startDate, LocalDate endDate, List<Long> theaterIds, List<Long> movieIds, int page,
                        int size) {

                org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page,
                                size);
                org.springframework.data.domain.Page<Showtime> pageResult = showtimeRepository.searchShowtimes(
                                startDate, endDate,
                                (theaterIds != null && theaterIds.isEmpty()) ? null : theaterIds,
                                (movieIds != null && movieIds.isEmpty()) ? null : movieIds,
                                pageable);

                List<ShowtimeResponse> responses = pageResult.getContent().stream()
                                .map(this::mapToResponseLite)
                                .collect(Collectors.toList());

                return com.cinema.dto.response.PageResponse.<ShowtimeResponse>builder()
                                .content(responses)
                                .pageNo(page)
                                .pageSize(size)
                                .totalElements(pageResult.getTotalElements())
                                .totalPages(pageResult.getTotalPages())
                                .last(pageResult.isLast())
                                .build();
        }

        public List<ShowtimeResponse> getShowtimesByRange(LocalDate startDate, LocalDate endDate) {
                return showtimeRepository.findByShowDateBetweenWithDetails(startDate, endDate).stream()
                                .map(this::mapToResponseLite)
                                .collect(Collectors.toList());
        }

        public ShowtimeResponse getShowtimeById(Long id) {
                Showtime showtime = showtimeRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Showtime", "id", id));
                return mapToResponse(showtime);
        }

        @Transactional
        public ShowtimeResponse createShowtime(ShowtimeRequest request) {
                Movie movie = movieRepository.findById(request.getMovieId())
                                .orElseThrow(() -> new ResourceNotFoundException("Movie", "id", request.getMovieId()));

                Room room = roomRepository.findById(request.getRoomId())
                                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", request.getRoomId()));

                // Calculate end time based on movie duration
                var endTime = request.getStartTime().plusMinutes(movie.getDuration());

                // Validate showtime is not in the past
                if (request.getShowDate().isBefore(LocalDate.now())) {
                        throw new BadRequestException("Show date cannot be in the past");
                }

                // Validate overlap
                validateOverlap(room.getId(), -1L, request.getShowDate(), request.getStartTime(), endTime);

                Showtime showtime = Showtime.builder()
                                .showDate(request.getShowDate())
                                .startTime(request.getStartTime())
                                .endTime(endTime)
                                .basePrice(request.getBasePrice())
                                .status(Showtime.ShowtimeStatus.AVAILABLE)
                                .movie(movie)
                                .room(room)
                                .build();

                showtime = showtimeRepository.save(showtime);
                return mapToResponse(showtime);
        }

        @Transactional
        public ShowtimeResponse updateShowtime(Long id, ShowtimeRequest request) {
                Showtime showtime = showtimeRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Showtime", "id", id));

                Movie movie = movieRepository.findById(request.getMovieId())
                                .orElseThrow(() -> new ResourceNotFoundException("Movie", "id", request.getMovieId()));

                Room room = roomRepository.findById(request.getRoomId())
                                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", request.getRoomId()));

                var endTime = request.getStartTime().plusMinutes(movie.getDuration());

                // Validate overlap (exclude current showtime itself)
                validateOverlap(room.getId(), id, request.getShowDate(), request.getStartTime(), endTime);

                showtime.setShowDate(request.getShowDate());
                showtime.setStartTime(request.getStartTime());
                showtime.setEndTime(endTime);
                showtime.setBasePrice(request.getBasePrice());
                showtime.setMovie(movie);
                showtime.setRoom(room);
                showtime.setStatus(request.getStatus() != null ? request.getStatus() : showtime.getStatus()); // Update
                                                                                                              // status
                                                                                                              // if
                                                                                                              // provided

                showtime = showtimeRepository.save(showtime);
                return mapToResponse(showtime);
        }

        private void validateOverlap(Long roomId, Long excludedId, LocalDate date, java.time.LocalTime start,
                        java.time.LocalTime end) {
                List<Showtime> overlaps = showtimeRepository.checkOverlap(roomId, excludedId, date, start, end);
                if (!overlaps.isEmpty()) {
                        Showtime conflict = overlaps.get(0);
                        throw new BadRequestException(String.format("Room is occupied by movie '%s' from %s to %s",
                                        conflict.getMovie().getTitle(), conflict.getStartTime(),
                                        conflict.getEndTime()));
                }
        }

        @Transactional
        public void deleteShowtime(Long id) {
                Showtime showtime = showtimeRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Showtime", "id", id));
                showtimeRepository.delete(showtime);
        }

        private ShowtimeResponse mapToResponse(Showtime showtime) {
                Room room = showtime.getRoom();
                Movie movie = showtime.getMovie();

                // Calculate available seats
                List<Long> bookedSeats = bookingSeatRepository.findBookedSeatIdsByShowtime(showtime.getId());
                int availableSeats = room.getTotalSeats() - bookedSeats.size();

                return ShowtimeResponse.builder()
                                .id(showtime.getId())
                                .showDate(showtime.getShowDate())
                                .startTime(showtime.getStartTime())
                                .endTime(showtime.getEndTime())
                                .basePrice(showtime.getBasePrice())
                                .status(showtime.getStatus())
                                .movieId(movie.getId())
                                .movieTitle(movie.getTitle())
                                .moviePosterUrl(movie.getPosterUrl())
                                .movieDuration(movie.getDuration())
                                .roomId(room.getId())
                                .roomName(room.getName())
                                .roomType(room.getRoomType().name())
                                .theaterId(room.getTheater().getId())
                                .theaterName(room.getTheater().getName())
                                .availableSeats(availableSeats)
                                .build();
        }

        private ShowtimeResponse mapToResponseLite(Showtime showtime) {
                Room room = showtime.getRoom();
                Movie movie = showtime.getMovie();

                // Skip expensive booked seats query for list views
                // Just return total seats or estimate
                int availableSeats = room.getTotalSeats();

                return ShowtimeResponse.builder()
                                .id(showtime.getId())
                                .showDate(showtime.getShowDate())
                                .startTime(showtime.getStartTime())
                                .endTime(showtime.getEndTime())
                                .basePrice(showtime.getBasePrice())
                                .status(showtime.getStatus())
                                .movieId(movie.getId())
                                .movieTitle(movie.getTitle())
                                .moviePosterUrl(movie.getPosterUrl())
                                .movieDuration(movie.getDuration())
                                .roomId(room.getId())
                                .roomName(room.getName())
                                .roomType(room.getRoomType().name())
                                .theaterId(room.getTheater().getId())
                                .theaterName(room.getTheater().getName())
                                .availableSeats(availableSeats) // Approximate for list view
                                .build();
        }
}
