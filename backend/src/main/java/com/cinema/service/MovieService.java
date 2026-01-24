package com.cinema.service;

import com.cinema.dto.request.MovieRequest;
import com.cinema.dto.response.MovieResponse;
import com.cinema.dto.response.PageResponse;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.Movie;
import com.cinema.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final ModelMapper modelMapper;

    public PageResponse<MovieResponse> getAllMovies(String keyword, Movie.MovieStatus status, Pageable pageable) {
        Page<Movie> movies = movieRepository.searchAndFilterMovies(keyword, status, pageable);
        return createPageResponse(movies);
    }

    public PageResponse<MovieResponse> getAllMovies(Pageable pageable) {
        Page<Movie> movies = movieRepository.findAll(pageable);
        return createPageResponse(movies);
    }

    public PageResponse<MovieResponse> getMoviesByStatus(Movie.MovieStatus status, Pageable pageable) {
        Page<Movie> movies = movieRepository.findByStatus(status, pageable);
        return createPageResponse(movies);
    }

    public List<MovieResponse> getNowShowingMovies() {
        List<Movie> movies = movieRepository.findNowShowingMovies(Movie.MovieStatus.NOW_SHOWING, LocalDate.now());
        return movies.stream()
                .map(movie -> modelMapper.map(movie, MovieResponse.class))
                .collect(Collectors.toList());
    }

    public PageResponse<MovieResponse> getNowShowingMoviesPaged(Pageable pageable) {
        Page<Movie> movies = movieRepository.findByStatus(Movie.MovieStatus.NOW_SHOWING, pageable);
        return createPageResponse(movies);
    }

    public List<MovieResponse> getComingSoonMovies() {
        List<Movie> movies = movieRepository.findByStatusOrderByReleaseDateDesc(Movie.MovieStatus.COMING_SOON);
        return movies.stream()
                .map(movie -> modelMapper.map(movie, MovieResponse.class))
                .collect(Collectors.toList());
    }

    public PageResponse<MovieResponse> getComingSoonMoviesPaged(Pageable pageable) {
        Page<Movie> movies = movieRepository.findByStatus(Movie.MovieStatus.COMING_SOON, pageable);
        return createPageResponse(movies);
    }

    public List<MovieResponse> getEndedMovies() {
        List<Movie> movies = movieRepository.findByStatusOrderByReleaseDateDesc(Movie.MovieStatus.ENDED);
        return movies.stream()
                .map(movie -> modelMapper.map(movie, MovieResponse.class))
                .collect(Collectors.toList());
    }

    public PageResponse<MovieResponse> getEndedMoviesPaged(Pageable pageable) {
        Page<Movie> movies = movieRepository.findByStatus(Movie.MovieStatus.ENDED, pageable);
        return createPageResponse(movies);
    }

    public MovieResponse getMovieById(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", "id", id));
        return modelMapper.map(movie, MovieResponse.class);
    }

    public PageResponse<MovieResponse> searchMovies(String keyword, Pageable pageable) {
        Page<Movie> movies = movieRepository.searchMovies(keyword, pageable);
        return createPageResponse(movies);
    }

    @Transactional
    public MovieResponse createMovie(MovieRequest request) {
        Movie movie = Movie.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .duration(request.getDuration())
                .director(request.getDirector())
                .actors(request.getActors())
                .genre(request.getGenre())
                .language(request.getLanguage())
                .releaseDate(request.getReleaseDate())
                .endDate(request.getEndDate())
                .posterUrl(request.getPosterUrl())
                .trailerUrl(request.getTrailerUrl())
                .ageRating(request.getAgeRating())
                .rating(request.getRating())
                .status(request.getStatus() != null ? request.getStatus() : Movie.MovieStatus.COMING_SOON)
                .build();

        movie = movieRepository.save(movie);
        return modelMapper.map(movie, MovieResponse.class);
    }

    @Transactional
    public MovieResponse updateMovie(Long id, MovieRequest request) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", "id", id));

        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setDuration(request.getDuration());
        movie.setDirector(request.getDirector());
        movie.setActors(request.getActors());
        movie.setGenre(request.getGenre());
        movie.setLanguage(request.getLanguage());
        movie.setReleaseDate(request.getReleaseDate());
        movie.setEndDate(request.getEndDate());
        movie.setPosterUrl(request.getPosterUrl());
        movie.setTrailerUrl(request.getTrailerUrl());
        movie.setAgeRating(request.getAgeRating());
        movie.setRating(request.getRating());
        if (request.getStatus() != null) {
            movie.setStatus(request.getStatus());
        }

        movie = movieRepository.save(movie);
        return modelMapper.map(movie, MovieResponse.class);
    }

    @Transactional
    public void deleteMovie(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", "id", id));
        movieRepository.delete(movie);
    }

    public List<String> getAllGenres() {
        return movieRepository.findAllGenres();
    }

    private PageResponse<MovieResponse> createPageResponse(Page<Movie> movies) {
        List<MovieResponse> content = movies.getContent().stream()
                .map(movie -> modelMapper.map(movie, MovieResponse.class))
                .collect(Collectors.toList());

        return PageResponse.<MovieResponse>builder()
                .content(content)
                .pageNumber(movies.getNumber())
                .pageSize(movies.getSize())
                .totalElements(movies.getTotalElements())
                .totalPages(movies.getTotalPages())
                .last(movies.isLast())
                .first(movies.isFirst())
                .build();
    }
}
