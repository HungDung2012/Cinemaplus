package com.cinema.controller;

import com.cinema.dto.mapper.AdminDTOMapper;
import com.cinema.dto.response.*;
import com.cinema.model.*;
import com.cinema.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private TheaterRepository theaterRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private PromotionRepository promotionRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AdminDTOMapper dtoMapper;

    // ==================== MOVIES ====================

    @GetMapping("/movies")
    public ResponseEntity<List<MovieResponse>> getAllMovies() {
        return ResponseEntity.ok(dtoMapper.toMovieResponseList(movieRepository.findAll()));
    }

    @GetMapping("/movies/{id}")
    public ResponseEntity<MovieResponse> getMovieById(@PathVariable Long id) {
        return movieRepository.findById(id)
                .map(movie -> ResponseEntity.ok(dtoMapper.toMovieResponse(movie)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/movies")
    public ResponseEntity<MovieResponse> createMovie(@RequestBody Movie movie) {
        movie.setCreatedAt(LocalDateTime.now());
        movie.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(dtoMapper.toMovieResponse(movieRepository.save(movie)));
    }

    @PutMapping("/movies/{id}")
    public ResponseEntity<MovieResponse> updateMovie(@PathVariable Long id, @RequestBody Movie movie) {
        return movieRepository.findById(id)
                .map(existingMovie -> {
                    movie.setId(id);
                    movie.setCreatedAt(existingMovie.getCreatedAt());
                    movie.setUpdatedAt(LocalDateTime.now());
                    return ResponseEntity.ok(dtoMapper.toMovieResponse(movieRepository.save(movie)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/movies/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable Long id) {
        if (movieRepository.existsById(id)) {
            movieRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==================== THEATERS ====================

    @GetMapping("/theaters")
    public ResponseEntity<List<TheaterResponse>> getAllTheaters() {
        return ResponseEntity.ok(dtoMapper.toTheaterResponseList(theaterRepository.findAll()));
    }

    @GetMapping("/theaters/{id}")
    public ResponseEntity<TheaterResponse> getTheaterById(@PathVariable Long id) {
        return theaterRepository.findById(id)
                .map(theater -> ResponseEntity.ok(dtoMapper.toTheaterResponse(theater)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/theaters")
    public ResponseEntity<Theater> createTheater(@RequestBody Theater theater) {
        return ResponseEntity.ok(theaterRepository.save(theater));
    }

    @PutMapping("/theaters/{id}")
    public ResponseEntity<Theater> updateTheater(@PathVariable Long id, @RequestBody Theater theater) {
        return theaterRepository.findById(id)
                .map(existingTheater -> {
                    theater.setId(id);
                    return ResponseEntity.ok(theaterRepository.save(theater));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/theaters/{id}")
    public ResponseEntity<Void> deleteTheater(@PathVariable Long id) {
        if (theaterRepository.existsById(id)) {
            theaterRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==================== ROOMS ====================

    @GetMapping("/rooms")
    public ResponseEntity<List<RoomResponse>> getAllRooms() {
        return ResponseEntity.ok(dtoMapper.toRoomResponseList(roomRepository.findAll()));
    }

    @GetMapping("/rooms/theater/{theaterId}")
    public ResponseEntity<List<RoomResponse>> getRoomsByTheater(@PathVariable Long theaterId) {
        return ResponseEntity.ok(dtoMapper.toRoomResponseList(roomRepository.findByTheaterId(theaterId)));
    }

    @GetMapping("/theaters/{theaterId}/rooms")
    public ResponseEntity<List<RoomResponse>> getTheaterRooms(@PathVariable Long theaterId) {
        return ResponseEntity.ok(dtoMapper.toRoomResponseList(roomRepository.findByTheaterId(theaterId)));
    }

    @PostMapping("/rooms")
    public ResponseEntity<Room> createRoom(@RequestBody Room room) {
        return ResponseEntity.ok(roomRepository.save(room));
    }

    @PutMapping("/rooms/{id}")
    public ResponseEntity<Room> updateRoom(@PathVariable Long id, @RequestBody Room room) {
        return roomRepository.findById(id)
                .map(existingRoom -> {
                    room.setId(id);
                    return ResponseEntity.ok(roomRepository.save(room));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        if (roomRepository.existsById(id)) {
            roomRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==================== SHOWTIMES ====================

    @GetMapping("/showtimes")
    public ResponseEntity<List<ShowtimeResponse>> getAllShowtimes(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        
        LocalDate now = LocalDate.now();
        int targetMonth = month != null ? month : now.getMonthValue();
        int targetYear = year != null ? year : now.getYear();

        List<Showtime> allShowtimes = showtimeRepository.findAll();
        List<Showtime> filteredShowtimes = allShowtimes.stream()
                .filter(s -> s.getShowDate().getMonthValue() == targetMonth && s.getShowDate().getYear() == targetYear)
                .sorted(Comparator.comparing(Showtime::getShowDate).thenComparing(Showtime::getStartTime))
                .toList();

        return ResponseEntity.ok(dtoMapper.toShowtimeResponseList(filteredShowtimes));
    }

    @GetMapping("/showtimes/{id}")
    public ResponseEntity<ShowtimeResponse> getShowtimeById(@PathVariable Long id) {
        return showtimeRepository.findById(id)
                .map(showtime -> ResponseEntity.ok(dtoMapper.toShowtimeResponse(showtime)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/showtimes")
    public ResponseEntity<?> createShowtime(@RequestBody Map<String, Object> request) {
        try {
            Showtime showtime = new Showtime();
            
            Long movieId = Long.valueOf(request.get("movieId").toString());
            Long roomId = Long.valueOf(request.get("roomId").toString());
            
            Movie movie = movieRepository.findById(movieId)
                    .orElseThrow(() -> new RuntimeException("Movie not found"));
            Room room = roomRepository.findById(roomId)
                    .orElseThrow(() -> new RuntimeException("Room not found"));
            
            showtime.setMovie(movie);
            showtime.setRoom(room);
            
            // Parse datetime and extract date/time
            LocalDateTime dateTime = LocalDateTime.parse(request.get("startTime").toString());
            showtime.setShowDate(dateTime.toLocalDate());
            showtime.setStartTime(dateTime.toLocalTime());
            showtime.setBasePrice(new BigDecimal(request.get("price").toString()));
            showtime.setStatus(Showtime.ShowtimeStatus.valueOf(request.get("status").toString()));
            
            // Calculate end time based on movie duration
            showtime.setEndTime(showtime.getStartTime().plusMinutes(movie.getDuration()));
            
            return ResponseEntity.ok(showtimeRepository.save(showtime));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/showtimes/{id}")
    public ResponseEntity<?> updateShowtime(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            return showtimeRepository.findById(id)
                    .map(showtime -> {
                        Long movieId = Long.valueOf(request.get("movieId").toString());
                        Long roomId = Long.valueOf(request.get("roomId").toString());
                        
                        Movie movie = movieRepository.findById(movieId)
                                .orElseThrow(() -> new RuntimeException("Movie not found"));
                        Room room = roomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("Room not found"));
                        
                        showtime.setMovie(movie);
                        showtime.setRoom(room);
                        
                        // Parse datetime and extract date/time
                        LocalDateTime dateTime = LocalDateTime.parse(request.get("startTime").toString());
                        showtime.setShowDate(dateTime.toLocalDate());
                        showtime.setStartTime(dateTime.toLocalTime());
                        showtime.setBasePrice(new BigDecimal(request.get("price").toString()));
                        showtime.setStatus(Showtime.ShowtimeStatus.valueOf(request.get("status").toString()));
                        showtime.setEndTime(showtime.getStartTime().plusMinutes(movie.getDuration()));
                        
                        return ResponseEntity.ok(showtimeRepository.save(showtime));
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/showtimes/{id}")
    public ResponseEntity<Void> deleteShowtime(@PathVariable Long id) {
        if (showtimeRepository.existsById(id)) {
            showtimeRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==================== BOOKINGS ====================

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(dtoMapper.toBookingResponseList(bookingRepository.findAll()));
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable Long id) {
        return bookingRepository.findById(id)
                .map(booking -> ResponseEntity.ok(dtoMapper.toBookingResponse(booking)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/bookings/{id}/status")
    public ResponseEntity<Booking> updateBookingStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        return bookingRepository.findById(id)
                .map(booking -> {
                    booking.setStatus(Booking.BookingStatus.valueOf(request.get("status")));
                    return ResponseEntity.ok(bookingRepository.save(booking));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        if (bookingRepository.existsById(id)) {
            bookingRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==================== USERS ====================

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(dtoMapper.toUserResponseList(userRepository.findAll()));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> ResponseEntity.ok(dtoMapper.toUserResponse(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> request) {
        try {
            User user = new User();
            user.setFullName((String) request.get("fullName"));
            user.setEmail((String) request.get("email"));
            user.setPhone((String) request.get("phone"));
            user.setPassword(passwordEncoder.encode((String) request.get("password")));
            user.setRole(User.Role.valueOf((String) request.get("role")));
            user.setActive(true);
            return ResponseEntity.ok(userRepository.save(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setFullName((String) request.get("fullName"));
                    user.setEmail((String) request.get("email"));
                    user.setPhone((String) request.get("phone"));
                    user.setRole(User.Role.valueOf((String) request.get("role")));
                    
                    String password = (String) request.get("password");
                    if (password != null && !password.isEmpty()) {
                        user.setPassword(passwordEncoder.encode(password));
                    }
                    
                    return ResponseEntity.ok(userRepository.save(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> request) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setRole(User.Role.valueOf(request.get("role")));
                    return ResponseEntity.ok(userRepository.save(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==================== FOODS ====================

    @GetMapping("/foods")
    public ResponseEntity<List<Food>> getAllFoods() {
        return ResponseEntity.ok(foodRepository.findAll());
    }

    @GetMapping("/foods/{id}")
    public ResponseEntity<Food> getFoodById(@PathVariable Long id) {
        return foodRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/foods")
    public ResponseEntity<Food> createFood(@RequestBody Food food) {
        return ResponseEntity.ok(foodRepository.save(food));
    }

    @PutMapping("/foods/{id}")
    public ResponseEntity<Food> updateFood(@PathVariable Long id, @RequestBody Food food) {
        return foodRepository.findById(id)
                .map(existingFood -> {
                    food.setId(id);
                    return ResponseEntity.ok(foodRepository.save(food));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/foods/{id}")
    public ResponseEntity<Void> deleteFood(@PathVariable Long id) {
        if (foodRepository.existsById(id)) {
            foodRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==================== PROMOTIONS ====================

    @GetMapping("/promotions")
    public ResponseEntity<List<Promotion>> getAllPromotions() {
        return ResponseEntity.ok(promotionRepository.findAll());
    }

    @GetMapping("/promotions/{id}")
    public ResponseEntity<Promotion> getPromotionById(@PathVariable Long id) {
        return promotionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/promotions")
    public ResponseEntity<Promotion> createPromotion(@RequestBody Promotion promotion) {
        return ResponseEntity.ok(promotionRepository.save(promotion));
    }

    @PutMapping("/promotions/{id}")
    public ResponseEntity<Promotion> updatePromotion(@PathVariable Long id, @RequestBody Promotion promotion) {
        return promotionRepository.findById(id)
                .map(existingPromotion -> {
                    promotion.setId(id);
                    return ResponseEntity.ok(promotionRepository.save(promotion));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/promotions/{id}")
    public ResponseEntity<Void> deletePromotion(@PathVariable Long id) {
        if (promotionRepository.existsById(id)) {
            promotionRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==================== REVIEWS ====================

    @GetMapping("/reviews")
    public ResponseEntity<List<ReviewResponse>> getAllReviews() {
        return ResponseEntity.ok(dtoMapper.toReviewResponseList(reviewRepository.findAll()));
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        if (reviewRepository.existsById(id)) {
            reviewRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==================== DASHBOARD STATS ====================

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMovies", movieRepository.count());
        stats.put("totalTheaters", theaterRepository.count());
        stats.put("totalUsers", userRepository.count());
        stats.put("totalBookings", bookingRepository.count());
        stats.put("totalRevenue", bookingRepository.findAll().stream()
                .map(b -> b.getTotalAmount() != null ? b.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        return ResponseEntity.ok(stats);
    }
}
