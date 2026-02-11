package com.cinema.controller;

import com.cinema.dto.response.ApiResponse;
import com.cinema.dto.response.MovieResponse;
import com.cinema.dto.response.PageResponse;
import com.cinema.service.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/movies")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminMovieController {

    private final MovieService movieService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<MovieResponse>>> getMovies(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) com.cinema.model.Movie.MovieStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "releaseDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PageResponse<MovieResponse> response = movieService.getAllMovies(search, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MovieResponse>> getMovieById(@PathVariable Long id) {
        MovieResponse movie = movieService.getMovieById(id);
        return ResponseEntity.ok(ApiResponse.success(movie));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MovieResponse>> createMovie(
            @RequestBody com.cinema.dto.request.MovieRequest request) {
        MovieResponse movie = movieService.createMovie(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Movie created", movie));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MovieResponse>> updateMovie(@PathVariable Long id,
            @RequestBody com.cinema.dto.request.MovieRequest request) {
        MovieResponse movie = movieService.updateMovie(id, request);
        return ResponseEntity.ok(ApiResponse.success("Movie updated", movie));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMovie(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.ok(ApiResponse.success("Movie deleted", null));
    }
}
