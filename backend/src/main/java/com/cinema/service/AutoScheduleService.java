package com.cinema.service;

import com.cinema.dto.request.AutoScheduleRequest;
import com.cinema.dto.response.AutoSchedulePreviewResponse;
import com.cinema.dto.response.AutoSchedulePreviewResponse.*;
import com.cinema.dto.response.AutoScheduleResult;
import com.cinema.exception.BadRequestException;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.model.*;
import com.cinema.repository.MovieRepository;
import com.cinema.repository.RoomRepository;
import com.cinema.repository.ShowtimeRepository;
import com.cinema.repository.ScheduleTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AutoScheduleService {

    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final RoomRepository roomRepository;
    private final ScheduleTemplateRepository templateRepository;
    private final AuditLogService auditLogService;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // =====================================================================
    //  PREVIEW — generate a draft schedule WITHOUT persisting to DB
    // =====================================================================
    public AutoSchedulePreviewResponse preview(AutoScheduleRequest request) {
        validateRequest(request);
        return generateSchedule(request);
    }

    // =====================================================================
    //  EXECUTE — generate schedule AND persist all non-conflicting showtimes
    // =====================================================================
    @Transactional
    public AutoScheduleResult execute(AutoScheduleRequest request) {
        validateRequest(request);
        AutoSchedulePreviewResponse preview = generateSchedule(request);

        List<Showtime> toSave = new ArrayList<>();

        for (TheaterSchedulePreview theaterP : preview.getByTheater()) {
            for (DateSchedulePreview dateP : theaterP.getByDate()) {
                for (SlotPreview slot : dateP.getSlots()) {
                    Movie movie = movieRepository.getReferenceById(slot.getMovieId());
                    Room room = roomRepository.getReferenceById(slot.getRoomId());

                    Showtime showtime = Showtime.builder()
                            .showDate(dateP.getDate())
                            .startTime(slot.getStartTime())
                            .endTime(slot.getEndTime())
                            .basePrice(BigDecimal.ZERO) // pricing determined by PriceLine system
                            .format(slot.getFormat() != null ? slot.getFormat() : "2D_SUB")
                            .status(Showtime.ShowtimeStatus.AVAILABLE)
                            .movie(movie)
                            .room(room)
                            .build();
                    toSave.add(showtime);
                }
            }
        }

        if (!toSave.isEmpty()) {
            showtimeRepository.saveAll(toSave);
        }

        String theaterNames = preview.getByTheater().stream()
                .map(TheaterSchedulePreview::getTheaterName)
                .collect(Collectors.joining(", "));

        String detailMsg = String.format(
                "Auto-schedule cho [%s] từ %s đến %s. Tạo %d suất chiếu, bỏ qua %d xung đột.",
                theaterNames, request.getStartDate(), request.getEndDate(),
                preview.getTotalShowtimes(), preview.getTotalConflictsSkipped());

        // Explicit audit log with rich details
        auditLogService.log("AUTO_SCHEDULE", "Showtime",
                null, detailMsg, null, request);

        log.info("Auto-schedule executed: {}", detailMsg);

        return AutoScheduleResult.builder()
                .totalCreated(preview.getTotalShowtimes())
                .totalSkipped(preview.getTotalConflictsSkipped())
                .totalTheaters(preview.getByTheater().size())
                .totalDays((int) request.getStartDate().datesUntil(request.getEndDate().plusDays(1)).count())
                .message(detailMsg)
                .conflicts(preview.getConflicts())
                .build();
    }

    // =====================================================================
    //  CORE ALGORITHM — greedy slot-filling with collision + DCP checks
    // =====================================================================
    private AutoSchedulePreviewResponse generateSchedule(AutoScheduleRequest request) {
        // 1. Load templates
        Map<ScheduleTemplate.DayType, ScheduleTemplate> templateMap = resolveTemplates(request);

        // 2. Load movies sorted by priority DESC, then rating DESC
        List<MovieWithPriority> sortedMovies = loadAndSortMovies(request.getMovieSelections());
        if (sortedMovies.isEmpty()) {
            throw new BadRequestException("Không tìm thấy phim nào hợp lệ trong danh sách đã chọn");
        }

        // 3. Load rooms per theater
        Map<Long, List<Room>> roomsByTheater = loadRoomsByTheater(request.getTheaterIds());

        // 4. Load existing showtimes → occupancy map
        Map<String, List<TimeInterval>> occupancyMap = buildOccupancyMap(
                request.getTheaterIds(), request.getStartDate(), request.getEndDate());

        // 5. Build holiday set
        Set<LocalDate> holidays = request.getHolidayDates() != null
                ? new HashSet<>(request.getHolidayDates()) : Collections.emptySet();

        // 6. Iterate and fill slots
        List<TheaterSchedulePreview> byTheater = new ArrayList<>();
        List<ConflictDetail> allConflicts = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        int totalShowtimes = 0;

        for (Long theaterId : request.getTheaterIds()) {
            List<Room> rooms = roomsByTheater.getOrDefault(theaterId, Collections.emptyList());
            if (rooms.isEmpty()) {
                warnings.add("Rạp ID " + theaterId + " không có phòng chiếu hoạt động");
                continue;
            }

            String theaterName = rooms.get(0).getTheater().getName();
            List<DateSchedulePreview> byDate = new ArrayList<>();

            List<LocalDate> dates = request.getStartDate()
                    .datesUntil(request.getEndDate().plusDays(1))
                    .collect(Collectors.toList());

            for (LocalDate date : dates) {
                ScheduleTemplate.DayType dayType = determineDayType(date, holidays);
                ScheduleTemplate template = templateMap.get(dayType);
                if (template == null) {
                    warnings.add(String.format("Không có template cho %s (ngày %s) tại rạp %s",
                            dayType, date, theaterName));
                    continue;
                }

                int adsMin = template.getAdsMinutes();
                int cleanMin = template.getCleaningMinutes();
                int bufferMin = template.getBufferMinutes();

                List<SlotPreview> dateSlots = new ArrayList<>();

                // For each time slot in the template, assign a movie to each room
                for (ScheduleTemplateSlot templateSlot : template.getSlots()) {
                    LocalTime slotStart = templateSlot.getStartTime();

                    for (Room room : rooms) {
                        // Try each movie in priority order
                        boolean assigned = false;

                        for (MovieWithPriority mwp : sortedMovies) {
                            Movie movie = mwp.movie;

                            // Check exclusion
                            if (isExcluded(room, mwp.selection)) continue;

                            // Check room type preference
                            if (!matchesRoomType(room, mwp.selection)) continue;

                            // Calculate effective times
                            LocalTime effectiveStart = slotStart;
                            LocalTime showEnd = slotStart.plusMinutes(adsMin + movie.getDuration());
                            LocalTime effectiveEnd = showEnd.plusMinutes(cleanMin + bufferMin);

                            // Collision check: room occupancy
                            String occKey = room.getId() + "_" + date;
                            List<TimeInterval> occupied = occupancyMap.computeIfAbsent(occKey, k -> new ArrayList<>());

                            if (hasCollision(effectiveStart, effectiveEnd, occupied)) {
                                allConflicts.add(ConflictDetail.builder()
                                        .theaterId(theaterId)
                                        .theaterName(theaterName)
                                        .roomId(room.getId())
                                        .roomName(room.getName())
                                        .date(date)
                                        .slotTime(slotStart)
                                        .movieTitle(movie.getTitle())
                                        .reason("Phòng " + room.getName() + " đã có suất chiếu trong khung giờ " +
                                                effectiveStart.format(TIME_FMT) + "-" + effectiveEnd.format(TIME_FMT))
                                        .build());
                                continue;
                            }

                            // DCP check: concurrent screenings of same movie
                            int concurrentCount = countConcurrentScreenings(
                                    movie.getId(), date, effectiveStart, showEnd,
                                    occupancyMap, request.getTheaterIds(), roomsByTheater);
                            if (concurrentCount >= request.getMaxConcurrentScreenings()) {
                                allConflicts.add(ConflictDetail.builder()
                                        .theaterId(theaterId)
                                        .theaterName(theaterName)
                                        .roomId(room.getId())
                                        .roomName(room.getName())
                                        .date(date)
                                        .slotTime(slotStart)
                                        .movieTitle(movie.getTitle())
                                        .reason("Đã đạt giới hạn " + request.getMaxConcurrentScreenings() +
                                                " phòng chiếu đồng thời cho phim \"" + movie.getTitle() + "\"")
                                        .build());
                                continue;
                            }

                            // ASSIGN: add to draft
                            dateSlots.add(SlotPreview.builder()
                                    .roomId(room.getId())
                                    .roomName(room.getName())
                                    .roomType(room.getRoomType().name())
                                    .movieId(movie.getId())
                                    .movieTitle(movie.getTitle())
                                    .movieDuration(movie.getDuration())
                                    .startTime(slotStart)
                                    .endTime(showEnd)
                                    .format(deriveFormat(room))
                                    .build());

                            // Update occupancy map
                            occupied.add(new TimeInterval(effectiveStart, effectiveEnd, movie.getId(), movie.getTitle()));
                            assigned = true;
                            totalShowtimes++;
                            break; // Move to next room
                        }

                        if (!assigned) {
                            warnings.add(String.format("Không thể xếp phim cho phòng %s, rạp %s, ngày %s lúc %s",
                                    room.getName(), theaterName, date, slotStart.format(TIME_FMT)));
                        }
                    }
                }

                if (!dateSlots.isEmpty()) {
                    byDate.add(DateSchedulePreview.builder()
                            .date(date)
                            .dayType(dayType.name())
                            .showtimeCount(dateSlots.size())
                            .slots(dateSlots)
                            .build());
                }
            }

            if (!byDate.isEmpty()) {
                int theaterTotal = byDate.stream().mapToInt(DateSchedulePreview::getShowtimeCount).sum();
                byTheater.add(TheaterSchedulePreview.builder()
                        .theaterId(theaterId)
                        .theaterName(theaterName)
                        .showtimeCount(theaterTotal)
                        .byDate(byDate)
                        .build());
            }
        }

        return AutoSchedulePreviewResponse.builder()
                .totalShowtimes(totalShowtimes)
                .totalConflictsSkipped(allConflicts.size())
                .totalWarnings(warnings.size())
                .byTheater(byTheater)
                .conflicts(allConflicts)
                .warnings(warnings)
                .build();
    }

    // =====================================================================
    //  HELPERS
    // =====================================================================

    private void validateRequest(AutoScheduleRequest request) {
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new BadRequestException("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
        }
        long days = request.getStartDate().datesUntil(request.getEndDate().plusDays(1)).count();
        if (days > 30) {
            throw new BadRequestException("Khoảng thời gian tối đa là 30 ngày");
        }
        if (request.getTemplateId() == null && request.getWeekdayTemplateId() == null
                && request.getWeekendTemplateId() == null && request.getHolidayTemplateId() == null) {
            throw new BadRequestException("Phải chọn ít nhất 1 template");
        }
    }

    /**
     * Resolves templates for each day type: specific overrides take priority over the default templateId.
     */
    private Map<ScheduleTemplate.DayType, ScheduleTemplate> resolveTemplates(AutoScheduleRequest request) {
        Map<ScheduleTemplate.DayType, ScheduleTemplate> map = new EnumMap<>(ScheduleTemplate.DayType.class);

        // Default template applies to all day types unless overridden
        ScheduleTemplate defaultTemplate = null;
        if (request.getTemplateId() != null) {
            defaultTemplate = templateRepository.findByIdWithSlots(request.getTemplateId())
                    .orElseThrow(() -> new ResourceNotFoundException("Template mặc định không tồn tại: " + request.getTemplateId()));
            for (ScheduleTemplate.DayType dt : ScheduleTemplate.DayType.values()) {
                map.put(dt, defaultTemplate);
            }
        }

        // Override per day type
        if (request.getWeekdayTemplateId() != null) {
            map.put(ScheduleTemplate.DayType.WEEKDAY,
                    templateRepository.findByIdWithSlots(request.getWeekdayTemplateId())
                            .orElseThrow(() -> new ResourceNotFoundException("Template ngày thường không tồn tại")));
        }
        if (request.getWeekendTemplateId() != null) {
            map.put(ScheduleTemplate.DayType.WEEKEND,
                    templateRepository.findByIdWithSlots(request.getWeekendTemplateId())
                            .orElseThrow(() -> new ResourceNotFoundException("Template cuối tuần không tồn tại")));
        }
        if (request.getHolidayTemplateId() != null) {
            map.put(ScheduleTemplate.DayType.HOLIDAY,
                    templateRepository.findByIdWithSlots(request.getHolidayTemplateId())
                            .orElseThrow(() -> new ResourceNotFoundException("Template ngày lễ không tồn tại")));
        }

        return map;
    }

    private List<MovieWithPriority> loadAndSortMovies(List<AutoScheduleRequest.MovieSelection> selections) {
        List<MovieWithPriority> result = new ArrayList<>();
        for (AutoScheduleRequest.MovieSelection sel : selections) {
            Movie movie = movieRepository.findById(sel.getMovieId()).orElse(null);
            if (movie == null) continue;
            if (movie.getStatus() != Movie.MovieStatus.NOW_SHOWING) continue;
            result.add(new MovieWithPriority(movie, sel));
        }
        // Sort: priority DESC, then rating DESC (null ratings treated as 0)
        result.sort((a, b) -> {
            int pc = Integer.compare(b.selection.getPriority(), a.selection.getPriority());
            if (pc != 0) return pc;
            double rA = a.movie.getRating() != null ? a.movie.getRating() : 0;
            double rB = b.movie.getRating() != null ? b.movie.getRating() : 0;
            return Double.compare(rB, rA);
        });
        return result;
    }

    private Map<Long, List<Room>> loadRoomsByTheater(List<Long> theaterIds) {
        Map<Long, List<Room>> map = new LinkedHashMap<>();
        for (Long theaterId : theaterIds) {
            List<Room> rooms = roomRepository.findByTheaterIdAndActiveTrue(theaterId);
            // Sort: premium rooms first (IMAX_3D > IMAX > VIP_4DX > STANDARD_3D > STANDARD_2D)
            rooms.sort(Comparator.comparingInt(r -> -roomTypePriority(r.getRoomType())));
            map.put(theaterId, rooms);
        }
        return map;
    }

    private int roomTypePriority(Room.RoomType type) {
        return switch (type) {
            case IMAX_3D -> 5;
            case IMAX -> 4;
            case VIP_4DX -> 3;
            case STANDARD_3D -> 2;
            case STANDARD_2D -> 1;
        };
    }

    /**
     * Builds the initial occupancy map from existing (non-cancelled) showtimes in the DB
     */
    private Map<String, List<TimeInterval>> buildOccupancyMap(
            List<Long> theaterIds, LocalDate startDate, LocalDate endDate) {

        Map<String, List<TimeInterval>> map = new HashMap<>();
        List<Showtime> existing = showtimeRepository.findByTheaterIdsAndDateRange(theaterIds, startDate, endDate);

        for (Showtime s : existing) {
            String key = s.getRoom().getId() + "_" + s.getShowDate();
            // Include cleaning buffer: endTime + 15 min as safety
            LocalTime effectiveEnd = s.getEndTime().plusMinutes(15);
            map.computeIfAbsent(key, k -> new ArrayList<>())
                    .add(new TimeInterval(s.getStartTime(), effectiveEnd,
                            s.getMovie().getId(), s.getMovie().getTitle()));
        }

        return map;
    }

    private ScheduleTemplate.DayType determineDayType(LocalDate date, Set<LocalDate> holidays) {
        if (holidays.contains(date)) return ScheduleTemplate.DayType.HOLIDAY;
        DayOfWeek dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) return ScheduleTemplate.DayType.WEEKEND;
        return ScheduleTemplate.DayType.WEEKDAY;
    }

    /**
     * Standard interval overlap check: two intervals [s1, e1) and [s2, e2) overlap iff s1 < e2 && s2 < e1
     */
    private boolean hasCollision(LocalTime start, LocalTime end, List<TimeInterval> occupied) {
        for (TimeInterval occ : occupied) {
            if (start.isBefore(occ.end) && occ.start.isBefore(end)) {
                return true;
            }
        }
        return false;
    }

    /**
     * DCP constraint: count how many rooms are screening the same movie at an overlapping time
     * across all selected theaters (both existing DB entries and newly assigned slots in this batch)
     */
    private int countConcurrentScreenings(Long movieId, LocalDate date,
                                           LocalTime start, LocalTime end,
                                           Map<String, List<TimeInterval>> occupancyMap,
                                           List<Long> theaterIds,
                                           Map<Long, List<Room>> roomsByTheater) {
        int count = 0;
        for (Long tid : theaterIds) {
            List<Room> rooms = roomsByTheater.getOrDefault(tid, Collections.emptyList());
            for (Room room : rooms) {
                String key = room.getId() + "_" + date;
                List<TimeInterval> occupied = occupancyMap.get(key);
                if (occupied == null) continue;
                for (TimeInterval interval : occupied) {
                    if (interval.movieId != null && interval.movieId.equals(movieId)
                            && start.isBefore(interval.end) && interval.start.isBefore(end)) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    private boolean isExcluded(Room room, AutoScheduleRequest.MovieSelection selection) {
        if (selection.getExcludeRoomIds() == null) return false;
        return selection.getExcludeRoomIds().contains(room.getId());
    }

    private boolean matchesRoomType(Room room, AutoScheduleRequest.MovieSelection selection) {
        if (selection.getPreferredRoomTypes() == null || selection.getPreferredRoomTypes().isEmpty()) {
            return true; // no preference → any room
        }
        return selection.getPreferredRoomTypes().contains(room.getRoomType().name());
    }

    private String deriveFormat(Room room) {
        return switch (room.getRoomType()) {
            case STANDARD_3D, IMAX_3D -> "3D_SUB";
            case IMAX -> "2D_SUB";
            case VIP_4DX -> "4DX";
            default -> "2D_SUB";
        };
    }

    // ===================== Inner types =====================

    private record MovieWithPriority(Movie movie, AutoScheduleRequest.MovieSelection selection) {}

    /**
     * Represents an occupied time interval for a room on a specific date.
     */
    private record TimeInterval(LocalTime start, LocalTime end, Long movieId, String movieTitle) {}
}
