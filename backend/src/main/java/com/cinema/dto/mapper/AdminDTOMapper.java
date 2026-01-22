package com.cinema.dto.mapper;

import com.cinema.dto.response.*;
import com.cinema.model.*;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper class để convert Entity sang DTO cho Admin API
 * Tránh vấn đề nested data và circular reference
 */
@Component
public class AdminDTOMapper {

    // ==================== MOVIE ====================

    public MovieResponse toMovieResponse(Movie movie) {
        if (movie == null) return null;

        return MovieResponse.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .description(movie.getDescription())
                .duration(movie.getDuration())
                .director(movie.getDirector())
                .actors(movie.getActors())
                .genre(movie.getGenre())
                .language(movie.getLanguage())
                .releaseDate(movie.getReleaseDate())
                .endDate(movie.getEndDate())
                .posterUrl(movie.getPosterUrl())
                .trailerUrl(movie.getTrailerUrl())
                .ageRating(movie.getAgeRating())
                .rating(movie.getRating())
                .status(movie.getStatus())
                .build();
    }

    public List<MovieResponse> toMovieResponseList(List<Movie> movies) {
        return movies.stream()
                .map(this::toMovieResponse)
                .collect(Collectors.toList());
    }

    // ==================== BOOKING ====================
    
    public BookingResponse toBookingResponse(Booking booking) {
        if (booking == null) return null;
        
        BookingResponse.BookingResponseBuilder builder = BookingResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .seatAmount(booking.getSeatAmount())
                .foodAmount(booking.getFoodAmount())
                .totalAmount(booking.getTotalAmount())
                .discountAmount(booking.getDiscountAmount())
                .finalAmount(booking.getFinalAmount())
                .numberOfSeats(booking.getNumberOfSeats())
                .status(booking.getStatus())
                .notes(booking.getNotes())
                .createdAt(booking.getCreatedAt());

        // User info
        if (booking.getUser() != null) {
            User user = booking.getUser();  
            builder.userId(user.getId())
                   .userFullName(user.getFullName())
                   .userEmail(user.getEmail());
        }

        // Showtime info
        if (booking.getShowtime() != null) {
            Showtime showtime = booking.getShowtime();
            builder.showtimeId(showtime.getId())
                   .showDate(showtime.getShowDate())
                   .startTime(showtime.getStartTime());

            // Movie info
            if (showtime.getMovie() != null) {
                Movie movie = showtime.getMovie();
                builder.movieId(movie.getId())
                       .movieTitle(movie.getTitle())
                       .moviePosterUrl(movie.getPosterUrl());
            }

            // Room & Theater info
            if (showtime.getRoom() != null) {
                Room room = showtime.getRoom();
                builder.roomName(room.getName());
                
                if (room.getTheater() != null) {
                    builder.theaterName(room.getTheater().getName());
                }
            }
        }

        return builder.build();
    }

    public List<BookingResponse> toBookingResponseList(List<Booking> bookings) {
        return bookings.stream()
                .map(this::toBookingResponse)
                .collect(Collectors.toList());
    }

    // ==================== USER ====================
    
    public UserResponse toUserResponse(User user) {
        if (user == null) return null;
        
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public List<UserResponse> toUserResponseList(List<User> users) {
        return users.stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    // ==================== SHOWTIME ====================
    
    public ShowtimeResponse toShowtimeResponse(Showtime showtime) {
        if (showtime == null) return null;
        
        ShowtimeResponse.ShowtimeResponseBuilder builder = ShowtimeResponse.builder()
                .id(showtime.getId())
                .showDate(showtime.getShowDate())
                .startTime(showtime.getStartTime())
                .endTime(showtime.getEndTime())
                .basePrice(showtime.getBasePrice())
                .status(showtime.getStatus());

        // Movie info
        if (showtime.getMovie() != null) {
            Movie movie = showtime.getMovie();
            builder.movieId(movie.getId())
                   .movieTitle(movie.getTitle())
                   .moviePosterUrl(movie.getPosterUrl())
                   .movieDuration(movie.getDuration());
        }

        // Room info
        if (showtime.getRoom() != null) {
            Room room = showtime.getRoom();
            builder.roomId(room.getId())
                   .roomName(room.getName())
                   .roomType(room.getRoomType() != null ? room.getRoomType().name() : null);

            // Theater info
            if (room.getTheater() != null) {
                Theater theater = room.getTheater();
                builder.theaterId(theater.getId())
                       .theaterName(theater.getName());
            }
        }

        return builder.build();
    }

    public List<ShowtimeResponse> toShowtimeResponseList(List<Showtime> showtimes) {
        return showtimes.stream()
                .map(this::toShowtimeResponse)
                .collect(Collectors.toList());
    }

    // ==================== THEATER ====================
    
    public TheaterResponse toTheaterResponse(Theater theater) {
        if (theater == null) return null;
        
        TheaterResponse.TheaterResponseBuilder builder = TheaterResponse.builder()
                .id(theater.getId())
                .name(theater.getName())
                .address(theater.getAddress())
                .phone(theater.getPhone())
                .email(theater.getEmail())
                .imageUrl(theater.getImageUrl())
                .description(theater.getDescription())
                .active(theater.getActive());

        // City info
        if (theater.getCity() != null) {
            City city = theater.getCity();
            builder.cityId(city.getId())
                   .cityName(city.getName())
                   .cityCode(city.getCode());

            // Region info
            if (city.getRegion() != null) {
                Region region = city.getRegion();
                builder.regionId(region.getId())
                       .regionName(region.getName())
                       .regionCode(region.getCode());
            }
        }

        return builder.build();
    }

    public List<TheaterResponse> toTheaterResponseList(List<Theater> theaters) {
        return theaters.stream()
                .map(this::toTheaterResponse)
                .collect(Collectors.toList());
    }

    // ==================== ROOM ====================
    
    public RoomResponse toRoomResponse(Room room) {
        if (room == null) return null;
        
        RoomResponse.RoomResponseBuilder builder = RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .totalSeats(room.getTotalSeats())
                .rowsCount(room.getRowsCount())
                .columnsCount(room.getColumnsCount())
                .roomType(room.getRoomType())
                .active(room.getActive());

        if (room.getTheater() != null) {
            builder.theaterId(room.getTheater().getId())
                   .theaterName(room.getTheater().getName());
        }

        return builder.build();
    }

    public List<RoomResponse> toRoomResponseList(List<Room> rooms) {
        return rooms.stream()
                .map(this::toRoomResponse)
                .collect(Collectors.toList());
    }

    // ==================== REVIEW ====================
    
    public ReviewResponse toReviewResponse(Review review) {
        if (review == null) return null;
        
        ReviewResponse.ReviewResponseBuilder builder = ReviewResponse.builder()
                .id(review.getId())
                .rating(review.getRating())
                .content(review.getContent())
                .likesCount(review.getLikesCount())
                .createdAt(review.getCreatedAt())
                .isSpoiler(review.getIsSpoiler());

        if (review.getMovie() != null) {
            builder.movieId(review.getMovie().getId())
                   .movieTitle(review.getMovie().getTitle());
        }

        if (review.getUser() != null) {
            builder.userId(review.getUser().getId())
                   .userName(review.getUser().getFullName())
                   .userAvatar(review.getUser().getAvatar());
        }

        return builder.build();
    }

    public List<ReviewResponse> toReviewResponseList(List<Review> reviews) {
        return reviews.stream()
                .map(this::toReviewResponse)
                .collect(Collectors.toList());
    }
}
