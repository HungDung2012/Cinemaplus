package com.cinema.service;

import com.cinema.dto.request.ReviewRequest;
import com.cinema.dto.response.MovieRatingStats;
import com.cinema.dto.response.ReviewResponse;
import com.cinema.exception.BadRequestException;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.Movie;
import com.cinema.model.Review;
import com.cinema.model.User;
import com.cinema.repository.MovieRepository;
import com.cinema.repository.ReviewRepository;
import com.cinema.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewResponse createReview(ReviewRequest request, Long userId) {
        // Check if user already reviewed this movie
        if (reviewRepository.existsByMovieIdAndUserId(request.getMovieId(), userId)) {
            throw new BadRequestException("Bạn đã đánh giá phim này rồi");
        }

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        Review review = Review.builder()
                .movie(movie)
                .user(user)
                .rating(request.getRating())
                .content(request.getContent())
                .isSpoiler(request.getIsSpoiler() != null ? request.getIsSpoiler() : false)
                .likesCount(0)
                .build();

        review = reviewRepository.save(review);
        return mapToResponse(review);
    }

    public Page<ReviewResponse> getReviewsByMovie(Long movieId, Pageable pageable) {
        return reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId, pageable)
                .map(this::mapToResponse);
    }

    public List<ReviewResponse> getAllReviewsByMovie(Long movieId) {
        return reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ReviewResponse> getTopReviewsByMovie(Long movieId) {
        return reviewRepository.findTop5ByMovieIdOrderByLikesCountDesc(movieId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public MovieRatingStats getMovieRatingStats(Long movieId) {
        Double avgRating = reviewRepository.getAverageRatingByMovieId(movieId);
        Long totalReviews = reviewRepository.countByMovieId(movieId);

        return MovieRatingStats.builder()
                .movieId(movieId)
                .averageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0)
                .totalReviews(totalReviews)
                .build();
    }

    @Transactional
    public ReviewResponse likeReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá"));
        
        review.setLikesCount(review.getLikesCount() + 1);
        review = reviewRepository.save(review);
        return mapToResponse(review);
    }

    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá"));

        if (!review.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền xóa đánh giá này");
        }

        reviewRepository.delete(review);
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .movieId(review.getMovie().getId())
                .movieTitle(review.getMovie().getTitle())
                .userId(review.getUser().getId())
                .userName(maskUserName(review.getUser().getFullName()))
                .userAvatar(null)
                .rating(review.getRating())
                .content(review.getContent())
                .likesCount(review.getLikesCount())
                .createdAt(review.getCreatedAt())
                .isSpoiler(review.getIsSpoiler())
                .build();
    }

    // Mask username like "Ng*********ệt"
    private String maskUserName(String name) {
        if (name == null || name.length() <= 4) {
            return name;
        }
        String first = name.substring(0, 2);
        String last = name.substring(name.length() - 2);
        String masked = "*".repeat(Math.min(name.length() - 4, 8));
        return first + masked + last;
    }
}
