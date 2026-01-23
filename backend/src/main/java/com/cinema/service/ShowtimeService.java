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
        return showtimeRepository.findByMovieIdAndRoomTheaterIdOrderByShowDateAscStartTimeAsc(movieId, theaterId).stream()
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

    public List<ShowtimeResponse> getShowtimesByRange(LocalDate startDate, LocalDate endDate) {
        return showtimeRepository.findByShowDateBetween(startDate, endDate).stream()
                .map(this::mapToResponse)
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
        
        showtime.setShowDate(request.getShowDate());
        showtime.setStartTime(request.getStartTime());
        showtime.setEndTime(endTime);
        showtime.setBasePrice(request.getBasePrice());
        showtime.setMovie(movie);
        showtime.setRoom(room);
        
        showtime = showtimeRepository.save(showtime);
        return mapToResponse(showtime);
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
}
