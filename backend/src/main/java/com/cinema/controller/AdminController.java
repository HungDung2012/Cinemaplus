package com.cinema.controller;

import jakarta.validation.Valid;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.ShowtimeResponse;
import com.cinema.dto.response.MovieResponse;
import com.cinema.dto.response.PageResponse;
import com.cinema.dto.response.TheaterResponse;
import com.cinema.dto.response.BookingResponse;
import com.cinema.dto.response.UserResponse;
import com.cinema.model.User;
import com.cinema.repository.UserRepository;
import com.cinema.service.ShowtimeService;
import com.cinema.service.MovieService;
import com.cinema.service.TheaterService;
import com.cinema.service.BookingService;
import org.modelmapper.ModelMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ShowtimeService showtimeService;
    private final MovieService movieService;
    private final TheaterService theaterService;
    private final BookingService bookingService;
    private final UserRepository userRepository;

    // Injected for performance optimizations (Dashboard stats)
    private final com.cinema.repository.MovieRepository movieRepository;
    private final com.cinema.repository.TheaterRepository theaterRepository;
    private final com.cinema.repository.BookingRepository bookingRepository;

    private final ModelMapper modelMapper;

    @GetMapping("/showtimes/range")
    public ResponseEntity<ApiResponse<List<ShowtimeResponse>>> getShowtimesByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<ShowtimeResponse> showtimes = showtimeService.getShowtimesByRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(showtimes));
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<ApiResponse<com.cinema.dto.response.DashboardStatsResponse>> getDashboardStats() {
        long totalMovies = movieRepository.count();
        long totalTheaters = theaterRepository.count();
        long totalUsers = userRepository.count();

        // Overall booking stats
        Map<String, Object> overall = bookingRepository.getOverallStats();
        long totalBookings = overall.get("totalBookings") != null ? ((Number) overall.get("totalBookings")).longValue()
                : 0;
        java.math.BigDecimal totalRevenue = overall.get("totalRevenue") != null
                ? (java.math.BigDecimal) overall.get("totalRevenue")
                : java.math.BigDecimal.ZERO;

        // Today's stats
        java.time.LocalDateTime todayStart = java.time.LocalDate.now().atStartOfDay();
        java.time.LocalDateTime todayEnd = todayStart.plusDays(1).minusNanos(1);

        long todayBookings = bookingRepository.countByCreatedAtBetween(todayStart, todayEnd);
        java.math.BigDecimal todayRevenue = bookingRepository.sumRevenueBetween(todayStart, todayEnd);
        if (todayRevenue == null)
            todayRevenue = java.math.BigDecimal.ZERO;

        com.cinema.dto.response.DashboardStatsResponse stats = com.cinema.dto.response.DashboardStatsResponse.builder()
                .totalMovies(totalMovies)
                .totalTheaters(totalTheaters)
                .totalUsers(totalUsers)
                .totalBookings(totalBookings)
                .totalRevenue(totalRevenue)
                .todayBookings(todayBookings)
                .todayRevenue(todayRevenue)
                .build();

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // =================== MOVIES (admin proxy) ===================
    @GetMapping("/movies")
    public ResponseEntity<ApiResponse<PageResponse<MovieResponse>>> adminGetMovies(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) com.cinema.model.Movie.MovieStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "releaseDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        org.springframework.data.domain.Sort sort = sortDir.equalsIgnoreCase("asc")
                ? org.springframework.data.domain.Sort.by(sortBy).ascending()
                : org.springframework.data.domain.Sort.by(sortBy).descending();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size,
                sort);

        PageResponse<MovieResponse> response = movieService.getAllMovies(search, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/movies/{id}")
    public ResponseEntity<ApiResponse<MovieResponse>> adminGetMovieById(@PathVariable Long id) {
        MovieResponse movie = movieService.getMovieById(id);
        return ResponseEntity.ok(ApiResponse.success(movie));
    }

    @PostMapping("/movies")
    public ResponseEntity<ApiResponse<MovieResponse>> adminCreateMovie(
            @RequestBody com.cinema.dto.request.MovieRequest request) {
        MovieResponse movie = movieService.createMovie(request);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("Movie created", movie));
    }

    @PutMapping("/movies/{id}")
    public ResponseEntity<ApiResponse<MovieResponse>> adminUpdateMovie(@PathVariable Long id,
            @RequestBody com.cinema.dto.request.MovieRequest request) {
        MovieResponse movie = movieService.updateMovie(id, request);
        return ResponseEntity.ok(ApiResponse.success("Movie updated", movie));
    }

    @DeleteMapping("/movies/{id}")
    public ResponseEntity<ApiResponse<Void>> adminDeleteMovie(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.ok(ApiResponse.success("Movie deleted", null));
    }

    // =================== Rooms (admin proxy) ======================
    @PutMapping("/rooms/{roomId}")
    public ResponseEntity<ApiResponse<com.cinema.dto.response.RoomResponse>> adminUpdateSeatingChart(
            @PathVariable Long theaterId,
            @PathVariable Long roomId,
            @RequestBody com.cinema.dto.request.SeatingChartRequest request) {
        com.cinema.dto.response.RoomResponse updatedRoom = theaterService.updateSeatingChart(theaterId, roomId, request);
        
        return ResponseEntity.ok(ApiResponse.success("Seating chart updated", updatedRoom));
    }

    // =================== THEATERS (admin proxy) ===================
    @GetMapping("/theaters")
    public ResponseEntity<ApiResponse<List<TheaterResponse>>> adminGetTheaters() {
        List<TheaterResponse> list = theaterService.getAllTheaters();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/theaters/{id}")
    public ResponseEntity<ApiResponse<TheaterResponse>> adminGetTheaterById(@PathVariable Long id) {
        TheaterResponse t = theaterService.getTheaterById(id);
        return ResponseEntity.ok(ApiResponse.success(t));
    }

    @PostMapping("/theaters")
    public ResponseEntity<ApiResponse<TheaterResponse>> adminCreateTheater(
            @Valid @RequestBody com.cinema.dto.request.TheaterRequest request) {
        TheaterResponse theater = theaterService.createTheater(request);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("Theater created", theater));
    }

    @PutMapping("/theaters/{id}")
    public ResponseEntity<ApiResponse<TheaterResponse>> adminUpdateTheater(@PathVariable Long id,
            @Valid @RequestBody com.cinema.dto.request.TheaterRequest request) {
        TheaterResponse theater = theaterService.updateTheater(id, request);
        return ResponseEntity.ok(ApiResponse.success("Theater updated", theater));
    }

    @DeleteMapping("/theaters/{id}")
    public ResponseEntity<ApiResponse<Void>> adminDeleteTheater(@PathVariable Long id) {
        theaterService.deleteTheater(id);
        return ResponseEntity.ok(ApiResponse.success("Theater deleted", null));
    }

    // =================== BOOKINGS (admin) ===================
    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> adminGetBookings() {
        List<BookingResponse> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(ApiResponse.success(bookings));
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> adminGetBookingById(@PathVariable Long id) {
        BookingResponse booking = bookingService.getBookingById(id);
        return ResponseEntity.ok(ApiResponse.success(booking));
    }

    @PutMapping("/bookings/{id}/status")
    public ResponseEntity<ApiResponse<BookingResponse>> adminUpdateBookingStatus(@PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        BookingResponse updated = bookingService.updateBookingStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<ApiResponse<Void>> adminDeleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.ok(ApiResponse.success("Booking deleted", null));
    }

    // =================== USERS (basic admin) ===================
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> adminGetUsers() {
        List<User> users = userRepository.findAll();
        List<UserResponse> resp = users.stream()
                .map(u -> modelMapper.map(u, UserResponse.class))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> adminGetUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.cinema.exception.ResourceNotFoundException("User", "id", id));
        UserResponse resp = modelMapper.map(user, UserResponse.class);
        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> adminUpdateUserRole(@PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String role = body.get("role");
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.cinema.exception.ResourceNotFoundException("User", "id", id));
        try {
            user.setRole(User.Role.valueOf(role));
            userRepository.save(user);
            return ResponseEntity.ok(ApiResponse.success(modelMapper.map(user, UserResponse.class)));
        } catch (IllegalArgumentException ex) {
            throw new com.cinema.exception.BadRequestException("Invalid role: " + role);
        }
    }
}