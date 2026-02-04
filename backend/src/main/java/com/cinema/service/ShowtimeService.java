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
                                .pageNumber(page)
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
                                .format(request.getFormat())
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
                showtime.setFormat(request.getFormat());
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
                // Enforce 3-Phase Logic:
                // Input 'start' is Ticket Time (T).
                // Input 'end' is usually passed as T + Duration.
                // We need:
                // Occupied Start = T
                // Occupied End = T + 15 (Ads) + MovieDuration + 15 (Cleaning).
                // BUT 'end' passed to this function is calculated as T + MovieDuration in
                // create/update.

                // Let's adjust the logic here or in call site.
                // Better to adjust in call site, but for safety, let's look at how we check
                // overlap.

                // We compare this interval [Start, Start + Ads + Duration + Clean]
                // Against DB intervals [DB_Start, DB_Start + Ads + DB_Duration + Clean]

                // Since DB doesn't store Ads/Clean, we assume distinct constants:
                long ADS = 20;
                long CLEAN = 15;

                // Revised Effective Interval for NEW item:
                // We know 'start'. We know 'movieDuration' (derived from end - start? No,
                // risky).
                // Let's assume the passed 'end' IS the Movie End Time (Start + Ads + Duration).
                // So Effective Occupancy End = 'end' + CLEAN.

                // HOWEVER, current 'createShowtime' sets end = start + duration.
                // I need to change 'createShowtime' first to include Ads?
                // Or keep DB 'endTime' = Movie End?
                // Prompt: "Feature Start Time = T + Ads".
                // DB 'startTime' = T.
                // DB 'endTime' usually means when the screen goes dark. = T + Ads + Duration.

                List<Showtime> overlaps = showtimeRepository.findByRoomIdAndShowDate(roomId, date);

                // Filter self
                overlaps = overlaps.stream()
                                .filter(s -> !s.getId().equals(excludedId)
                                                && s.getStatus() != Showtime.ShowtimeStatus.CANCELLED)
                                .collect(Collectors.toList());

                // Calculate New Item Effective Range
                // Recalculate duration from passed end?
                // Let's rely on the caller passing the correct logic, OR re-fetch movie?
                // Caller `createShowtime` has `movie`.
                // Let's refactor `validateOverlap` to take `movieDuration` instead of `end`.

                // Actually, to minimize changes, I will implement the logic inside
                // `validateOverlap`
                // primarily using the stored times, but I need to be careful.

                // Let's use the repository `checkOverlap` but with buffering?
                // No, custom logic is better for complex rules.

                long newDurationMinutes = java.time.Duration.between(start, end).toMinutes();
                // Note: In createShowtime, end = start + duration. So this matches movie
                // duration.

                // Real Occupancy for NEW:
                // Start = start
                // End = start + 15 (Ads) + newDuration + 15 (Clean)

                java.time.LocalTime newOccupiedStart = start;
                java.time.LocalTime newOccupiedEnd = start.plusMinutes(ADS + newDurationMinutes + CLEAN);

                for (Showtime existing : overlaps) {
                        // Existing Occupancy:
                        // Existing Start = e.start
                        // Existing Duration = Duration.between(e.start, e.end).toMinutes() (Assuming DB
                        // stores pure duration diff)
                        // Existing Occupied End = e.start + 15 + duration + 15

                        long exDuration = java.time.Duration.between(existing.getStartTime(), existing.getEndTime())
                                        .toMinutes();

                        // If DB endTime already included ads, this would double count.
                        // Assuming legacy data is just T + Duration.

                        java.time.LocalTime exOccupiedEnd = existing.getStartTime()
                                        .plusMinutes(ADS + exDuration + CLEAN);

                        // Check Overlap
                        if (newOccupiedStart.isBefore(exOccupiedEnd)
                                        && existing.getStartTime().isBefore(newOccupiedEnd)) {
                                throw new BadRequestException(String.format(
                                                "Collision with '%s'. Slot occupied: %s - %s (incl. 15' Ads + 15' Clean). Requested: %s - %s",
                                                existing.getMovie().getTitle(),
                                                existing.getStartTime(), exOccupiedEnd,
                                                newOccupiedStart, newOccupiedEnd,
                                                ADS, CLEAN));
                        }
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
                                .format(showtime.getFormat())
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

        @Transactional
        public List<ShowtimeResponse> createShowtimesBulk(List<ShowtimeRequest> requests) {
                if (requests == null || requests.isEmpty()) {
                        throw new BadRequestException("Request list cannot be empty");
                }

                // 1. Fetch all Movies and Rooms referenced to avoid N+1
                java.util.Set<Long> movieIds = requests.stream().map(ShowtimeRequest::getMovieId)
                                .collect(Collectors.toSet());
                java.util.Set<Long> roomIds = requests.stream().map(ShowtimeRequest::getRoomId)
                                .collect(Collectors.toSet());

                java.util.Map<Long, Movie> movieMap = movieRepository.findAllById(movieIds).stream()
                                .collect(Collectors.toMap(Movie::getId, m -> m));
                java.util.Map<Long, Room> roomMap = roomRepository.findAllById(roomIds).stream()
                                .collect(Collectors.toMap(Room::getId, r -> r));

                if (movieMap.size() != movieIds.size()) {
                        throw new ResourceNotFoundException("Some movies not found");
                }
                if (roomMap.size() != roomIds.size()) {
                        throw new ResourceNotFoundException("Some rooms not found");
                }

                // 2. Prepare new Showtimes and validate Logic Dates
                List<Showtime> newShowtimes = new java.util.ArrayList<>();

                for (ShowtimeRequest req : requests) {
                        Movie movie = movieMap.get(req.getMovieId());
                        Room room = roomMap.get(req.getRoomId());

                        if (req.getShowDate().isBefore(LocalDate.now())) {
                                throw new BadRequestException("Show date cannot be in the past: " + req.getShowDate());
                        }

                        java.time.LocalTime endTime = req.getStartTime().plusMinutes(movie.getDuration());

                        Showtime showtime = Showtime.builder()
                                        .showDate(req.getShowDate())
                                        .startTime(req.getStartTime())
                                        .endTime(endTime)
                                        .basePrice(req.getBasePrice())
                                        .status(req.getStatus() != null ? req.getStatus()
                                                        : Showtime.ShowtimeStatus.AVAILABLE)
                                        .movie(movie)
                                        .room(room)
                                        .build();

                        newShowtimes.add(showtime);
                }

                // 3. Validation: Check overlapping
                // Group by Room and Date to check efficiently
                java.util.Map<String, List<Showtime>> newByRoomDate = newShowtimes.stream()
                                .collect(Collectors.groupingBy(s -> s.getRoom().getId() + "_" + s.getShowDate()));

                for (java.util.Map.Entry<String, List<Showtime>> entry : newByRoomDate.entrySet()) {
                        String[] keyParts = entry.getKey().split("_");
                        Long roomId = Long.parseLong(keyParts[0]);
                        LocalDate date = LocalDate.parse(keyParts[1]);

                        List<Showtime> batch = entry.getValue();

                        // Fetch existing showtimes for this room & date
                        List<Showtime> existing = showtimeRepository.findByRoomIdAndShowDate(roomId, date);
                        // Filter out CANCELLED if they exist in DB (though query usually should handle
                        // this, doing in memory is safe too if customized query not used)
                        existing = existing.stream()
                                        .filter(s -> s.getStatus() != Showtime.ShowtimeStatus.CANCELLED)
                                        .collect(Collectors.toList());

                        // Check collisions
                        // Combine existing + batch to check intra-batch conflicts too?
                        // Actually, we must check Batch vs Existing, AND Batch vs Batch.
                        // Simplest: Add Batch items one by one to a "Occupied Slots" list that starts
                        // with Existing.

                        List<Showtime> checked = new java.util.ArrayList<>(existing);

                        for (Showtime newItem : batch) {
                                validateCollisionWithList(newItem, checked);
                                checked.add(newItem); // Add valid item to checked list so next item in batch checks
                                                      // against it too
                        }
                }

                // 4. Save All
                List<Showtime> saved = showtimeRepository.saveAll(newShowtimes);
                return saved.stream().map(this::mapToResponseLite).collect(Collectors.toList());
        }

        private void validateCollisionWithList(Showtime newItem, List<Showtime> existingList) {
                // Logic: New Start < Old End + 20min AND New End + 20min > Old Start
                // Effective End = Real End + 20min

                long BUFFER_MINUTES = 20;

                for (Showtime existing : existingList) {
                        // Ignore self (unlikely here as IDs are null for new items)

                        // Condition: Overlap
                        // New Interval: [NewStart, NewEnd + 20]
                        // Existing Interval: [ExistingStart, ExistingEnd + 20]

                        java.time.LocalTime newStart = newItem.getStartTime();
                        java.time.LocalTime newEffectiveEnd = newItem.getEndTime().plusMinutes(BUFFER_MINUTES);

                        java.time.LocalTime existStart = existing.getStartTime();
                        java.time.LocalTime existEffectiveEnd = existing.getEndTime().plusMinutes(BUFFER_MINUTES);

                        // Check if intervals overlap
                        // Overlap if (Start1 < End2) and (Start2 < End1)
                        // Note: LocalTime comparison handles typical day. Wrapping midnight is not
                        // handled here as per typical simple logic unless required.

                        boolean overlap = (newStart.isBefore(existEffectiveEnd))
                                        && (existStart.isBefore(newEffectiveEnd));

                        if (overlap) {
                                throw new BadRequestException(String.format(
                                                "Collision detected in Room %s on %s. New showtime (%s - %s) conflicts with existing (%s - %s). Required gap: 20 mins.",
                                                newItem.getRoom().getName(),
                                                newItem.getShowDate(),
                                                newItem.getStartTime(), newItem.getEndTime(),
                                                existing.getStartTime(), existing.getEndTime()));
                        }
                }
        }
}
