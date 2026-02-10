package com.cinema.service;

import com.cinema.dto.request.BookingRequest;
import com.cinema.dto.response.BookingResponse;
import com.cinema.exception.BadRequestException;
import com.cinema.exception.BookingExpiredException;
import com.cinema.exception.ResourceNotFoundException;
import com.cinema.exception.SeatAlreadyBookedException;
import com.cinema.exception.ShowtimeNotAvailableException;
import com.cinema.model.*;
import com.cinema.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service xử lý logic đặt vé xem phim.
 * Bao gồm:
 * - Kiểm tra ghế còn trống
 * - Xử lý concurrency (nhiều người đặt cùng 1 ghế)
 * - Tính tổng tiền (vé + đồ ăn)
 * - Lưu thông tin booking
 * 
 * @author Cinema Team
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    // ==================== CONSTANTS ====================

    /** Thời gian tối thiểu trước giờ chiếu để có thể đặt vé (30 phút) */
    private static final int MIN_MINUTES_BEFORE_SHOWTIME = 30;

    /** Thời gian giữ chỗ tối đa (phút) - sau thời gian này booking sẽ expired */
    private static final int HOLD_TIME_MINUTES = 5;

    // ==================== DEPENDENCIES ====================

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final BookingFoodRepository bookingFoodRepository;
    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;
    private final FoodRepository foodRepository;
    private final UserRepository userRepository;
    private final PricingService pricingService;
    private final CouponRepository couponRepository;

    // ==================== MAIN BOOKING METHODS ====================

    /**
     * Tạo đặt vé mới với xử lý concurrency.
     * 
     * <p>
     * <b>QUAN TRỌNG - XỬ LÝ CONCURRENCY:</b>
     * </p>
     * Sử dụng SERIALIZABLE isolation level + Pessimistic Locking để đảm bảo:
     * <ul>
     * <li>Khi một transaction đang kiểm tra/đặt ghế, các transaction khác phải
     * đợi</li>
     * <li>Tránh race condition khi 2 người đặt cùng 1 ghế cùng lúc</li>
     * <li>Đảm bảo tính nhất quán dữ liệu cao nhất</li>
     * </ul>
     * 
     * <p>
     * <b>Flow xử lý:</b>
     * </p>
     * <ol>
     * <li>Validate user và showtime</li>
     * <li>Validate thời gian (không quá gần giờ chiếu - 30 phút)</li>
     * <li>Lock và kiểm tra ghế (Pessimistic Locking)</li>
     * <li>Tính tổng tiền (vé + đồ ăn)</li>
     * <li>Tạo booking và các bản ghi liên quan</li>
     * </ol>
     * 
     * @param request Thông tin đặt vé từ client
     * @return BookingResponse chứa thông tin booking đã tạo
     * @throws ResourceNotFoundException     Khi user/showtime/seat không tồn tại
     * @throws ShowtimeNotAvailableException Khi suất chiếu không khả dụng
     * @throws SeatAlreadyBookedException    Khi ghế đã bị đặt bởi người khác
     * @throws BadRequestException           Khi dữ liệu đầu vào không hợp lệ
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public BookingResponse createBooking(BookingRequest request) {
        log.info("=== BẮT ĐẦU TẠO BOOKING ===");
        log.info("Showtime ID: {}, Số ghế: {}", request.getShowtimeId(), request.getSeatIds().size());

        // ===== STEP 1: Lấy thông tin user hiện tại =====
        User user = getCurrentUser();
        log.debug("User: {} (ID: {})", user.getEmail(), user.getId());

        // ===== STEP 2: Validate và lấy thông tin suất chiếu =====
        Showtime showtime = validateAndGetShowtime(request.getShowtimeId());
        log.debug("Showtime: {} - {}", showtime.getShowDate(), showtime.getStartTime());

        // ===== STEP 3: Validate thời gian đặt vé =====
        validateBookingTime(showtime);

        // ===== STEP 4: Lock ghế và kiểm tra availability (CONCURRENCY HANDLING) =====
        List<Seat> seats = lockAndValidateSeats(request.getSeatIds(), showtime);
        log.info("Đã lock và validate {} ghế thành công", seats.size());

        // ===== STEP 5: Tính tổng tiền ghế =====
        BigDecimal seatTotalAmount = calculateSeatTotal(seats, showtime, user);
        log.debug("Tổng tiền ghế: {}", seatTotalAmount);

        // ===== STEP 6: Xử lý đồ ăn (nếu có) =====
        BigDecimal foodTotalAmount = BigDecimal.ZERO;
        Map<Long, Food> foodMap = null;

        if (request.getFoodItems() != null && !request.getFoodItems().isEmpty()) {
            foodMap = validateAndGetFoods(request.getFoodItems());
            foodTotalAmount = calculateFoodTotal(request.getFoodItems(), foodMap);
            log.debug("Tổng tiền đồ ăn: {}", foodTotalAmount);
        }

        // ===== STEP 7: Tính tổng tiền cuối cùng =====
        BigDecimal totalAmount = seatTotalAmount.add(foodTotalAmount);
        BigDecimal discountAmount = calculateDiscount(request.getDiscountCode(), totalAmount);
        BigDecimal finalAmount = totalAmount.subtract(discountAmount);

        log.info("Tiền ghế: {} | Tiền đồ ăn: {} | Tổng: {} | Giảm giá: {} | Thanh toán: {}",
                seatTotalAmount, foodTotalAmount, totalAmount, discountAmount, finalAmount);

        // ===== STEP 8: Tạo Booking entity =====
        String bookingCode = generateBookingCode();

        Booking booking = Booking.builder()
                .bookingCode(bookingCode)
                .seatAmount(seatTotalAmount)
                .foodAmount(foodTotalAmount)
                .totalAmount(totalAmount)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .numberOfSeats(seats.size())
                .status(Booking.BookingStatus.PENDING)
                .notes(request.getNotes())
                .user(user)
                .showtime(showtime)
                .bookingSeats(new ArrayList<>())
                .bookingFoods(new ArrayList<>())
                .build();

        booking = bookingRepository.save(booking);
        log.info("Đã tạo booking ID: {}, Code: {}", booking.getId(), bookingCode);

        // ===== STEP 9: Tạo BookingSeat records =====
        createBookingSeats(booking, seats, showtime, user);

        // ===== STEP 10: Tạo BookingFood records (nếu có) =====
        if (foodMap != null && !request.getFoodItems().isEmpty()) {
            createBookingFoods(booking, request.getFoodItems(), foodMap);
        }

        log.info("=== HOÀN TẤT TẠO BOOKING {} ===", bookingCode);

        return mapToResponse(booking);
    }

    // ==================== VALIDATION METHODS ====================

    /**
     * Lấy thông tin user hiện tại từ SecurityContext.
     * 
     * @return User entity của người dùng đang đăng nhập
     * @throws ResourceNotFoundException Khi không tìm thấy user
     */
    private User getCurrentUser() {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("khong tim thay User voi email tu token: {}", email);
                    return new ResourceNotFoundException("User", "email", email);
                });
    }

    /**
     * Validate và lấy thông tin suất chiếu.
     * 
     * <p>
     * Kiểm tra:
     * </p>
     * <ul>
     * <li>Suất chiếu tồn tại trong hệ thống</li>
     * <li>Suất chiếu có trạng thái AVAILABLE (không bị hủy hoặc hết vé)</li>
     * </ul>
     * 
     * @param showtimeId ID của suất chiếu
     * @return Showtime entity
     * @throws ResourceNotFoundException     Khi suất chiếu không tồn tại
     * @throws ShowtimeNotAvailableException Khi suất chiếu không khả dụng
     */
    private Showtime validateAndGetShowtime(Long showtimeId) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResourceNotFoundException("Showtime", "id", showtimeId));

        // Kiểm tra trạng thái suất chiếu
        if (showtime.getStatus() == Showtime.ShowtimeStatus.CANCELLED) {
            log.warn("Suất chiếu {} đã bị hủy", showtimeId);
            throw ShowtimeNotAvailableException.cancelled(showtimeId);
        }

        if (showtime.getStatus() == Showtime.ShowtimeStatus.SOLD_OUT) {
            log.warn("Suất chiếu {} đã hết vé", showtimeId);
            throw ShowtimeNotAvailableException.soldOut(showtimeId);
        }

        return showtime;
    }

    /**
     * Validate thời gian đặt vé theo quy định.
     * 
     * <p>
     * Quy định:
     * </p>
     * <ul>
     * <li>Không cho phép đặt vé nếu suất chiếu đã qua</li>
     * <li>Không cho phép đặt vé nếu còn ít hơn 30 phút đến giờ chiếu</li>
     * </ul>
     * 
     * @param showtime Suất chiếu cần kiểm tra
     * @throws ShowtimeNotAvailableException Khi vi phạm quy định thời gian
     */
    private void validateBookingTime(Showtime showtime) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime showDateTime = showtime.getShowDateTime();

        // Kiểm tra suất chiếu đã qua chưa
        if (showDateTime.isBefore(now)) {
            log.warn("Suất chiếu {} đã qua thời gian chiếu", showtime.getId());
            throw ShowtimeNotAvailableException.expired(showtime.getId());
        }

        // Kiểm tra còn ít nhất 30 phút đến giờ chiếu
        long minutesUntilShow = Duration.between(now, showDateTime).toMinutes();
        if (minutesUntilShow < MIN_MINUTES_BEFORE_SHOWTIME) {
            log.warn("Suất chiếu {} chỉ còn {} phút (yêu cầu tối thiểu {} phút)",
                    showtime.getId(), minutesUntilShow, MIN_MINUTES_BEFORE_SHOWTIME);
            throw ShowtimeNotAvailableException.tooCloseToStartTime(
                    showtime.getId(), minutesUntilShow);
        }

        log.debug("Thời gian hợp lệ: còn {} phút đến giờ chiếu", minutesUntilShow);
    }

    /**
     * Lock các ghế và kiểm tra tính khả dụng.
     * 
     * <p>
     * <b>QUAN TRỌNG - XỬ LÝ CONCURRENCY:</b>
     * </p>
     * Sử dụng Pessimistic Write Lock (SELECT ... FOR UPDATE) để:
     * <ul>
     * <li>Khi một transaction đang kiểm tra/đặt ghế, các transaction khác phải
     * đợi</li>
     * <li>Tránh race condition khi 2 người đặt cùng 1 ghế cùng lúc</li>
     * </ul>
     * 
     * <p>
     * <b>Cơ chế hoạt động:</b>
     * </p>
     * <ol>
     * <li>Lock tất cả ghế được chọn (SELECT ... FOR UPDATE)</li>
     * <li>Kiểm tra ghế đã được đặt chưa</li>
     * <li>Nếu có ghế đã đặt → throw exception với danh sách ghế conflict</li>
     * <li>Nếu OK → tiếp tục tạo booking (vẫn giữ lock)</li>
     * <li>Sau khi commit → release lock cho transaction khác</li>
     * </ol>
     * 
     * @param seatIds  Danh sách ID ghế cần đặt
     * @param showtime Suất chiếu
     * @return Danh sách Seat entities đã được lock
     * @throws ResourceNotFoundException  Khi ghế không tồn tại
     * @throws BadRequestException        Khi ghế không thuộc phòng chiếu hoặc không
     *                                    active
     * @throws SeatAlreadyBookedException Khi ghế đã bị đặt bởi người khác
     */
    private List<Seat> lockAndValidateSeats(List<Long> seatIds, Showtime showtime) {
        log.debug("Bắt đầu lock và validate {} ghế cho suất chiếu {}",
                seatIds.size(), showtime.getId());

        // ===== Bước 1: Lấy ghế với Pessimistic Write Lock (FOR UPDATE) =====
        // Query: SELECT * FROM seats WHERE id IN (...) FOR UPDATE
        // Lock này sẽ block các transaction khác đọc/ghi các row này
        List<Seat> seats = seatRepository.findByIdsWithLock(seatIds);

        // Kiểm tra tất cả ghế được yêu cầu có tồn tại không
        if (seats.size() != seatIds.size()) {
            List<Long> foundIds = seats.stream().map(Seat::getId).toList();
            List<Long> notFoundIds = seatIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();
            log.error("Không tìm thấy ghế với ID: {}", notFoundIds);
            throw new ResourceNotFoundException("Seat", "ids", notFoundIds.toString());
        }

        // ===== Bước 2: Validate ghế thuộc đúng phòng chiếu =====
        Long roomId = showtime.getRoom().getId();
        for (Seat seat : seats) {
            // Kiểm tra ghế thuộc đúng room
            if (!seat.getRoom().getId().equals(roomId)) {
                log.error("Ghế {} không thuộc phòng {} của suất chiếu",
                        seat.getSeatLabel(), roomId);
                throw new BadRequestException(
                        String.format("Ghế %s không thuộc phòng chiếu của suất chiếu này",
                                seat.getSeatLabel()));
            }

            // Kiểm tra ghế có active không
            if (!seat.getActive()) {
                log.error("Ghế {} không khả dụng (inactive)", seat.getSeatLabel());
                throw new BadRequestException(
                        String.format("Ghế %s hiện không khả dụng", seat.getSeatLabel()));
            }
        }

        // ===== Bước 3: Kiểm tra ghế đã được đặt chưa (với lock đang giữ) =====
        // Query này cũng sử dụng lock để đảm bảo tính nhất quán
        List<BookingSeat> existingBookings = bookingSeatRepository.findAndLockBookedSeats(
                showtime.getId(), seatIds);

        if (!existingBookings.isEmpty()) {
            // Có ghế đã bị đặt → throw exception với thông tin chi tiết
            List<Long> bookedSeatIds = existingBookings.stream()
                    .map(bs -> bs.getSeat().getId())
                    .toList();
            List<String> bookedSeatLabels = existingBookings.stream()
                    .map(bs -> bs.getSeat().getSeatLabel())
                    .toList();

            log.warn("CONFLICT: Ghế {} đã bị đặt cho suất chiếu {}",
                    bookedSeatLabels, showtime.getId());

            // Throw exception để client biết ghế nào bị conflict
            throw new SeatAlreadyBookedException(bookedSeatIds, bookedSeatLabels);
        }

        log.debug("Đã lock và validate thành công {} ghế", seats.size());
        return seats;
    }

    /**
     * Validate và lấy thông tin đồ ăn.
     * 
     * @param foodItems Danh sách đồ ăn từ request
     * @return Map từ Food ID đến Food entity để lookup nhanh
     * @throws BadRequestException Khi đồ ăn không tồn tại hoặc không còn bán
     */
    private Map<Long, Food> validateAndGetFoods(List<BookingRequest.FoodItem> foodItems) {
        List<Long> foodIds = foodItems.stream()
                .map(BookingRequest.FoodItem::getFoodId)
                .toList();

        List<Food> foods = foodRepository.findAllById(foodIds);

        // Kiểm tra tất cả food có tồn tại không
        if (foods.size() != foodIds.size()) {
            log.error("Một số đồ ăn không tồn tại: requested={}, found={}",
                    foodIds.size(), foods.size());
            throw new BadRequestException("Một số món ăn không tồn tại trong hệ thống");
        }

        // Kiểm tra food có available không
        for (Food food : foods) {
            if (!food.getIsAvailable()) {
                log.warn("Món {} hiện không còn bán", food.getName());
                throw new BadRequestException(
                        String.format("Món %s hiện không còn bán", food.getName()));
            }
        }

        return foods.stream()
                .collect(Collectors.toMap(Food::getId, f -> f));
    }

    // ==================== CALCULATION METHODS ====================

    /**
     * Tính tổng tiền cho các ghế đã chọn.
     * 
     * <p>
     * <b>Công thức:</b>
     * </p>
     * 
     * <pre>
     * Tổng = Σ (giá cơ bản × hệ số giá ghế)
     * </pre>
     * 
     * <p>
     * <b>Ví dụ hệ số giá:</b>
     * </p>
     * <ul>
     * <li>Ghế thường (STANDARD): basePrice × 1.0</li>
     * <li>Ghế VIP: basePrice × 1.5</li>
     * <li>Ghế Couple: basePrice × 2.0</li>
     * </ul>
     * 
     * @param seats    Danh sách ghế đã chọn
     * @param showtime Suất chiếu (để lấy giá cơ bản)
     * @return Tổng tiền ghế
     */
    /**
     * Tính tổng tiền cho các ghế đã chọn.
     * 
     * @param seats    Danh sách ghế đã chọn
     * @param showtime Suất chiếu
     * @param user     Người dùng đặt vé (để tính giá theo đối tượng)
     * @return Tổng tiền ghế
     */
    private BigDecimal calculateSeatTotal(List<Seat> seats, Showtime showtime, User user) {
        BigDecimal total = BigDecimal.ZERO;

        for (Seat seat : seats) {
            // Giá vé được tính linh hoạt qua PricingService
            BigDecimal seatPrice = pricingService.calculateTicketPrice(showtime, seat, user);
            total = total.add(seatPrice);

            log.debug("Ghế {}: {} VND", seat.getSeatLabel(), seatPrice);
        }

        log.debug("Tổng tiền {} ghế: {} VND", seats.size(), total);
        return total;
    }

    /**
     * Tính tổng tiền đồ ăn.
     * 
     * @param foodItems Danh sách đồ ăn được chọn
     * @param foodMap   Map chứa thông tin Food entity
     * @return Tổng tiền đồ ăn
     */
    private BigDecimal calculateFoodTotal(List<BookingRequest.FoodItem> foodItems, Map<Long, Food> foodMap) {
        BigDecimal total = BigDecimal.ZERO;

        for (BookingRequest.FoodItem item : foodItems) {
            Food food = foodMap.get(item.getFoodId());
            if (food != null) {
                BigDecimal itemTotal = food.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                total = total.add(itemTotal);
            }
        }
        return total;
    }

    /**
     * Tính tiền giảm giá dựa trên mã code.
     * 
     * @param discountCode Mã giảm giá
     * @param totalAmount  Tổng tiền trước giảm giá
     * @return Số tiền được giảm
     */
    private BigDecimal calculateDiscount(String discountCode, BigDecimal totalAmount) {
        if (discountCode == null || discountCode.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }

        return couponRepository.findByCouponCode(discountCode)
                .map(coupon -> {
                    // Kiểm tra cơ bản: có active không
                    if (coupon.getStatus() != Coupon.CouponStatus.ACTIVE) {
                        return BigDecimal.ZERO;
                    }

                    // Kiểm tra ngày hiệu lực (nếu có)
                    LocalDateTime now = LocalDateTime.now();
                    if (coupon.getStartDate() != null && coupon.getStartDate().isAfter(now)) {
                        return BigDecimal.ZERO;
                    }
                    if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(now)) {
                        return BigDecimal.ZERO;
                    }

                    // Kiểm tra giá trị đơn hàng tối thiểu
                    if (coupon.getMinPurchaseAmount() != null
                            && totalAmount.compareTo(coupon.getMinPurchaseAmount()) < 0) {
                        return BigDecimal.ZERO;
                    }

                    // Tính toán
                    BigDecimal discount = BigDecimal.ZERO;
                    if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
                        discount = totalAmount.multiply(coupon.getDiscountValue())
                                .divide(new BigDecimal("100"));

                        if (coupon.getMaxDiscountAmount() != null
                                && discount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                            discount = coupon.getMaxDiscountAmount();
                        }
                    } else {
                        discount = coupon.getDiscountValue();
                    }

                    // Không giảm quá tổng tiền
                    return discount.min(totalAmount);
                })
                .orElse(BigDecimal.ZERO);
    }

    /**
     * Tạo các bản ghi BookingSeat cho booking.
     * Mỗi ghế được đặt sẽ tạo một record trong bảng booking_seats.
     * 
     * @param booking  Booking entity đã được lưu
     * @param seats    Danh sách ghế đã đặt
     * @param showtime Suất chiếu
     * @param user     Người dùng đặt vé
     */
    private void createBookingSeats(Booking booking, List<Seat> seats, Showtime showtime, User user) {
        for (Seat seat : seats) {
            BigDecimal seatPrice = pricingService.calculateTicketPrice(showtime, seat, user);

            BookingSeat bookingSeat = BookingSeat.builder()
                    .booking(booking)
                    .seat(seat)
                    .showtime(showtime)
                    .price(seatPrice)
                    .build();

            bookingSeatRepository.save(bookingSeat);
            booking.getBookingSeats().add(bookingSeat);
        }

        log.debug("Đã tạo {} bản ghi BookingSeat", seats.size());
    }

    /**
     * Tạo các bản ghi BookingFood cho booking.
     * Mỗi món ăn được đặt sẽ tạo một record trong bảng booking_foods.
     * 
     * @param booking   Booking entity đã được lưu
     * @param foodItems Danh sách đồ ăn từ request
     * @param foodMap   Map từ Food ID đến Food entity
     */
    private void createBookingFoods(Booking booking, List<BookingRequest.FoodItem> foodItems,
            Map<Long, Food> foodMap) {
        for (BookingRequest.FoodItem item : foodItems) {
            Food food = foodMap.get(item.getFoodId());

            BookingFood bookingFood = BookingFood.builder()
                    .booking(booking)
                    .food(food)
                    .quantity(item.getQuantity())
                    .unitPrice(food.getPrice())
                    .totalPrice(food.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .build();

            bookingFoodRepository.save(bookingFood);
        }

        log.debug("Đã tạo {} bản ghi BookingFood", foodItems.size());
    }

    /**
     * Generate mã booking duy nhất.
     * Format: BK + 8 ký tự UUID viết hoa (VD: BK1A2B3C4D)
     * 
     * @return Mã booking unique
     */
    private String generateBookingCode() {
        return "BK" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // ==================== QUERY METHODS ====================

    /**
     * Lấy thông tin booking theo ID.
     * 
     * @param id ID của booking
     * @return BookingResponse
     * @throws ResourceNotFoundException Khi không tìm thấy booking
     */
    public BookingResponse getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
        return mapToResponse(booking);
    }

    /**
     * Lấy thông tin booking theo mã booking.
     * 
     * @param bookingCode Mã booking (VD: BK1A2B3C4D)
     * @return BookingResponse
     * @throws ResourceNotFoundException Khi không tìm thấy booking
     */
    public BookingResponse getBookingByCode(String bookingCode) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "code", bookingCode));
        return mapToResponse(booking);
    }

    /**
     * Lấy danh sách booking của user hiện tại.
     * Sắp xếp theo thời gian tạo giảm dần (mới nhất trước).
     * 
     * @return Danh sách BookingResponse
     */
    public List<BookingResponse> getUserBookings() {
        User user = getCurrentUser();

        return bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách ID ghế đã được đặt cho suất chiếu.
     * Dùng để hiển thị sơ đồ ghế trên UI (ghế nào đã bị đặt).
     * 
     * @param showtimeId ID suất chiếu
     * @return Danh sách ID các ghế đã đặt
     */
    public List<Long> getBookedSeatIds(Long showtimeId) {
        return bookingSeatRepository.findBookedSeatIdsByShowtime(showtimeId);
    }

    // ==================== BOOKING MODIFICATION METHODS ====================

    /**
     * Hủy booking.
     * 
     * <p>
     * <b>Điều kiện hủy:</b>
     * </p>
     * <ul>
     * <li>Booking phải thuộc về user hiện tại</li>
     * <li>Status phải là PENDING hoặc CONFIRMED</li>
     * <li>Suất chiếu chưa diễn ra</li>
     * </ul>
     * 
     * @param id ID booking cần hủy
     * @return BookingResponse sau khi hủy
     * @throws ResourceNotFoundException Khi không tìm thấy booking
     * @throws BadRequestException       Khi vi phạm điều kiện hủy
     */
    @Transactional
    public BookingResponse cancelBooking(Long id) {
        User user = getCurrentUser();

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        // Validate ownership - chỉ được hủy booking của mình
        if (!booking.getUser().getId().equals(user.getId())) {
            log.warn("User {} cố gắng hủy booking {} của user khác",
                    user.getId(), booking.getId());
            throw new BadRequestException("Bạn chỉ có thể hủy đặt vé của chính mình");
        }

        // Validate status - chỉ hủy được PENDING hoặc CONFIRMED
        if (booking.getStatus() != Booking.BookingStatus.PENDING &&
                booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new BadRequestException(
                    String.format("Không thể hủy đặt vé có trạng thái: %s", booking.getStatus()));
        }

        // Validate showtime chưa diễn ra
        if (booking.getShowtime().getShowDateTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Không thể hủy đặt vé cho suất chiếu đã qua");
        }

        // Cập nhật trạng thái
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);

        log.info("Booking {} đã được hủy bởi user {}", booking.getBookingCode(), user.getEmail());

        return mapToResponse(booking);
    }

    /**
     * Xác nhận booking sau khi thanh toán thành công.
     * Kiểm tra thời gian giữ chỗ trước khi xác nhận.
     * 
     * @param id ID booking cần xác nhận
     * @return BookingResponse sau khi xác nhận
     * @throws ResourceNotFoundException Khi không tìm thấy booking
     * @throws BadRequestException       Khi booking không ở trạng thái PENDING
     * @throws BookingExpiredException   Khi booking đã hết hạn giữ chỗ
     */
    @Transactional
    public BookingResponse confirmBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        // Chỉ confirm được booking PENDING
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể xác nhận đặt vé đang chờ thanh toán");
        }

        // Kiểm tra booking đã hết hạn giữ chỗ chưa (15 phút)
        LocalDateTime expireTime = booking.getCreatedAt().plusMinutes(HOLD_TIME_MINUTES);
        if (LocalDateTime.now().isAfter(expireTime)) {
            // Đã hết hạn -> cập nhật status và throw exception
            booking.setStatus(Booking.BookingStatus.EXPIRED);
            bookingRepository.save(booking);

            log.warn("Booking {} đã hết hạn giữ chỗ", booking.getBookingCode());
            throw new BookingExpiredException(booking.getId(), booking.getBookingCode());
        }

        // Xác nhận booking
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking = bookingRepository.save(booking);

        // Lưu ý: Logic tích điểm và cập nhật membership đã chuyển sang
        // PaymentService.processPayment()

        log.info("Booking {} đã được xác nhận", booking.getBookingCode());

        return mapToResponse(booking);
    }

    /**
     * Đánh dấu booking đã hoàn thành (sau khi khách xem phim xong).
     * Thường được gọi tự động sau giờ chiếu.
     * 
     * @param id ID booking
     * @return BookingResponse sau khi cập nhật
     */
    @Transactional
    public BookingResponse completeBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new BadRequestException("Chỉ có thể hoàn thành đặt vé đã xác nhận");
        }

        booking.setStatus(Booking.BookingStatus.COMPLETED);
        booking = bookingRepository.save(booking);

        return mapToResponse(booking);
    }

    /**
     * Lấy tất cả booking (dùng cho admin)
     */
    public List<BookingResponse> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        return bookings.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Cập nhật trạng thái booking theo admin request
     * (PENDING/CONFIRMED/CANCELLED/COMPLETED/EXPIRED)
     */
    @Transactional
    public BookingResponse updateBookingStatus(Long id, String statusStr) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        try {
            Booking.BookingStatus status = Booking.BookingStatus.valueOf(statusStr.toUpperCase());
            booking.setStatus(status);
            booking = bookingRepository.save(booking);
            return mapToResponse(booking);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid booking status: " + statusStr);
        }
    }

    /**
     * Xóa booking (admin)
     */
    @Transactional
    public void deleteBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
        bookingRepository.delete(booking);
    }

    /**
     * Expire các booking PENDING quá thời gian giữ chỗ.
     * Được gọi bởi Scheduler định kỳ (mỗi phút).
     * 
     * <p>
     * Giải phóng ghế cho người khác đặt khi:
     * </p>
     * <ul>
     * <li>Booking có status PENDING</li>
     * <li>Đã tạo quá 15 phút mà chưa thanh toán</li>
     * </ul>
     * 
     * @return Số lượng booking đã expire
     */
    @Transactional
    public int expirePendingBookings() {
        LocalDateTime expireTime = LocalDateTime.now().minusMinutes(HOLD_TIME_MINUTES);
        List<Booking> expiredBookings = bookingRepository.findPendingBookingsToExpire(
                Booking.BookingStatus.PENDING, expireTime);

        for (Booking booking : expiredBookings) {
            booking.setStatus(Booking.BookingStatus.EXPIRED);
            bookingRepository.save(booking);
            log.info("Booking {} đã expired do hết thời gian giữ chỗ", booking.getBookingCode());
        }

        if (!expiredBookings.isEmpty()) {
            log.info("Đã expire {} booking hết hạn giữ chỗ", expiredBookings.size());
        }

        return expiredBookings.size();
    }

    // ==================== MAPPING METHODS ====================

    /**
     * Map Booking entity sang BookingResponse DTO.
     * 
     * @param booking Booking entity
     * @return BookingResponse DTO
     */
    private BookingResponse mapToResponse(Booking booking) {
        Showtime showtime = booking.getShowtime();
        Movie movie = showtime.getMovie();
        Room room = showtime.getRoom();

        // Lấy danh sách label ghế (VD: ["A1", "A2", "B5"])
        List<String> seatLabels = booking.getBookingSeats().stream()
                .map(bs -> bs.getSeat().getSeatLabel())
                .collect(Collectors.toList());

        // Lấy trạng thái thanh toán
        String paymentStatus = booking.getPayment() != null ? booking.getPayment().getStatus().name() : "NOT_PAID";

        return BookingResponse.builder()
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
                .createdAt(booking.getCreatedAt())
                .userId(booking.getUser().getId())
                .userFullName(booking.getUser().getFullName())
                .userEmail(booking.getUser().getEmail())
                .showtimeId(showtime.getId())
                .showDate(showtime.getShowDate())
                .startTime(showtime.getStartTime())
                .movieId(movie.getId())
                .movieTitle(movie.getTitle())
                .moviePosterUrl(movie.getPosterUrl())
                .theaterName(room.getTheater().getName())
                .roomName(room.getName())
                .seatLabels(seatLabels)
                .paymentStatus(paymentStatus)
                .build();
    }
}
