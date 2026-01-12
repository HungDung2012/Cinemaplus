package com.cinema.controller;

import com.cinema.dto.request.ReviewRequest;
import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.MovieRatingStats;
import com.cinema.dto.response.ReviewResponse;
import com.cinema.security.CurrentUser;
import com.cinema.security.UserPrincipal;
import com.cinema.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * Lấy danh sách đánh giá của phim (có phân trang)
     */
    @GetMapping("/movie/{movieId}")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getReviewsByMovie(
            @PathVariable Long movieId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ReviewResponse> reviews = reviewService.getReviewsByMovie(movieId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Danh sách đánh giá", reviews));
    }

    /**
     * Lấy tất cả đánh giá của phim (không phân trang)
     */
    @GetMapping("/movie/{movieId}/all")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getAllReviewsByMovie(@PathVariable Long movieId) {
        List<ReviewResponse> reviews = reviewService.getAllReviewsByMovie(movieId);
        return ResponseEntity.ok(ApiResponse.success("Tất cả đánh giá", reviews));
    }

    /**
     * Lấy top đánh giá được thích nhiều nhất
     */
    @GetMapping("/movie/{movieId}/top")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getTopReviewsByMovie(@PathVariable Long movieId) {
        List<ReviewResponse> reviews = reviewService.getTopReviewsByMovie(movieId);
        return ResponseEntity.ok(ApiResponse.success("Top đánh giá", reviews));
    }

    /**
     * Lấy thống kê đánh giá của phim
     */
    @GetMapping("/movie/{movieId}/stats")
    public ResponseEntity<ApiResponse<MovieRatingStats>> getMovieRatingStats(@PathVariable Long movieId) {
        MovieRatingStats stats = reviewService.getMovieRatingStats(movieId);
        return ResponseEntity.ok(ApiResponse.success("Thống kê đánh giá", stats));
    }

    /**
     * Tạo đánh giá mới (cần đăng nhập)
     */
    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @Valid @RequestBody ReviewRequest request,
            @CurrentUser UserPrincipal currentUser) {
        ReviewResponse review = reviewService.createReview(request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Đánh giá thành công", review));
    }

    /**
     * Like đánh giá
     */
    @PostMapping("/{reviewId}/like")
    public ResponseEntity<ApiResponse<ReviewResponse>> likeReview(@PathVariable Long reviewId) {
        ReviewResponse review = reviewService.likeReview(reviewId);
        return ResponseEntity.ok(ApiResponse.success("Đã thích đánh giá", review));
    }

    /**
     * Xóa đánh giá (chỉ người tạo mới được xóa)
     */
    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long reviewId,
            @CurrentUser UserPrincipal currentUser) {
        reviewService.deleteReview(reviewId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã xóa đánh giá", null));
    }
}
