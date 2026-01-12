package com.cinema.service;

import com.cinema.config.TmdbConfig;
import com.cinema.dto.tmdb.*;
import com.cinema.model.Movie;
import com.cinema.model.Movie.MovieStatus;
import com.cinema.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TmdbService {

    private final RestTemplate restTemplate;
    private final TmdbConfig tmdbConfig;
    private final MovieRepository movieRepository;

    // Cache genres
    private Map<Integer, String> genreMap = new HashMap<>();

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.setBearerAuth(tmdbConfig.getApiToken());
        return headers;
    }

    /**
     * Load genre mapping from TMDB
     */
    public void loadGenres() {
        try {
            String url = tmdbConfig.getApiUrl() + "/genre/movie/list?language=vi-VN";
            HttpEntity<String> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<TmdbGenreListResponse> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, TmdbGenreListResponse.class
            );

            if (response.getBody() != null && response.getBody().getGenres() != null) {
                genreMap = response.getBody().getGenres().stream()
                    .collect(Collectors.toMap(TmdbGenreDto::getId, TmdbGenreDto::getName));
                log.info("Loaded {} genres from TMDB", genreMap.size());
            }
        } catch (Exception e) {
            log.error("Error loading genres from TMDB: {}", e.getMessage());
        }
    }

    /**
     * Get now playing movies from TMDB
     */
    public TmdbMovieListResponse getNowPlayingMovies(int page) {
        String url = String.format("%s/movie/now_playing?language=vi-VN&page=%d&region=VN",
            tmdbConfig.getApiUrl(), page);
        return fetchMovieList(url);
    }

    /**
     * Get upcoming movies from TMDB
     */
    public TmdbMovieListResponse getUpcomingMovies(int page) {
        String url = String.format("%s/movie/upcoming?language=vi-VN&page=%d&region=VN",
            tmdbConfig.getApiUrl(), page);
        return fetchMovieList(url);
    }

    /**
     * Get popular movies from TMDB
     */
    public TmdbMovieListResponse getPopularMovies(int page) {
        String url = String.format("%s/movie/popular?language=vi-VN&page=%d&region=VN",
            tmdbConfig.getApiUrl(), page);
        return fetchMovieList(url);
    }

    /**
     * Get top rated movies from TMDB
     */
    public TmdbMovieListResponse getTopRatedMovies(int page) {
        String url = String.format("%s/movie/top_rated?language=vi-VN&page=%d&region=VN",
            tmdbConfig.getApiUrl(), page);
        return fetchMovieList(url);
    }

    /**
     * Discover movies released in a specific year (for getting old movies)
     */
    public TmdbMovieListResponse discoverMoviesByYear(int year, int page) {
        String url = String.format("%s/discover/movie?language=vi-VN&page=%d&sort_by=popularity.desc&primary_release_year=%d&vote_count.gte=100",
            tmdbConfig.getApiUrl(), page, year);
        return fetchMovieList(url);
    }

    /**
     * Discover movies released between date range (for getting ended/old movies)
     * @param startDate format: yyyy-MM-dd
     * @param endDate format: yyyy-MM-dd
     */
    public TmdbMovieListResponse discoverMoviesByDateRange(String startDate, String endDate, int page) {
        String url = String.format("%s/discover/movie?language=vi-VN&page=%d&sort_by=popularity.desc&primary_release_date.gte=%s&primary_release_date.lte=%s&vote_count.gte=50",
            tmdbConfig.getApiUrl(), page, startDate, endDate);
        return fetchMovieList(url);
    }

    /**
     * Get ended/old movies (released more than 2 months ago)
     */
    public TmdbMovieListResponse getEndedMovies(int page) {
        LocalDate now = LocalDate.now();
        LocalDate endDate = now.minusMonths(2);
        LocalDate startDate = now.minusYears(2); // Lấy phim trong 2 năm gần đây
        
        String url = String.format("%s/discover/movie?language=vi-VN&page=%d&sort_by=popularity.desc&primary_release_date.gte=%s&primary_release_date.lte=%s&vote_count.gte=100",
            tmdbConfig.getApiUrl(), page, startDate.toString(), endDate.toString());
        return fetchMovieList(url);
    }

    /**
     * Get movie details from TMDB
     */
    public TmdbMovieDto getMovieDetails(Long tmdbId) {
        try {
            String url = String.format("%s/movie/%d?language=vi-VN",
                tmdbConfig.getApiUrl(), tmdbId);
            HttpEntity<String> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<TmdbMovieDto> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, TmdbMovieDto.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error fetching movie details for ID {}: {}", tmdbId, e.getMessage());
            return null;
        }
    }

    /**
     * Get movie videos (trailers) from TMDB
     */
    public TmdbVideoResponse getMovieVideos(Long tmdbId) {
        try {
            String url = String.format("%s/movie/%d/videos?language=vi-VN",
                tmdbConfig.getApiUrl(), tmdbId);
            HttpEntity<String> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<TmdbVideoResponse> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, TmdbVideoResponse.class
            );
            
            // If no Vietnamese videos, try English
            if (response.getBody() == null || response.getBody().getResults() == null 
                || response.getBody().getResults().isEmpty()) {
                url = String.format("%s/movie/%d/videos?language=en-US", tmdbConfig.getApiUrl(), tmdbId);
                response = restTemplate.exchange(url, HttpMethod.GET, entity, TmdbVideoResponse.class);
            }
            
            return response.getBody();
        } catch (Exception e) {
            log.error("Error fetching videos for movie ID {}: {}", tmdbId, e.getMessage());
            return null;
        }
    }

    /**
     * Get movie credits (cast & crew) from TMDB
     */
    public TmdbCreditsResponse getMovieCredits(Long tmdbId) {
        try {
            String url = String.format("%s/movie/%d/credits?language=vi-VN",
                tmdbConfig.getApiUrl(), tmdbId);
            HttpEntity<String> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<TmdbCreditsResponse> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, TmdbCreditsResponse.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error fetching credits for movie ID {}: {}", tmdbId, e.getMessage());
            return null;
        }
    }

    /**
     * Sync movies from TMDB to local database
     */
    @Transactional
    public Map<String, Object> syncMovies(String type, int pages) {
        if (genreMap.isEmpty()) {
            loadGenres();
        }

        int imported = 0;
        int updated = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();

        for (int page = 1; page <= pages; page++) {
            TmdbMovieListResponse movieList;
            
            switch (type.toLowerCase()) {
                case "now_playing":
                    movieList = getNowPlayingMovies(page);
                    break;
                case "upcoming":
                    movieList = getUpcomingMovies(page);
                    break;
                case "popular":
                    movieList = getPopularMovies(page);
                    break;
                case "top_rated":
                    movieList = getTopRatedMovies(page);
                    break;
                case "ended":
                    movieList = getEndedMovies(page);
                    break;
                default:
                    movieList = getNowPlayingMovies(page);
            }

            if (movieList == null || movieList.getResults() == null) {
                errors.add("Failed to fetch page " + page);
                continue;
            }

            for (TmdbMovieDto tmdbMovie : movieList.getResults()) {
                try {
                    Movie movie = convertAndSaveMovie(tmdbMovie, type);
                    if (movie != null) {
                        if (movie.getId() == null) {
                            imported++;
                        } else {
                            updated++;
                        }
                    }
                } catch (Exception e) {
                    failed++;
                    errors.add("Failed to import movie: " + tmdbMovie.getTitle() + " - " + e.getMessage());
                    log.error("Error importing movie {}: {}", tmdbMovie.getTitle(), e.getMessage());
                }
            }

            // Rate limiting - sleep between pages
            try {
                Thread.sleep(250);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("imported", imported);
        result.put("updated", updated);
        result.put("failed", failed);
        result.put("errors", errors);
        return result;
    }

    /**
     * Sync a single movie by TMDB ID
     */
    @Transactional
    public Movie syncMovieById(Long tmdbId) {
        if (genreMap.isEmpty()) {
            loadGenres();
        }

        TmdbMovieDto tmdbMovie = getMovieDetails(tmdbId);
        if (tmdbMovie == null) {
            throw new RuntimeException("Movie not found on TMDB with ID: " + tmdbId);
        }

        return convertAndSaveMovie(tmdbMovie, "manual");
    }

    /**
     * Sync movies by year from TMDB
     */
    @Transactional
    public Map<String, Object> syncMoviesByYear(int year, int pages) {
        if (genreMap.isEmpty()) {
            loadGenres();
        }

        int imported = 0;
        int updated = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();

        for (int page = 1; page <= pages; page++) {
            TmdbMovieListResponse movieList = discoverMoviesByYear(year, page);

            if (movieList == null || movieList.getResults() == null) {
                errors.add("Failed to fetch page " + page);
                continue;
            }

            for (TmdbMovieDto tmdbMovie : movieList.getResults()) {
                try {
                    Movie movie = convertAndSaveMovie(tmdbMovie, "year_" + year);
                    if (movie != null) {
                        if (movie.getId() == null) {
                            imported++;
                        } else {
                            updated++;
                        }
                    }
                } catch (Exception e) {
                    failed++;
                    errors.add("Failed to import movie: " + tmdbMovie.getTitle() + " - " + e.getMessage());
                    log.error("Error importing movie {}: {}", tmdbMovie.getTitle(), e.getMessage());
                }
            }

            // Rate limiting
            try {
                Thread.sleep(250);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("year", year);
        result.put("imported", imported);
        result.put("updated", updated);
        result.put("failed", failed);
        result.put("errors", errors);
        return result;
    }

    /**
     * Convert TMDB movie to local Movie entity and save
     */
    private Movie convertAndSaveMovie(TmdbMovieDto tmdbMovie, String importType) {
        // Get detailed movie info
        TmdbMovieDto details = getMovieDetails(tmdbMovie.getId());
        if (details == null) {
            details = tmdbMovie;
        }
        
        // Create final reference for lambda
        final TmdbMovieDto movieDetails = details;

        // Check if movie already exists (by title and release date)
        Optional<Movie> existingMovie = movieRepository.findAll().stream()
            .filter(m -> m.getTitle().equalsIgnoreCase(movieDetails.getTitle()))
            .findFirst();

        Movie movie = existingMovie.orElse(new Movie());

        // Basic info
        movie.setTitle(movieDetails.getTitle());
        movie.setDescription(movieDetails.getOverview());
        movie.setDuration(movieDetails.getRuntime() != null ? movieDetails.getRuntime() : 120);
        movie.setRating(movieDetails.getVoteAverage() != null ? movieDetails.getVoteAverage() : 0.0);

        // Poster
        if (movieDetails.getPosterPath() != null) {
            movie.setPosterUrl(tmdbConfig.getImageBaseUrl() + movieDetails.getPosterPath());
        }

        // Release date
        if (movieDetails.getReleaseDate() != null && !movieDetails.getReleaseDate().isEmpty()) {
            try {
                LocalDate releaseDate = LocalDate.parse(movieDetails.getReleaseDate(), 
                    DateTimeFormatter.ISO_DATE);
                movie.setReleaseDate(releaseDate);
                
                // Set status based on release date
                LocalDate now = LocalDate.now();
                if (releaseDate.isAfter(now)) {
                    movie.setStatus(MovieStatus.COMING_SOON);
                } else if (releaseDate.plusMonths(2).isAfter(now)) {
                    movie.setStatus(MovieStatus.NOW_SHOWING);
                } else {
                    movie.setStatus(MovieStatus.ENDED);
                }
            } catch (Exception e) {
                movie.setStatus(MovieStatus.NOW_SHOWING);
            }
        } else {
            movie.setStatus(MovieStatus.NOW_SHOWING);
        }

        // Genres
        String genres = "";
        if (movieDetails.getGenres() != null && !movieDetails.getGenres().isEmpty()) {
            genres = movieDetails.getGenres().stream()
                .map(TmdbGenreDto::getName)
                .collect(Collectors.joining(", "));
        } else if (movieDetails.getGenreIds() != null && !movieDetails.getGenreIds().isEmpty()) {
            genres = movieDetails.getGenreIds().stream()
                .map(id -> genreMap.getOrDefault(id, ""))
                .filter(name -> !name.isEmpty())
                .collect(Collectors.joining(", "));
        }
        movie.setGenre(genres);

        // Language
        if (movieDetails.getSpokenLanguages() != null && !movieDetails.getSpokenLanguages().isEmpty()) {
            movie.setLanguage(movieDetails.getSpokenLanguages().stream()
                .map(TmdbLanguageDto::getName)
                .collect(Collectors.joining(", ")));
        } else {
            movie.setLanguage(movieDetails.getOriginalLanguage());
        }

        // Get credits for director and actors
        TmdbCreditsResponse credits = getMovieCredits(tmdbMovie.getId());
        if (credits != null) {
            // Director
            if (credits.getCrew() != null) {
                String directors = credits.getCrew().stream()
                    .filter(c -> "Director".equals(c.getJob()))
                    .map(TmdbCrewDto::getName)
                    .limit(3)
                    .collect(Collectors.joining(", "));
                movie.setDirector(directors);
            }

            // Actors (top 5)
            if (credits.getCast() != null) {
                String actors = credits.getCast().stream()
                    .sorted(Comparator.comparingInt(TmdbCastDto::getOrder))
                    .limit(5)
                    .map(TmdbCastDto::getName)
                    .collect(Collectors.joining(", "));
                movie.setActors(actors);
            }
        }

        // Get trailer
        TmdbVideoResponse videos = getMovieVideos(tmdbMovie.getId());
        if (videos != null && videos.getResults() != null && !videos.getResults().isEmpty()) {
            // Find official trailer on YouTube
            Optional<TmdbVideoDto> trailer = videos.getResults().stream()
                .filter(v -> "YouTube".equals(v.getSite()))
                .filter(v -> "Trailer".equals(v.getType()) || "Teaser".equals(v.getType()))
                .filter(v -> Boolean.TRUE.equals(v.getOfficial()))
                .findFirst();
            
            // If no official trailer, get any YouTube trailer
            if (trailer.isEmpty()) {
                trailer = videos.getResults().stream()
                    .filter(v -> "YouTube".equals(v.getSite()))
                    .filter(v -> "Trailer".equals(v.getType()) || "Teaser".equals(v.getType()))
                    .findFirst();
            }

            trailer.ifPresent(t -> movie.setTrailerUrl("https://www.youtube.com/watch?v=" + t.getKey()));
        }

        // Age rating (TMDB doesn't provide this directly, set default)
        if (Boolean.TRUE.equals(details.getAdult())) {
            movie.setAgeRating("18+");
        } else {
            movie.setAgeRating("P");
        }

        // Save movie
        return movieRepository.save(movie);
    }

    private TmdbMovieListResponse fetchMovieList(String url) {
        try {
            HttpEntity<String> entity = new HttpEntity<>(createHeaders());
            ResponseEntity<TmdbMovieListResponse> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, TmdbMovieListResponse.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error fetching movie list from TMDB: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Search movies on TMDB
     */
    public TmdbMovieListResponse searchMovies(String query, int page) {
        try {
            String url = String.format("%s/search/movie?query=%s&language=vi-VN&page=%d",
                tmdbConfig.getApiUrl(), query, page);
            return fetchMovieList(url);
        } catch (Exception e) {
            log.error("Error searching movies on TMDB: {}", e.getMessage());
            return null;
        }
    }
}
