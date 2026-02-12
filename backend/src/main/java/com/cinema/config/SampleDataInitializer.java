package com.cinema.config;

import com.cinema.model.*;
import com.cinema.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Khởi tạo dữ liệu mẫu cho hệ thống
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class SampleDataInitializer implements CommandLineRunner {

        private final RegionRepository regionRepository;
        private final CityRepository cityRepository;
        private final TheaterRepository theaterRepository;
        private final RoomRepository roomRepository;
        private final SeatRepository seatRepository;
        private final MovieRepository movieRepository;
        private final ShowtimeRepository showtimeRepository;
        private final ReviewRepository reviewRepository;
        private final UserRepository userRepository;
        private final FoodRepository foodRepository;
        private final CouponRepository couponRepository;
        private final VoucherRepository voucherRepository;
        private final PromotionRepository promotionRepository;
        private final BookingRepository bookingRepository;
        private final BookingSeatRepository bookingSeatRepository;
        private final BookingFoodRepository bookingFoodRepository;
        private final PaymentRepository paymentRepository;
        private final TicketPriceRepository ticketPriceRepository;
        private final PriceHeaderRepository priceHeaderRepository;
        private final PriceLineRepository priceLineRepository;
        private final SurchargeRepository surchargeRepository;
        private final ObjectMapper objectMapper;

        @org.springframework.beans.factory.annotation.Value("${app.db.reset-data:false}")
        private boolean resetData;

        @Override
        public void run(String... args) {
                if (resetData) {
                        log.warn("RESET DATA ENABLED: Deleting all data...");
                        // Delete in order of dependencies because of Foreign Keys
                        reviewRepository.deleteAll();

                        // Booking related
                        paymentRepository.deleteAll();
                        bookingSeatRepository.deleteAll();
                        bookingFoodRepository.deleteAll();
                        bookingRepository.deleteAll();

                        showtimeRepository.deleteAll();
                        seatRepository.deleteAll();
                        roomRepository.deleteAll();
                        theaterRepository.deleteAll();
                        cityRepository.deleteAll();
                        regionRepository.deleteAll();
                        movieRepository.deleteAll();
                        foodRepository.deleteAll();
                        couponRepository.deleteAll();
                        voucherRepository.deleteAll();
                        promotionRepository.deleteAll();
                        ticketPriceRepository.deleteAll();
                        surchargeRepository.deleteAll();
                        priceLineRepository.deleteAll();
                        priceHeaderRepository.deleteAll();

                        log.info("All data deleted.");
                }

                if (regionRepository.count() == 0) {
                        initRegions();
                }
                if (cityRepository.count() == 0) {
                        initCities();
                }
                if (theaterRepository.count() == 0) {
                        initTheaters();
                }
                if (surchargeRepository.findByType(Surcharge.SurchargeType.SEAT_TYPE).isEmpty()) {
                        initSeatTypes();
                }
                // Tạo rooms và seats nếu có theaters nhưng không có rooms
                if (roomRepository.count() == 0 && theaterRepository.count() > 0) {
                        initRoomsAndSeats();
                }
                if (movieRepository.count() == 0) {
                        initSampleMovies();
                }
                // Init pricing logic (Rate Cards)
                if (priceHeaderRepository.count() == 0) {
                        initPricingLogic();
                }
                // Init showtimes for existing movies
                if (showtimeRepository.count() == 0 && movieRepository.count() > 0) {
                        initShowtimes();
                }
                // Init sample reviews
                if (reviewRepository.count() == 0 && movieRepository.count() > 0) {
                        initSampleReviews();
                }
                // Init foods and combos
                if (foodRepository.count() == 0) {
                        initFoodsAndCombos();
                }
                // Init coupons
                if (couponRepository.count() == 0) {
                        initCoupons();
                }
                // Init vouchers
                if (voucherRepository.count() == 0) {
                        initVouchers();
                }
                // Init promotions
                if (promotionRepository.count() == 0) {
                        initPromotions();
                }

                // Init sample bookings
                if (bookingRepository.count() == 0) {
                        initSampleBookings();
                }
        }

        private void initRoomsAndSeats() {
                log.info("Initializing rooms and seats for existing theaters...");
                List<Theater> theaters = theaterRepository.findAll();
                for (Theater theater : theaters) {
                        createRoomsForTheater(theater);
                }
                log.info("Created rooms and seats for {} theaters", theaters.size());
        }

        private void initRegions() {
                log.info("Initializing regions...");
                List<Region> regions = List.of(
                                Region.builder().name("Miền Bắc").code("NORTH").build(),
                                Region.builder().name("Miền Trung").code("CENTRAL").build(),
                                Region.builder().name("Miền Nam").code("SOUTH").build());
                regionRepository.saveAll(regions);
                log.info("Created {} regions", regions.size());
        }

        private void initCities() {
                log.info("Initializing cities...");

                Region north = regionRepository.findByCode("NORTH").orElse(null);
                Region central = regionRepository.findByCode("CENTRAL").orElse(null);
                Region south = regionRepository.findByCode("SOUTH").orElse(null);

                if (north == null || central == null || south == null) {
                        log.warn("Regions not found, skipping city initialization");
                        return;
                }

                List<City> cities = new ArrayList<>();

                // Miền Bắc
                cities.add(createCity("Hà Nội", "HA_NOI", north));
                cities.add(createCity("Hải Phòng", "HAI_PHONG", north));
                cities.add(createCity("Quảng Ninh", "QUANG_NINH", north));

                // Miền Trung
                cities.add(createCity("Đà Nẵng", "DA_NANG", central));
                cities.add(createCity("Huế", "HUE", central));
                cities.add(createCity("Nha Trang", "NHA_TRANG", central));

                // Miền Nam
                cities.add(createCity("TP.HCM", "HO_CHI_MINH", south));
                cities.add(createCity("Cần Thơ", "CAN_THO", south));
                cities.add(createCity("Biên Hòa", "BIEN_HOA", south));

                cityRepository.saveAll(cities);
                log.info("Created {} cities", cities.size());
        }

        private City createCity(String name, String code, Region region) {
                return City.builder()
                                .name(name)
                                .code(code)
                                .region(region)
                                .active(true)
                                .build();
        }

        private void initSeatTypes() {
                log.info("Initializing seat types as surcharges...");
                List<Surcharge> surcharges = new ArrayList<>();

                // VIP Seat Surcharge
                if (surchargeRepository.findByType(Surcharge.SurchargeType.SEAT_TYPE).isEmpty()) {
                        // Standard - usually 0 surcharge
                        surcharges.add(Surcharge.builder()
                                        .name("Ghế Thường")
                                        .code("STANDARD")
                                        .type(Surcharge.SurchargeType.SEAT_TYPE)
                                        .amount(BigDecimal.ZERO)
                                        .active(true)
                                        .build());

                        // VIP - Add 10000
                        surcharges.add(Surcharge.builder()
                                        .name("Ghế VIP")
                                        .code("VIP")
                                        .type(Surcharge.SurchargeType.SEAT_TYPE)
                                        .amount(new BigDecimal("10000"))
                                        .active(true)
                                        .color("#D69E2E")
                                        .build());

                        // Couple - Add 50000
                        surcharges.add(Surcharge.builder()
                                        .name("Ghế Đôi")
                                        .code("COUPLE")
                                        .type(Surcharge.SurchargeType.SEAT_TYPE)
                                        .amount(new BigDecimal("50000"))
                                        .active(true)
                                        .color("#E53E3E")
                                        .build());

                        surchargeRepository.saveAll(surcharges);
                        log.info("Created {} seat type surcharges", surcharges.size());
                }
        }

        private void initTheaters() {
                log.info("Initializing theaters...");

                City hanoi = cityRepository.findByCode("HA_NOI").orElse(null);
                City haiphong = cityRepository.findByCode("HAI_PHONG").orElse(null);
                City danang = cityRepository.findByCode("DA_NANG").orElse(null);
                City hue = cityRepository.findByCode("HUE").orElse(null);
                City nhatrang = cityRepository.findByCode("NHA_TRANG").orElse(null);
                City hcm = cityRepository.findByCode("HO_CHI_MINH").orElse(null);
                City cantho = cityRepository.findByCode("CAN_THO").orElse(null);
                City bienhoa = cityRepository.findByCode("BIEN_HOA").orElse(null);

                if (hanoi == null || hcm == null) {
                        log.warn("Required cities not found, skipping theater initialization");
                        return;
                }

                List<Theater> theaters = new ArrayList<>();

                // Miền Bắc - Hà Nội
                theaters.add(createTheater("CinemaPlus Vincom Bà Triệu", "191 Bà Triệu, Hai Bà Trưng", hanoi));
                theaters.add(createTheater("CinemaPlus Royal City", "72A Nguyễn Trãi, Thanh Xuân", hanoi));
                theaters.add(createTheater("CinemaPlus Times City", "458 Minh Khai, Hai Bà Trưng", hanoi));
                theaters.add(createTheater("CinemaPlus Aeon Long Biên", "27 Cổ Linh, Long Biên", hanoi));

                // Miền Bắc - Hải Phòng
                if (haiphong != null) {
                        theaters.add(createTheater("CinemaPlus Hải Phòng", "10 Lê Hồng Phong, Ngô Quyền", haiphong));
                }

                // Miền Trung - Đà Nẵng
                if (danang != null) {
                        theaters.add(createTheater("CinemaPlus Đà Nẵng", "910 Ngô Quyền, Sơn Trà", danang));
                        theaters.add(createTheater("CinemaPlus Vincom Đà Nẵng", "Vincom Plaza, Hải Châu", danang));
                }

                // Miền Trung - Huế
                if (hue != null) {
                        theaters.add(createTheater("CinemaPlus Huế", "25 Hai Bà Trưng, TP Huế", hue));
                }

                // Miền Trung - Nha Trang
                if (nhatrang != null) {
                        theaters.add(createTheater("CinemaPlus Nha Trang", "50 Thống Nhất, Nha Trang", nhatrang));
                }

                // Miền Nam - TP.HCM
                theaters.add(createTheater("CinemaPlus Landmark 81", "Vinhomes Central Park, Bình Thạnh", hcm));
                theaters.add(createTheater("CinemaPlus Vincom Đồng Khởi", "72 Lê Thánh Tôn, Quận 1", hcm));
                theaters.add(createTheater("CinemaPlus Aeon Tân Phú", "30 Bờ Bao Tân Thắng, Tân Phú", hcm));
                theaters.add(createTheater("CinemaPlus Crescent Mall", "101 Tôn Dật Tiên, Quận 7", hcm));
                theaters.add(createTheater("CinemaPlus Giga Mall", "242 Phạm Văn Đồng, Thủ Đức", hcm));
                theaters.add(createTheater("CinemaPlus Cantavil", "1 Cantavil, Quận 2", hcm));

                // Miền Nam - Cần Thơ
                if (cantho != null) {
                        theaters.add(createTheater("CinemaPlus Cần Thơ", "209 đường 30/4, Ninh Kiều", cantho));
                }

                // Miền Nam - Biên Hòa
                if (bienhoa != null) {
                        theaters.add(createTheater("CinemaPlus Biên Hòa", "Vincom Biên Hòa, Đồng Nai", bienhoa));
                }

                theaterRepository.saveAll(theaters);
                log.info("Created {} theaters", theaters.size());

                // Create rooms and seats for each theater
                for (Theater theater : theaters) {
                        createRoomsForTheater(theater);
                }
        }

        private Theater createTheater(String name, String address, City city) {
                return Theater.builder()
                                .name(name)
                                .address(address)
                                .city(city)
                                .phone("1900" + (1000 + new Random().nextInt(9000)))
                                .email(name.toLowerCase().replace(" ", "").replace("cinemaplus", "contact@cinemaplus")
                                                + ".vn")
                                .active(true)
                                .build();
        }

        private void createRoomsForTheater(Theater theater) {
                List<Room> rooms = new ArrayList<>();
                Random random = new Random();

                // Mỗi rạp có 6-10 phòng chiếu
                int roomCount = 6 + random.nextInt(5);

                // Phân bổ loại phòng
                // 40% Standard 2D, 25% Standard 3D, 20% IMAX, 15% VIP/4DX
                int standard2DCount = (int) Math.ceil(roomCount * 0.4);
                int standard3DCount = (int) Math.ceil(roomCount * 0.25);
                int imaxCount = (int) Math.ceil(roomCount * 0.2);
                int vipCount = roomCount - standard2DCount - standard3DCount - imaxCount;
                if (vipCount < 1)
                        vipCount = 1;

                int roomNumber = 1;

                // Tạo phòng Standard 2D
                for (int i = 0; i < standard2DCount; i++) {
                        rooms.add(createRoom(theater, "Phòng " + roomNumber++, Room.RoomType.STANDARD_2D,
                                        10 + random.nextInt(3), 12 + random.nextInt(3)));
                }

                // Tạo phòng Standard 3D
                for (int i = 0; i < standard3DCount; i++) {
                        rooms.add(createRoom(theater, "Phòng " + roomNumber++, Room.RoomType.STANDARD_3D,
                                        10 + random.nextInt(2), 12 + random.nextInt(2)));
                }

                // Tạo phòng IMAX (lớn hơn)
                for (int i = 0; i < imaxCount; i++) {
                        rooms.add(createRoom(theater, "IMAX " + (i + 1), Room.RoomType.IMAX, 14 + random.nextInt(3),
                                        16 + random.nextInt(3)));
                }

                // Tạo phòng VIP/4DX (nhỏ hơn, cao cấp)
                for (int i = 0; i < vipCount; i++) {
                        rooms.add(createRoom(theater, "VIP " + (i + 1), Room.RoomType.VIP_4DX, 6 + random.nextInt(2),
                                        8 + random.nextInt(3)));
                }

                roomRepository.saveAll(rooms);
                log.info("Created {} rooms for theater: {}", rooms.size(), theater.getName());

                // Create seats for each room
                for (Room room : rooms) {
                        createSeatsForRoom(room);
                }
        }

        private Room createRoom(Theater theater, String name, Room.RoomType roomType, int rows, int cols) {
                return Room.builder()
                                .name(name)
                                .theater(theater)
                                .roomType(roomType)
                                .totalSeats(rows * cols)
                                .rowsCount(rows)
                                .columnsCount(cols)
                                .active(true)
                                .build();
        }

        private void createSeatsForRoom(Room room) {
                List<Seat> seats = new ArrayList<>();
                char[] rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".toCharArray();
                int totalRows = room.getRowsCount();
                int seatsPerRow = room.getColumnsCount();
                Room.RoomType roomType = room.getRoomType();

                // Pre-load seat surcharges
                java.util.Map<String, Surcharge> seatTypeMap = surchargeRepository
                                .findByType(Surcharge.SurchargeType.SEAT_TYPE).stream()
                                .collect(java.util.stream.Collectors.toMap(
                                                s -> s.getCode() != null ? s.getCode() : s.getName(),
                                                java.util.function.Function.identity()));

                // Ensure STANDARD exists
                if (!seatTypeMap.containsKey("STANDARD")) {
                        // Create duplicate safe check handled by initSeatTypes but just in case
                }

                // Prepare layout structure
                java.util.Map<String, Object> layoutMap = new java.util.HashMap<>();
                layoutMap.put("rows", totalRows);
                layoutMap.put("cols", seatsPerRow);
                List<List<java.util.Map<String, Object>>> grid = new ArrayList<>();

                for (int row = 0; row < totalRows; row++) {
                        List<java.util.Map<String, Object>> rowList = new ArrayList<>();
                        for (int col = 1; col <= seatsPerRow; col++) {
                                String typeCode = "STANDARD";

                                if (roomType == Room.RoomType.VIP_4DX) {
                                        if (row >= totalRows - 2)
                                                typeCode = "COUPLE";
                                        else
                                                typeCode = "VIP";
                                } else if (roomType == Room.RoomType.IMAX) {
                                        if (row >= totalRows - 2)
                                                typeCode = "COUPLE";
                                        else if (row >= totalRows / 3 && row <= 2 * totalRows / 3)
                                                typeCode = "VIP";
                                        else
                                                typeCode = "STANDARD";
                                } else {
                                        if (row >= totalRows - 2) {
                                                if (col <= 2 || col > seatsPerRow - 2)
                                                        typeCode = "COUPLE";
                                                else
                                                        typeCode = "VIP";
                                        } else if (row >= totalRows / 3 && row <= 2 * totalRows / 3 && col > 2
                                                        && col <= seatsPerRow - 2) {
                                                typeCode = "VIP";
                                        } else {
                                                typeCode = "STANDARD";
                                        }
                                }

                                Surcharge seatTypeObj = seatTypeMap.getOrDefault(typeCode, seatTypeMap.get("STANDARD"));
                                // Fallback if STANDARD missing (should not happen if init ran)
                                if (seatTypeObj == null) {
                                        seatTypeObj = seatTypeMap.values().stream().findFirst().orElse(null);
                                }

                                // Tạo một số ghế không khả dụng (đã hỏng, bảo trì)
                                boolean isActive = true;
                                if (new Random().nextInt(100) < 2)
                                        isActive = false;

                                String rowName = String.valueOf(rowLabels[row]);
                                String seatLabel = rowName + col;

                                Seat seat = Seat.builder()
                                                .room(room)
                                                .rowName(rowName)
                                                .seatNumber(col)
                                                .seatType(seatTypeObj)
                                                .active(isActive)
                                                .build();
                                seats.add(seat);

                                // Add to layout grid
                                java.util.Map<String, Object> cell = new java.util.HashMap<>();
                                cell.put("id", seatLabel);
                                cell.put("row", row);
                                cell.put("col", col - 1); // Grid uses 0-based col index
                                cell.put("type", typeCode);
                                cell.put("label", seatLabel);
                                // Note: we can't put dbId here yet because seat is not saved
                                rowList.add(cell);
                        }
                        grid.add(rowList);
                }

                seatRepository.saveAll(seats);

                layoutMap.put("grid", grid);
                try {
                        String layoutJson = objectMapper.writeValueAsString(layoutMap);
                        room.setSeatLayout(layoutJson);
                        roomRepository.save(room);
                } catch (Exception e) {
                        log.error("Failed to serialize seat layout for room: {}", room.getName(), e);
                }
        }

        private void initSampleMovies() {
                log.info("Initializing sample movies...");
                List<Movie> movies = new ArrayList<>();

                // ============= PHIM ĐÃ CHIẾU (2019-2024) - ENDED =============

                // 2019
                movies.add(createMovie("Avengers: Endgame", "Anthony Russo, Joe Russo",
                                "Robert Downey Jr., Chris Evans, Mark Ruffalo, Scarlett Johansson",
                                "Sau những sự kiện tàn khốc của Infinity War, các Avengers còn lại phải tập hợp một lần nữa để đảo ngược hành động của Thanos và khôi phục vũ trụ.",
                                181, "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
                                "https://www.youtube.com/watch?v=TcMBFSGVi1c",
                                LocalDate.of(2019, 4, 26), Movie.MovieStatus.ENDED, 8.4));

                movies.add(createMovie("Joker", "Todd Phillips", "Joaquin Phoenix, Robert De Niro, Zazie Beetz",
                                "Câu chuyện gốc về Arthur Fleck, một người đàn ông bị xã hội ruồng bỏ dần dần trở thành kẻ thù tội phạm ở Gotham City.",
                                122, "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
                                "https://www.youtube.com/watch?v=zAGVQLHvwOY",
                                LocalDate.of(2019, 10, 4), Movie.MovieStatus.ENDED, 8.4));

                movies.add(createMovie("Parasite", "Bong Joon-ho",
                                "Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong, Choi Woo-shik",
                                "Gia đình Kim nghèo khó tìm cách xâm nhập vào cuộc sống của gia đình Park giàu có, dẫn đến những hậu quả không ngờ.",
                                132, "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
                                "https://www.youtube.com/watch?v=5xH0HfJHsaY",
                                LocalDate.of(2019, 5, 30), Movie.MovieStatus.ENDED, 8.6));

                movies.add(createMovie("The Lion King (2019)", "Jon Favreau",
                                "Donald Glover, Beyoncé, James Earl Jones, Chiwetel Ejiofor",
                                "Phiên bản làm lại của bộ phim hoạt hình kinh điển về chú sư tử Simba.",
                                118, "https://image.tmdb.org/t/p/w500/2bXbqYdUdNVa8VIWXVfclP2ICtT.jpg",
                                "https://www.youtube.com/watch?v=7TavVZMewpY",
                                LocalDate.of(2019, 7, 19), Movie.MovieStatus.ENDED, 7.1));

                // 2020
                movies.add(createMovie("Tenet", "Christopher Nolan",
                                "John David Washington, Robert Pattinson, Elizabeth Debicki",
                                "Một điệp viên bí ẩn phải học cách thao túng thời gian để ngăn chặn Thế chiến III.",
                                150, "https://image.tmdb.org/t/p/w500/k68nPLbIST6NP96JmTxmZijEvCA.jpg",
                                "https://www.youtube.com/watch?v=LdOM0x0XDMo",
                                LocalDate.of(2020, 8, 26), Movie.MovieStatus.ENDED, 7.3));

                movies.add(createMovie("Soul", "Pete Docter", "Jamie Foxx, Tina Fey, Graham Norton",
                                "Joe Gardner, một giáo viên nhạc trung học, có cơ hội biểu diễn tại câu lạc bộ jazz tốt nhất thị trấn. Nhưng một tai nạn đưa linh hồn anh ra khỏi cơ thể.",
                                100, "https://image.tmdb.org/t/p/w500/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg",
                                "https://www.youtube.com/watch?v=xOsLIiBStEs",
                                LocalDate.of(2020, 12, 25), Movie.MovieStatus.ENDED, 8.1));

                // 2021
                movies.add(createMovie("Spider-Man: No Way Home", "Jon Watts",
                                "Tom Holland, Zendaya, Benedict Cumberbatch, Tobey Maguire, Andrew Garfield",
                                "Peter Parker nhờ Doctor Strange giúp đỡ nhưng vô tình mở ra đa vũ trụ, mang theo những kẻ thù từ các thực tại khác.",
                                148, "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
                                "https://www.youtube.com/watch?v=JfVOs4VSpmA",
                                LocalDate.of(2021, 12, 17), Movie.MovieStatus.ENDED, 8.3));

                movies.add(createMovie("Dune (2021)", "Denis Villeneuve",
                                "Timothée Chalamet, Rebecca Ferguson, Oscar Isaac, Zendaya",
                                "Paul Atreides, một chàng trai trẻ tài năng được định mệnh cho những điều vĩ đại, phải đến hành tinh nguy hiểm nhất vũ trụ.",
                                155, "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
                                "https://www.youtube.com/watch?v=8g18jFHCLXk",
                                LocalDate.of(2021, 10, 22), Movie.MovieStatus.ENDED, 8.0));

                movies.add(createMovie("Shang-Chi and the Legend of the Ten Rings", "Destin Daniel Cretton",
                                "Simu Liu, Awkwafina, Tony Leung",
                                "Shang-Chi phải đối mặt với quá khứ khi bị lôi kéo vào tổ chức bí ẩn Ten Rings.",
                                132, "https://image.tmdb.org/t/p/w500/1BIoJGKbXjdFDAqUEiA2VHqkK1Z.jpg",
                                "https://www.youtube.com/watch?v=8YjFbMbfXaQ",
                                LocalDate.of(2021, 9, 3), Movie.MovieStatus.ENDED, 7.4));

                movies.add(createMovie("Eternals", "Chloé Zhao",
                                "Gemma Chan, Richard Madden, Angelina Jolie, Salma Hayek",
                                "Nhóm siêu anh hùng bất tử Eternals phải bảo vệ Trái Đất khỏi những sinh vật cổ đại.",
                                157, "https://image.tmdb.org/t/p/w500/bcCBq9N1EMo3daNIjWJ8kYvrQm6.jpg",
                                "https://www.youtube.com/watch?v=x_me3xsvDgk",
                                LocalDate.of(2021, 11, 5), Movie.MovieStatus.ENDED, 6.4));

                // 2022
                movies.add(createMovie("Avatar: The Way of Water", "James Cameron",
                                "Sam Worthington, Zoe Saldana, Sigourney Weaver, Kate Winslet",
                                "Jake Sully sống với gia đình mới trên Pandora. Khi mối đe dọa quen thuộc quay trở lại, họ phải làm việc với clan Metkayina.",
                                192, "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
                                "https://www.youtube.com/watch?v=d9MyW72ELq0",
                                LocalDate.of(2022, 12, 16), Movie.MovieStatus.ENDED, 7.6));

                movies.add(createMovie("Top Gun: Maverick", "Joseph Kosinski",
                                "Tom Cruise, Miles Teller, Jennifer Connelly, Jon Hamm",
                                "Sau hơn 30 năm phục vụ, Pete 'Maverick' Mitchell phải huấn luyện một nhóm phi công Top Gun cho nhiệm vụ đặc biệt.",
                                130, "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
                                "https://www.youtube.com/watch?v=qSqVVswa420",
                                LocalDate.of(2022, 5, 27), Movie.MovieStatus.ENDED, 8.3));

                movies.add(createMovie("The Batman", "Matt Reeves",
                                "Robert Pattinson, Zoë Kravitz, Paul Dano, Colin Farrell",
                                "Batman điều tra một loạt vụ giết người ở Gotham City, dẫn đến việc phơi bày sự tham nhũng.",
                                176, "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fvber9h3tpEhF6J.jpg",
                                "https://www.youtube.com/watch?v=mqqft2x_Aa4",
                                LocalDate.of(2022, 3, 4), Movie.MovieStatus.ENDED, 7.7));

                movies.add(createMovie("Black Panther: Wakanda Forever", "Ryan Coogler",
                                "Letitia Wright, Lupita Nyong'o, Danai Gurira, Angela Bassett",
                                "Wakanda chiến đấu để bảo vệ đất nước sau cái chết của Vua T'Challa, đối mặt với kẻ thù mới Namor.",
                                161, "https://image.tmdb.org/t/p/w500/sv1xJUazXeYqALJL7LrEJk8JpwJ.jpg",
                                "https://www.youtube.com/watch?v=_Z3QKkl1WyM",
                                LocalDate.of(2022, 11, 11), Movie.MovieStatus.ENDED, 7.3));

                movies.add(createMovie("Doctor Strange in the Multiverse of Madness", "Sam Raimi",
                                "Benedict Cumberbatch, Elizabeth Olsen, Xochitl Gomez",
                                "Doctor Strange đi qua các vũ trụ thay thế để đối mặt với một kẻ thù mới bí ẩn và mạnh mẽ.",
                                126, "https://image.tmdb.org/t/p/w500/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg",
                                "https://www.youtube.com/watch?v=aWzlQ2N6qqg",
                                LocalDate.of(2022, 5, 6), Movie.MovieStatus.ENDED, 7.0));

                // 2023
                movies.add(createMovie("Oppenheimer", "Christopher Nolan",
                                "Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.",
                                "Câu chuyện về J. Robert Oppenheimer và vai trò của ông trong việc phát triển bom nguyên tử.",
                                180, "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
                                "https://www.youtube.com/watch?v=uYPbbksJxIg",
                                LocalDate.of(2023, 7, 21), Movie.MovieStatus.ENDED, 8.9));

                movies.add(createMovie("Barbie", "Greta Gerwig",
                                "Margot Robbie, Ryan Gosling, America Ferrera, Kate McKinnon",
                                "Barbie sống ở Barbie Land và bắt đầu đặt câu hỏi về cuộc sống của mình, dẫn đến hành trình khám phá thế giới thực.",
                                114, "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
                                "https://www.youtube.com/watch?v=pBk4NYhWNMM",
                                LocalDate.of(2023, 7, 21), Movie.MovieStatus.ENDED, 7.8));

                movies.add(createMovie("Guardians of the Galaxy Vol. 3", "James Gunn",
                                "Chris Pratt, Zoe Saldana, Dave Bautista, Karen Gillan",
                                "Peter Quill phải tập hợp đội để bảo vệ Rocket khỏi kẻ thù mới High Evolutionary.",
                                150, "https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg",
                                "https://www.youtube.com/watch?v=u3V5KDHRQvk",
                                LocalDate.of(2023, 5, 5), Movie.MovieStatus.ENDED, 8.0));

                movies.add(createMovie("John Wick: Chapter 4", "Chad Stahelski",
                                "Keanu Reeves, Donnie Yen, Bill Skarsgård, Laurence Fishburne",
                                "John Wick khám phá con đường để đánh bại High Table, đối mặt với kẻ thù mới và đồng minh cũ.",
                                169, "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
                                "https://www.youtube.com/watch?v=qEVUtrk8_B4",
                                LocalDate.of(2023, 3, 24), Movie.MovieStatus.ENDED, 7.7));

                movies.add(createMovie("The Super Mario Bros. Movie", "Aaron Horvath, Michael Jelenic",
                                "Chris Pratt, Anya Taylor-Joy, Charlie Day, Jack Black",
                                "Mario và Luigi bị hút vào thế giới Mushroom Kingdom và phải cứu Princess Peach khỏi Bowser.",
                                92, "https://image.tmdb.org/t/p/w500/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg",
                                "https://www.youtube.com/watch?v=TnGl01FkMMo",
                                LocalDate.of(2023, 4, 5), Movie.MovieStatus.ENDED, 7.1));

                movies.add(createMovie("Mission: Impossible - Dead Reckoning Part One", "Christopher McQuarrie",
                                "Tom Cruise, Hayley Atwell, Ving Rhames",
                                "Ethan Hunt và đội IMF phải theo dõi một vũ khí mới nguy hiểm trước khi rơi vào tay kẻ xấu.",
                                163, "https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg",
                                "https://www.youtube.com/watch?v=avz06PDqDbM",
                                LocalDate.of(2023, 7, 12), Movie.MovieStatus.ENDED, 7.8));

                movies.add(createMovie("Wonka", "Paul King", "Timothée Chalamet, Olivia Colman, Hugh Grant",
                                "Câu chuyện nguồn gốc về nhà làm sô-cô-la thiên tài Willy Wonka.",
                                116, "https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg",
                                "https://www.youtube.com/watch?v=otNh9bTjXWg",
                                LocalDate.of(2023, 12, 15), Movie.MovieStatus.ENDED, 7.2));

                // 2024
                movies.add(createMovie("Dune: Part Two", "Denis Villeneuve",
                                "Timothée Chalamet, Zendaya, Rebecca Ferguson, Austin Butler",
                                "Paul Atreides hợp nhất với Chani và người Fremen trong cuộc chiến báo thù chống lại những kẻ đã phá hủy gia đình anh.",
                                166, "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
                                "https://www.youtube.com/watch?v=Way9Dexny3w",
                                LocalDate.of(2024, 3, 1), Movie.MovieStatus.ENDED, 8.8));

                movies.add(createMovie("Kung Fu Panda 4", "Mike Mitchell",
                                "Jack Black, Awkwafina, Viola Davis, Dustin Hoffman",
                                "Po được chọn làm Thủ lĩnh tâm linh của Thung lũng Hòa bình và phải tìm Dragon Warrior mới.",
                                94, "https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
                                "https://www.youtube.com/watch?v=_inKs4eeHiI",
                                LocalDate.of(2024, 3, 8), Movie.MovieStatus.ENDED, 7.0));

                movies.add(createMovie("Godzilla x Kong: The New Empire", "Adam Wingard",
                                "Rebecca Hall, Brian Tyree Henry, Dan Stevens",
                                "Godzilla và Kong phải hợp tác để đối mặt với mối đe dọa chưa từng có từ Hollow Earth.",
                                115, "https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg",
                                "https://www.youtube.com/watch?v=lV1OOlGwExM",
                                LocalDate.of(2024, 3, 29), Movie.MovieStatus.ENDED, 6.6));

                movies.add(createMovie("Inside Out 2", "Kelsey Mann",
                                "Amy Poehler, Maya Hawke, Kensington Tallman, Liza Lapira",
                                "Riley bước vào tuổi thiếu niên và gặp gỡ những cảm xúc mới như Anxiety, Envy, Ennui và Embarrassment.",
                                96, "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
                                "https://www.youtube.com/watch?v=LEjhY15eCx0",
                                LocalDate.of(2024, 6, 14), Movie.MovieStatus.ENDED, 8.2));

                movies.add(createMovie("Deadpool & Wolverine", "Shawn Levy", "Ryan Reynolds, Hugh Jackman, Emma Corrin",
                                "Deadpool và Wolverine phải hợp tác để cứu đa vũ trụ khỏi bị hủy diệt.",
                                128, "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
                                "https://www.youtube.com/watch?v=73_1biulkYk",
                                LocalDate.of(2024, 7, 26), Movie.MovieStatus.ENDED, 8.5));

                movies.add(createMovie("Furiosa: A Mad Max Saga", "George Miller",
                                "Anya Taylor-Joy, Chris Hemsworth, Tom Burke",
                                "Câu chuyện nguồn gốc của Furiosa trước khi gặp Max Rockatansky.",
                                148, "https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg",
                                "https://www.youtube.com/watch?v=XJMuhwVlca4",
                                LocalDate.of(2024, 5, 24), Movie.MovieStatus.ENDED, 7.6));

                movies.add(createMovie("The Fall Guy", "David Leitch",
                                "Ryan Gosling, Emily Blunt, Aaron Taylor-Johnson",
                                "Một diễn viên đóng thế phải tìm kiếm ngôi sao phim mất tích trong khi giành lại tình yêu cũ.",
                                126, "https://image.tmdb.org/t/p/w500/tSz1qsmSJon0rqjHBxXZmrotuse.jpg",
                                "https://www.youtube.com/watch?v=j3t8jSfjIgY",
                                LocalDate.of(2024, 5, 3), Movie.MovieStatus.ENDED, 7.3));

                movies.add(createMovie("Despicable Me 4", "Chris Renaud", "Steve Carell, Kristen Wiig, Will Ferrell",
                                "Gru, Lucy và các cô gái chào đón thành viên mới Gru Jr., đồng thời đối mặt với kẻ thù mới Maxime Le Mal.",
                                95, "https://image.tmdb.org/t/p/w500/wWba3TaojhK7NdycRhoQpsG0FaH.jpg",
                                "https://www.youtube.com/watch?v=qQlr9-rF32A",
                                LocalDate.of(2024, 7, 3), Movie.MovieStatus.ENDED, 6.8));

                movies.add(createMovie("Alien: Romulus", "Fede Álvarez", "Cailee Spaeny, David Jonsson, Archie Renaux",
                                "Nhóm người trẻ khám phá trạm vũ trụ bỏ hoang và phải đối mặt với sinh vật ngoài hành tinh chết chóc.",
                                119, "https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg",
                                "https://www.youtube.com/watch?v=x0XDEhP4MQs",
                                LocalDate.of(2024, 8, 16), Movie.MovieStatus.ENDED, 7.4));

                movies.add(createMovie("Beetlejuice Beetlejuice", "Tim Burton",
                                "Michael Keaton, Winona Ryder, Jenna Ortega",
                                "Lydia Deetz phải đối mặt lại với Beetlejuice khi con gái cô vô tình mở cổng sang thế giới bên kia.",
                                104, "https://image.tmdb.org/t/p/w500/kKgQzkUCnQmeTPkyIwHly2t6ZFI.jpg",
                                "https://www.youtube.com/watch?v=ykdYU9YvVVk",
                                LocalDate.of(2024, 9, 6), Movie.MovieStatus.ENDED, 7.1));

                movies.add(createMovie("Joker: Folie à Deux", "Todd Phillips",
                                "Joaquin Phoenix, Lady Gaga, Brendan Gleeson",
                                "Arthur Fleck gặp Harley Quinn trong bệnh viện tâm thần Arkham, dẫn đến mối quan hệ điên rồ.",
                                138, "https://image.tmdb.org/t/p/w500/if8QiqCI7WAGImKcJCfzp6VTyKA.jpg",
                                "https://www.youtube.com/watch?v=_OKAwz2MsJs",
                                LocalDate.of(2024, 10, 4), Movie.MovieStatus.ENDED, 5.8));

                movies.add(createMovie("Venom: The Last Dance", "Kelly Marcel",
                                "Tom Hardy, Juno Temple, Chiwetel Ejiofor",
                                "Eddie và Venom phải đưa ra lựa chọn tàn khốc khi họ bị cả hai thế giới truy đuổi.",
                                109, "https://image.tmdb.org/t/p/w500/k42Owka8v91Ey0f4vRsoazXpOTS.jpg",
                                "https://www.youtube.com/watch?v=HyIyd9joTTc",
                                LocalDate.of(2024, 10, 25), Movie.MovieStatus.ENDED, 6.5));

                movies.add(createMovie("Gladiator II", "Ridley Scott",
                                "Paul Mescal, Pedro Pascal, Denzel Washington, Connie Nielsen",
                                "Lucius, con trai của Lucilla, phải chiến đấu trong đấu trường để trả thù cho những gì Rome đã làm với gia đình mình.",
                                148, "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
                                "https://www.youtube.com/watch?v=4rgYUipGJNo",
                                LocalDate.of(2024, 11, 22), Movie.MovieStatus.ENDED, 7.0));

                movies.add(createMovie("Moana 2", "David Derrick Jr., Jason Hand, Dana Ledoux Miller",
                                "Auli'i Cravalho, Dwayne Johnson, Temuera Morrison",
                                "Moana nhận được cuộc gọi từ tổ tiên và phải hành trình đến vùng biển xa xôi của Oceania.",
                                100, "https://image.tmdb.org/t/p/w500/yh64qw9mgXBvlaWDi7Q9tpUBAvH.jpg",
                                "https://www.youtube.com/watch?v=hDZ7y8RP5HE",
                                LocalDate.of(2024, 11, 27), Movie.MovieStatus.ENDED, 7.2));

                movies.add(createMovie("Wicked", "Jon M. Chu",
                                "Cynthia Erivo, Ariana Grande, Michelle Yeoh, Jeff Goldblum",
                                "Câu chuyện về tình bạn giữa Elphaba và Glinda, hai phù thủy ở xứ Oz.",
                                160, "https://image.tmdb.org/t/p/w500/c5Tqxeo1UpBvnAc3csUm7j3hlQl.jpg",
                                "https://www.youtube.com/watch?v=6COmYeLsz4c",
                                LocalDate.of(2024, 11, 22), Movie.MovieStatus.ENDED, 8.0));

                // ============= PHIM ĐANG CHIẾU - NOW_SHOWING =============
                movies.add(createMovie("Thiên Đường Máu", "Nguyễn Quang Dũng", "Tuấn Trần, Kaity Nguyễn, NSND Kim Xuân",
                                "Phim điện ảnh đầu tiên về nạn lừa đảo người Việt ra nước ngoài. Không ít thanh niên bị đưa đến những 'đặc khu' và bị ép buộc gọi điện lừa đảo.",
                                113, "https://image.tmdb.org/t/p/w500/j3gPCCNMUxgUYPrwvLJPSoKvdX.jpg",
                                "https://www.youtube.com/watch?v=example1",
                                LocalDate.of(2025, 12, 31), Movie.MovieStatus.NOW_SHOWING, 9.0));

                movies.add(createMovie("Mufasa: The Lion King", "Barry Jenkins",
                                "Aaron Pierre, Kelvin Harrison Jr., Mads Mikkelsen",
                                "Câu chuyện về nguồn gốc của Mufasa, từ một con sư tử mồ côi trở thành vị vua huyền thoại của Pride Lands.",
                                118, "https://image.tmdb.org/t/p/w500/lurEK87kukWNaHd0zYnsi3yzJrs.jpg",
                                "https://www.youtube.com/watch?v=o17MF9vnabg",
                                LocalDate.of(2025, 12, 20), Movie.MovieStatus.NOW_SHOWING, 7.5));

                movies.add(createMovie("Sonic the Hedgehog 3", "Jeff Fowler",
                                "Ben Schwartz, Jim Carrey, Keanu Reeves, Idris Elba",
                                "Sonic, Knuckles và Tails phải đối mặt với kẻ thù mới Shadow the Hedgehog để cứu thế giới.",
                                109, "https://image.tmdb.org/t/p/w500/d8Ryb8AunYAuycVKDp5HpdWPKgC.jpg",
                                "https://www.youtube.com/watch?v=qSu6i2iFMO0",
                                LocalDate.of(2025, 12, 20), Movie.MovieStatus.NOW_SHOWING, 7.8));

                movies.add(createMovie("Nosferatu", "Robert Eggers",
                                "Bill Skarsgård, Lily-Rose Depp, Nicholas Hoult, Willem Dafoe",
                                "Phiên bản làm lại của bộ phim kinh điển năm 1922 về ma cà rồng Count Orlok ám ảnh một phụ nữ trẻ.",
                                132, "https://image.tmdb.org/t/p/w500/5qGIxdEO841C0tdDjYsHFAi7qCr.jpg",
                                "https://www.youtube.com/watch?v=nulvWqYUM8k",
                                LocalDate.of(2025, 12, 25), Movie.MovieStatus.NOW_SHOWING, 8.1));

                movies.add(createMovie("Kraven the Hunter", "J.C. Chandor",
                                "Aaron Taylor-Johnson, Ariana DeBose, Russell Crowe",
                                "Câu chuyện nguồn gốc của một trong những kẻ thù đáng sợ nhất của Spider-Man.",
                                127, "https://image.tmdb.org/t/p/w500/i47IUSsN126K11JUzqQIOi1Mg1M.jpg",
                                "https://www.youtube.com/watch?v=gnDmJPJnD00",
                                LocalDate.of(2025, 12, 13), Movie.MovieStatus.NOW_SHOWING, 6.2));

                movies.add(createMovie("A Complete Unknown", "James Mangold",
                                "Timothée Chalamet, Edward Norton, Elle Fanning",
                                "Câu chuyện về Bob Dylan từ ca sĩ folk vô danh trở thành huyền thoại âm nhạc.",
                                140, "https://image.tmdb.org/t/p/w500/lntrXpIi9PfhBJejKo5m7cjVDbA.jpg",
                                "https://www.youtube.com/watch?v=QaLPdFHTCfo",
                                LocalDate.of(2025, 12, 25), Movie.MovieStatus.NOW_SHOWING, 7.8));

                // ============= PHIM SẮP CHIẾU - COMING_SOON =============
                movies.add(createMovie("Captain America: Brave New World", "Julius Onah",
                                "Anthony Mackie, Harrison Ford, Tim Blake Nelson",
                                "Sam Wilson tiếp tục di sản của Captain America trong thế giới mới đầy biến động chính trị.",
                                120, "https://image.tmdb.org/t/p/w500/pzIddUEMWhiHYxavvgX5nLrjuqT.jpg",
                                "https://www.youtube.com/watch?v=example3",
                                LocalDate.of(2026, 2, 14), Movie.MovieStatus.COMING_SOON, 0.0));

                movies.add(createMovie("Snow White", "Marc Webb", "Rachel Zegler, Gal Gadot, Andrew Burnap",
                                "Phiên bản live-action của câu chuyện cổ tích kinh điển Bạch Tuyết và bảy chú lùn.",
                                110, "https://image.tmdb.org/t/p/w500/sSh8JVGxfHSIqerbnUrUZrVsCC.jpg",
                                "https://www.youtube.com/watch?v=example4",
                                LocalDate.of(2026, 3, 21), Movie.MovieStatus.COMING_SOON, 0.0));

                movies.add(createMovie("Avatar 3", "James Cameron",
                                "Sam Worthington, Zoe Saldana, Sigourney Weaver, Kate Winslet",
                                "Tiếp tục câu chuyện của Jake Sully và gia đình trên Pandora, khám phá vùng đất mới.",
                                180, "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
                                "https://www.youtube.com/watch?v=example5",
                                LocalDate.of(2026, 12, 19), Movie.MovieStatus.COMING_SOON, 0.0));

                movies.add(createMovie("Jurassic World Rebirth", "Gareth Edwards",
                                "Scarlett Johansson, Jonathan Bailey, Mahershala Ali",
                                "Chương mới trong loạt phim khủng long huyền thoại với những sinh vật kỷ Jura đã tiến hóa.",
                                140, "https://image.tmdb.org/t/p/w500/hkxxMIGaiCTmrEArK7J56JTKUlB.jpg",
                                "https://www.youtube.com/watch?v=example6",
                                LocalDate.of(2026, 7, 2), Movie.MovieStatus.COMING_SOON, 0.0));

                movies.add(createMovie("The Fantastic Four: First Steps", "Matt Shakman",
                                "Pedro Pascal, Vanessa Kirby, Joseph Quinn, Ebon Moss-Bachrach",
                                "Gia đình siêu anh hùng đầu tiên của Marvel giới thiệu với MCU.",
                                150, "https://image.tmdb.org/t/p/w500/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg",
                                "https://www.youtube.com/watch?v=example7",
                                LocalDate.of(2026, 7, 25), Movie.MovieStatus.COMING_SOON, 0.0));

                movies.add(createMovie("Mission: Impossible 8", "Christopher McQuarrie",
                                "Tom Cruise, Hayley Atwell, Simon Pegg, Ving Rhames",
                                "Ethan Hunt đối mặt với thử thách lớn nhất trong sự nghiệp IMF.",
                                160, "https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg",
                                "https://www.youtube.com/watch?v=example8",
                                LocalDate.of(2026, 5, 23), Movie.MovieStatus.COMING_SOON, 0.0));

                movies.add(createMovie("Zootopia 2", "Byron Howard, Jared Bush",
                                "Ginnifer Goodwin, Jason Bateman, Idris Elba",
                                "Judy Hopps và Nick Wilde tiếp tục phiêu lưu mới trong thành phố động vật.",
                                100, "https://image.tmdb.org/t/p/w500/sM33SANp9z6rXW8Itn7NnG1GOEs.jpg",
                                "https://www.youtube.com/watch?v=example9",
                                LocalDate.of(2026, 11, 26), Movie.MovieStatus.COMING_SOON, 0.0));

                movies.add(createMovie("Toy Story 5", "Andrew Stanton", "Tom Hanks, Tim Allen, Annie Potts",
                                "Woody, Buzz và nhóm đồ chơi trở lại với cuộc phiêu lưu mới.",
                                100, "https://image.tmdb.org/t/p/w500/w9kR8qbmQ01HwnvK4alvnQ2ca0L.jpg",
                                "https://www.youtube.com/watch?v=example10",
                                LocalDate.of(2026, 6, 19), Movie.MovieStatus.COMING_SOON, 0.0));

                movieRepository.saveAll(movies);
                log.info("Created {} sample movies", movies.size());
        }

        private Movie createMovie(String title, String director, String actors, String description,
                        int duration, String posterUrl, String trailerUrl,
                        LocalDate releaseDate, Movie.MovieStatus status, double rating) {
                return Movie.builder()
                                .title(title)
                                .director(director)
                                .actors(actors)
                                .description(description)
                                .duration(duration)
                                .posterUrl(posterUrl)
                                .trailerUrl(trailerUrl)
                                .releaseDate(releaseDate)
                                .status(status)
                                .rating(rating)
                                .genre("Action, Adventure")
                                .language("Tiếng Anh")
                                .build();
        }

        private void initPricingLogic() {
                log.info("Initializing pricing logic (Rate Cards)...");

                // 1. Create Price Header (Standard 2024) - Keeping for legacy support if needed
                if (priceHeaderRepository.findActiveHeadersForDate(LocalDate.of(2024, 6, 1)).isEmpty()) {
                        PriceHeader standardHeader = PriceHeader.builder()
                                        .name("Bảng Giá Tiêu Chuẩn 2024")
                                        .startDate(LocalDate.of(2024, 1, 1))
                                        .endDate(LocalDate.of(2024, 12, 31))
                                        .priority(1)
                                        .active(true)
                                        .build();
                        standardHeader = priceHeaderRepository.save(standardHeader);
                        createFullPriceList(standardHeader);
                        log.info("Created Price Header 2024");
                }

                // 2. Create Price Header (Standard 2025)
                if (priceHeaderRepository.findActiveHeadersForDate(LocalDate.of(2025, 6, 1)).isEmpty()) {
                        PriceHeader header2025 = PriceHeader.builder()
                                        .name("Bảng Giá Tiêu Chuẩn 2025")
                                        .startDate(LocalDate.of(2025, 1, 1))
                                        .endDate(LocalDate.of(2025, 12, 31))
                                        .priority(1)
                                        .active(true)
                                        .build();
                        header2025 = priceHeaderRepository.save(header2025);
                        createFullPriceList(header2025);
                        log.info("Created Price Header 2025 with full price lines");
                }

                // 3. Create Price Header (Standard 2026)
                if (priceHeaderRepository.findActiveHeadersForDate(LocalDate.of(2026, 6, 1)).isEmpty()) {
                        PriceHeader header2026 = PriceHeader.builder()
                                        .name("Bảng Giá Tiêu Chuẩn 2026")
                                        .startDate(LocalDate.of(2026, 1, 1))
                                        .endDate(LocalDate.of(2026, 12, 31))
                                        .priority(1)
                                        .active(true)
                                        .build();
                        header2026 = priceHeaderRepository.save(header2026);
                        createFullPriceList(header2026);
                        log.info("Created Price Header 2026 with full price lines");
                }

                // 4. Create Surcharges
                initSurcharges();
        }

        private void initSurcharges() {
                List<Surcharge> surcharges = new ArrayList<>();

                // VIP Seat
                if (surchargeRepository.findByType(Surcharge.SurchargeType.SEAT_TYPE).stream()
                                .noneMatch(s -> "VIP".equals(s.getTargetId()))) {
                        surcharges.add(Surcharge.builder().name("VIP Seat").type(Surcharge.SurchargeType.SEAT_TYPE)
                                        .targetId("VIP").amount(new BigDecimal("15000")).active(true).build());
                }
                // Couple Seat
                if (surchargeRepository.findByType(Surcharge.SurchargeType.SEAT_TYPE).stream()
                                .noneMatch(s -> "COUPLE".equals(s.getTargetId()))) {
                        surcharges.add(Surcharge.builder().name("Couple Seat").type(Surcharge.SurchargeType.SEAT_TYPE)
                                        .targetId("COUPLE").amount(new BigDecimal("20000")).active(true).build());
                }

                if (!surcharges.isEmpty()) {
                        surchargeRepository.saveAll(surcharges);
                        log.info("Created {} surcharges", surcharges.size());
                }
        }

        private void createFullPriceList(PriceHeader header) {
                List<PriceLine> lines = new ArrayList<>();

                // Iterate all combinations
                for (PriceLine.CustomerType customer : PriceLine.CustomerType.values()) {
                        for (PriceLine.DayType day : PriceLine.DayType.values()) {
                                for (PriceLine.TimeSlot slot : PriceLine.TimeSlot.values()) {
                                        for (Room.RoomType room : Room.RoomType.values()) {
                                                BigDecimal price = calculateBasePrice(customer, day, slot, room);
                                                lines.add(createPriceLine(header, customer, day, slot, room, price));
                                        }
                                }
                        }
                }
                priceLineRepository.saveAll(lines);
        }

        private BigDecimal calculateBasePrice(PriceLine.CustomerType customer, PriceLine.DayType day,
                        PriceLine.TimeSlot slot, Room.RoomType room) {
                // Base price (Adult, Weekday, Morning, Standard 2D)
                BigDecimal base = new BigDecimal("60000");

                // 1. Room Type Modifiers
                if (room == Room.RoomType.STANDARD_3D)
                        base = base.add(new BigDecimal("30000"));
                else if (room == Room.RoomType.IMAX)
                        base = base.add(new BigDecimal("60000"));
                else if (room == Room.RoomType.VIP_4DX)
                        base = base.add(new BigDecimal("80000"));

                // 2. Day Type Modifiers
                if (day == PriceLine.DayType.WEEKEND)
                        base = base.add(new BigDecimal("20000"));
                else if (day == PriceLine.DayType.HOLIDAY)
                        base = base.add(new BigDecimal("30000"));
                // Happy Day might be cheaper
                else if (day == PriceLine.DayType.HAPPY_DAY)
                        base = base.add(new BigDecimal("0")); // Keep base low

                // 3. Time Slot Modifiers
                if (slot == PriceLine.TimeSlot.DAY || slot == PriceLine.TimeSlot.EVENING) {
                        base = base.add(new BigDecimal("20000")); // Peak hours
                } else if (slot == PriceLine.TimeSlot.LATE) {
                        base = base.add(new BigDecimal("10000")); // Late night slightly more than morning
                }

                // 4. Customer Type Modifiers (Discounts)
                // Ensure price doesn't go below a minimum threshold (e.g. 45k)
                BigDecimal discount = BigDecimal.ZERO;
                switch (customer) {
                        case STUDENT:
                        case U22:
                        case SENIOR:
                                discount = new BigDecimal("15000");
                                break;
                        case MEMBER:
                                discount = new BigDecimal("10000");
                                break;
                        case VIP_MEMBER:
                                discount = new BigDecimal("20000");
                                break;
                        default:
                                break;
                }

                BigDecimal finalPrice = base.subtract(discount);
                if (finalPrice.compareTo(new BigDecimal("45000")) < 0) {
                        finalPrice = new BigDecimal("45000"); // Minimum floor price
                }

                return finalPrice;
        }

        private PriceLine createPriceLine(PriceHeader header, PriceLine.CustomerType customerType,
                        PriceLine.DayType dayType, PriceLine.TimeSlot timeSlot, Room.RoomType roomType,
                        BigDecimal price) {
                return PriceLine.builder()
                                .priceHeader(header)
                                .customerType(customerType)
                                .dayType(dayType)
                                .timeSlot(timeSlot)
                                .roomType(roomType)
                                .price(price)
                                .build();
        }

        private void initShowtimes() {
                log.info("Initializing showtimes...");

                // Lấy tất cả phim đang chiếu
                List<Movie> nowShowingMovies = movieRepository.findByStatus(Movie.MovieStatus.NOW_SHOWING,
                                org.springframework.data.domain.Pageable.unpaged()).getContent();

                // Nếu không có phim đang chiếu, lấy tất cả phim
                if (nowShowingMovies.isEmpty()) {
                        nowShowingMovies = movieRepository.findAll();
                        log.info("No NOW_SHOWING movies found, using all {} movies", nowShowingMovies.size());
                }

                List<Room> rooms = roomRepository.findAll();

                if (nowShowingMovies.isEmpty()) {
                        log.warn("No movies found, skipping showtime initialization");
                        return;
                }

                if (rooms.isEmpty()) {
                        log.warn("No rooms found, skipping showtime initialization");
                        return;
                }

                log.info("Creating showtimes for {} movies in {} rooms (Sequential Non-Overlapping)",
                                nowShowingMovies.size(),
                                rooms.size());

                List<Showtime> showtimes = new ArrayList<>();
                LocalDate today = LocalDate.now();
                Random random = new Random();

                // Các tham số cấu hình
                int cleaningMinutes = 45; // Thời gian dọn dẹp giữa các suất (Khoảng cách giữa các phim) -> Tăng lên 45p
                                          // theo yêu cầu
                LocalTime dayStartTime = LocalTime.of(9, 0); // Giờ mở cửa đầu ngày
                LocalTime lastShowCutoff = LocalTime.of(22, 30); // Không chiếu phim sau giờ này

                // Tạo lịch chiếu cho 14 ngày
                for (int day = 0; day < 14; day++) {
                        LocalDate showDate = today.plusDays(day);
                        boolean isWeekend = showDate.getDayOfWeek().getValue() >= 5; // Fri(5), Sat(6), Sun(7)

                        for (Room room : rooms) {
                                LocalTime currentShiftTime = dayStartTime;

                                // Lặp để tạo các suất chiếu nối tiếp nhau trong ngày cho phòng này
                                while (true) {
                                        // 1. Chọn phim ngẫu nhiên (có thể cải thiện logic chọn phim theo độ hot)
                                        Movie movie = nowShowingMovies.get(random.nextInt(nowShowingMovies.size()));

                                        // 2. Tính toán thời gian
                                        LocalTime endTime;
                                        try {
                                                // start + duration
                                                endTime = currentShiftTime.plusMinutes(movie.getDuration());
                                        } catch (Exception e) {
                                                // Tràn qua ngày hôm sau -> dừng
                                                break;
                                        }

                                        // Kiểm tra nếu giờ bắt đầu đã quá muộn
                                        if (currentShiftTime.isAfter(lastShowCutoff)) {
                                                break;
                                        }
                                        // Kiểm tra nếu giờ kết thúc trôi qua ngày hôm sau quá nhiều (ví dụ 2-3h sáng
                                        // ok, nhưng quá thì thôi)
                                        // LocalTime wraps around, so if endTime < startTime and endTime is late
                                        // morning, it's weird.
                                        // Simple logic: if startTime is late (e.g. 23:00) and duration is long, endTime
                                        // is early morning.
                                        // We allow late shows.

                                        // 3. Tính giá vé (Logic đơn giản hóa dựa trên initTicketPrices)
                                        BigDecimal price = calculateSamplePrice(room.getRoomType(), isWeekend,
                                                        currentShiftTime);

                                        // 4. Tạo Showtime
                                        showtimes.add(createShowtime(movie, room, showDate, currentShiftTime, price));

                                        // 5. Cập nhật thời gian cho suất tiếp theo
                                        // startNext = end + cleaning
                                        LocalTime nextSlot = endTime.plusMinutes(cleaningMinutes);
                                        // Round up to nearest 15 minutes
                                        currentShiftTime = roundToNext15Minutes(nextSlot);

                                        // Nếu qua ngày mới (wrap around 24h) -> break
                                        if (currentShiftTime.isBefore(LocalTime.of(8, 0))
                                                        && currentShiftTime.isAfter(LocalTime.of(0, 0))) {
                                                break; // Kết thúc lịch ngày hôm nay
                                        }
                                }
                        }
                }

                showtimeRepository.saveAll(showtimes);
                log.info("Created {} showtimes for 14 days across {} rooms", showtimes.size(), rooms.size());
        }

        private LocalTime roundToNext15Minutes(LocalTime time) {
                int minute = time.getMinute();
                int remainder = minute % 15;
                if (remainder == 0) {
                        return time.withSecond(0).withNano(0);
                }
                int minutesToAdd = 15 - remainder;
                return time.plusMinutes(minutesToAdd).withSecond(0).withNano(0);
        }

        private BigDecimal calculateSamplePrice(Room.RoomType roomType, boolean isWeekend, LocalTime startTime) {
                // Base calculation matching initTicketPrices logic
                BigDecimal price;

                // 1. Determine Base based on Room Type
                if (roomType == Room.RoomType.IMAX) {
                        price = new BigDecimal("150000"); // Base IMAX
                } else if (roomType == Room.RoomType.VIP_4DX) {
                        price = new BigDecimal("160000"); // Base 4DX
                } else if (roomType == Room.RoomType.STANDARD_3D) {
                        price = new BigDecimal("120000"); // Base 3D
                } else {
                        // Standard 2D
                        // Check Weekend
                        if (isWeekend) {
                                // Morning (< 12:00) vs Afternoon
                                if (startTime.isBefore(LocalTime.of(12, 0))) {
                                        price = new BigDecimal("75000");
                                } else {
                                        price = new BigDecimal("105000");
                                }
                        } else {
                                // Weekday
                                if (startTime.isBefore(LocalTime.of(12, 0))) {
                                        price = new BigDecimal("65000");
                                } else {
                                        price = new BigDecimal("85000");
                                }
                        }
                }
                return price;
        }

        private Showtime createShowtime(Movie movie, Room room, LocalDate showDate, LocalTime startTime,
                        BigDecimal price) {
                LocalTime endTime = startTime.plusMinutes(movie.getDuration());
                return Showtime.builder()
                                .movie(movie)
                                .room(room)
                                .showDate(showDate)
                                .startTime(startTime)
                                .endTime(endTime)
                                .basePrice(price)
                                .status(Showtime.ShowtimeStatus.AVAILABLE)
                                .build();
        }

        private void initSampleReviews() {
                log.info("Initializing sample reviews...");
                List<Movie> movies = movieRepository.findAll();
                List<User> users = userRepository.findAll();

                if (movies.isEmpty() || users.isEmpty()) {
                        log.warn("No movies or users found, skipping review initialization");
                        return;
                }

                String[] comments = {
                                "Phim hay đáng để trải nghiệm",
                                "Tuyệt vời! Đáng xem nhất năm",
                                "Hình ảnh đẹp, diễn xuất tốt",
                                "Phim phản ánh kịp thời tình trạng hiện nay. Nhưng tinh tiết nhìu chỗ gượng gạo không tự nhiên.",
                                "Hay, nên xem",
                                "Phim nên xem vì có ý nghĩa khi chạm đúng tình trạng phức tạp xã hội nhưng ko đánh giá cao về nội dung và phần xử lý hình ảnh, đồ họa, góc quay.",
                                "Kịch bản khá tốt, nhưng có thể làm tốt hơn",
                                "Đáng tiền vé, sẽ xem lại",
                                "Phim ổn, giải trí tốt"
                };

                Random random = new Random();
                List<Review> reviews = new ArrayList<>();

                for (Movie movie : movies) {
                        if (movie.getStatus() == Movie.MovieStatus.COMING_SOON)
                                continue;

                        int reviewCount = 3 + random.nextInt(8); // 3-10 reviews per movie
                        for (int i = 0; i < reviewCount && i < users.size(); i++) {
                                Review review = Review.builder()
                                                .movie(movie)
                                                .user(users.get(i % users.size()))
                                                .rating(6 + random.nextInt(5)) // 6-10
                                                .content(comments[random.nextInt(comments.length)])
                                                .likesCount(random.nextInt(50))
                                                .isSpoiler(random.nextInt(10) < 2) // 20% chance spoiler
                                                .build();
                                reviews.add(review);
                        }
                }

                reviewRepository.saveAll(reviews);
                log.info("Created {} sample reviews", reviews.size());
        }

        private void initFoodsAndCombos() {
                log.info("Initializing foods and combos...");
                List<Food> foods = new ArrayList<>();

                // ============== BẮP RANG (POPCORN) ==============
                foods.add(Food.builder()
                                .name("Bắp Rang Bơ")
                                .description("Bắp rang giòn tan với bơ thơm ngậy, hương vị cổ điển")
                                .imageUrl("https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400")
                                .price(new BigDecimal("45000"))
                                .category(Food.FoodCategory.POPCORN)
                                .size(Food.FoodSize.SMALL)
                                .calories(250)
                                .sortOrder(1)
                                .build());

                foods.add(Food.builder()
                                .name("Bắp Rang Bơ")
                                .description("Bắp rang giòn tan với bơ thơm ngậy, hương vị cổ điển")
                                .imageUrl("https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400")
                                .price(new BigDecimal("55000"))
                                .category(Food.FoodCategory.POPCORN)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(400)
                                .sortOrder(2)
                                .build());

                foods.add(Food.builder()
                                .name("Bắp Rang Bơ")
                                .description("Bắp rang giòn tan với bơ thơm ngậy, hương vị cổ điển")
                                .imageUrl("https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400")
                                .price(new BigDecimal("69000"))
                                .category(Food.FoodCategory.POPCORN)
                                .size(Food.FoodSize.LARGE)
                                .calories(600)
                                .sortOrder(3)
                                .build());

                foods.add(Food.builder()
                                .name("Bắp Rang Caramel")
                                .description("Bắp rang phủ caramel ngọt ngào, giòn rụm")
                                .imageUrl("https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400")
                                .price(new BigDecimal("49000"))
                                .category(Food.FoodCategory.POPCORN)
                                .size(Food.FoodSize.SMALL)
                                .calories(300)
                                .sortOrder(4)
                                .build());

                foods.add(Food.builder()
                                .name("Bắp Rang Caramel")
                                .description("Bắp rang phủ caramel ngọt ngào, giòn rụm")
                                .imageUrl("https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400")
                                .price(new BigDecimal("59000"))
                                .category(Food.FoodCategory.POPCORN)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(450)
                                .sortOrder(5)
                                .build());

                foods.add(Food.builder()
                                .name("Bắp Rang Caramel")
                                .description("Bắp rang phủ caramel ngọt ngào, giòn rụm")
                                .imageUrl("https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400")
                                .price(new BigDecimal("75000"))
                                .category(Food.FoodCategory.POPCORN)
                                .size(Food.FoodSize.LARGE)
                                .calories(650)
                                .sortOrder(6)
                                .build());

                foods.add(Food.builder()
                                .name("Bắp Rang Phô Mai")
                                .description("Bắp rang với phô mai Cheddar béo ngậy, đậm đà")
                                .imageUrl("https://images.unsplash.com/photo-1604476322443-1d7a45d02944?w=400")
                                .price(new BigDecimal("55000"))
                                .category(Food.FoodCategory.POPCORN)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(420)
                                .sortOrder(7)
                                .build());

                foods.add(Food.builder()
                                .name("Bắp Rang Phô Mai")
                                .description("Bắp rang với phô mai Cheddar béo ngậy, đậm đà")
                                .imageUrl("https://images.unsplash.com/photo-1604476322443-1d7a45d02944?w=400")
                                .price(new BigDecimal("72000"))
                                .category(Food.FoodCategory.POPCORN)
                                .size(Food.FoodSize.LARGE)
                                .calories(620)
                                .sortOrder(8)
                                .build());

                foods.add(Food.builder()
                                .name("Bắp Rang Mix (Bơ + Caramel)")
                                .description("Kết hợp hoàn hảo giữa bắp rang bơ mặn và caramel ngọt")
                                .imageUrl("https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400")
                                .price(new BigDecimal("65000"))
                                .category(Food.FoodCategory.POPCORN)
                                .size(Food.FoodSize.LARGE)
                                .calories(580)
                                .sortOrder(9)
                                .build());

                // ============== ĐỒ UỐNG (DRINKS) ==============
                foods.add(Food.builder()
                                .name("Coca-Cola")
                                .description("Nước ngọt có gas Coca-Cola mát lạnh")
                                .imageUrl("https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400")
                                .price(new BigDecimal("25000"))
                                .category(Food.FoodCategory.DRINK)
                                .size(Food.FoodSize.SMALL)
                                .calories(140)
                                .sortOrder(10)
                                .build());

                foods.add(Food.builder()
                                .name("Coca-Cola")
                                .description("Nước ngọt có gas Coca-Cola mát lạnh")
                                .imageUrl("https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400")
                                .price(new BigDecimal("32000"))
                                .category(Food.FoodCategory.DRINK)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(200)
                                .sortOrder(11)
                                .build());

                foods.add(Food.builder()
                                .name("Coca-Cola")
                                .description("Nước ngọt có gas Coca-Cola mát lạnh")
                                .imageUrl("https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400")
                                .price(new BigDecimal("39000"))
                                .category(Food.FoodCategory.DRINK)
                                .size(Food.FoodSize.LARGE)
                                .calories(290)
                                .sortOrder(12)
                                .build());

                foods.add(Food.builder()
                                .name("Pepsi")
                                .description("Nước ngọt có gas Pepsi sảng khoái")
                                .imageUrl("https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400")
                                .price(new BigDecimal("25000"))
                                .category(Food.FoodCategory.DRINK)
                                .size(Food.FoodSize.SMALL)
                                .calories(150)
                                .sortOrder(13)
                                .build());

                foods.add(Food.builder()
                                .name("Pepsi")
                                .description("Nước ngọt có gas Pepsi sảng khoái")
                                .imageUrl("https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400")
                                .price(new BigDecimal("32000"))
                                .category(Food.FoodCategory.DRINK)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(210)
                                .sortOrder(14)
                                .build());

                foods.add(Food.builder()
                                .name("Sprite")
                                .description("Nước chanh có gas Sprite thanh mát")
                                .imageUrl("https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400")
                                .price(new BigDecimal("25000"))
                                .category(Food.FoodCategory.DRINK)
                                .size(Food.FoodSize.SMALL)
                                .calories(140)
                                .sortOrder(15)
                                .build());

                foods.add(Food.builder()
                                .name("Sprite")
                                .description("Nước chanh có gas Sprite thanh mát")
                                .imageUrl("https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400")
                                .price(new BigDecimal("32000"))
                                .category(Food.FoodCategory.DRINK)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(200)
                                .sortOrder(16)
                                .build());

                foods.add(Food.builder()
                                .name("Fanta Cam")
                                .description("Nước cam có gas Fanta vị cam tươi mát")
                                .imageUrl("https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400")
                                .price(new BigDecimal("25000"))
                                .category(Food.FoodCategory.DRINK)
                                .size(Food.FoodSize.SMALL)
                                .calories(160)
                                .sortOrder(17)
                                .build());

                foods.add(Food.builder()
                                .name("Nước Suối")
                                .description("Nước khoáng tinh khiết Aquafina")
                                .imageUrl("https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400")
                                .price(new BigDecimal("15000"))
                                .category(Food.FoodCategory.DRINK)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(0)
                                .sortOrder(18)
                                .build());

                foods.add(Food.builder()
                                .name("Trà Đào")
                                .description("Trà đào thơm ngon, thanh mát với đào tươi")
                                .imageUrl("https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400")
                                .price(new BigDecimal("35000"))
                                .category(Food.FoodCategory.DRINK)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(120)
                                .sortOrder(19)
                                .build());

                foods.add(Food.builder()
                                .name("Trà Đào")
                                .description("Trà đào thơm ngon, thanh mát với đào tươi")
                                .imageUrl("https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400")
                                .price(new BigDecimal("45000"))
                                .category(Food.FoodCategory.DRINK)
                                .size(Food.FoodSize.LARGE)
                                .calories(180)
                                .sortOrder(20)
                                .build());

                foods.add(Food.builder()
                                .name("Trà Vải")
                                .description("Trà vải thơm ngọt tự nhiên")
                                .imageUrl("https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=400")
                                .price(new BigDecimal("35000"))
                                .category(Food.FoodCategory.DRINK)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(130)
                                .sortOrder(21)
                                .build());

                foods.add(Food.builder()
                                .name("Cà Phê Đen Đá")
                                .description("Cà phê Việt Nam đậm đà, đá mát")
                                .imageUrl("https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400")
                                .price(new BigDecimal("30000"))
                                .category(Food.FoodCategory.DRINK)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(5)
                                .sortOrder(22)
                                .build());

                foods.add(Food.builder()
                                .name("Cà Phê Sữa Đá")
                                .description("Cà phê sữa đặc Việt Nam thơm béo")
                                .imageUrl("https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400")
                                .price(new BigDecimal("35000"))
                                .category(Food.FoodCategory.DRINK)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(150)
                                .sortOrder(23)
                                .build());

                // ============== SNACK ==============
                foods.add(Food.builder()
                                .name("Nachos Phô Mai")
                                .description("Bánh tortilla giòn với sốt phô mai cheddar nóng hổi")
                                .imageUrl("https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400")
                                .price(new BigDecimal("59000"))
                                .category(Food.FoodCategory.SNACK)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(450)
                                .sortOrder(24)
                                .build());

                foods.add(Food.builder()
                                .name("Nachos Phô Mai")
                                .description("Bánh tortilla giòn với sốt phô mai cheddar nóng hổi")
                                .imageUrl("https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400")
                                .price(new BigDecimal("79000"))
                                .category(Food.FoodCategory.SNACK)
                                .size(Food.FoodSize.LARGE)
                                .calories(650)
                                .sortOrder(25)
                                .build());

                foods.add(Food.builder()
                                .name("Khoai Tây Chiên")
                                .description("Khoai tây chiên giòn rụm, ăn kèm tương cà")
                                .imageUrl("https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400")
                                .price(new BigDecimal("39000"))
                                .category(Food.FoodCategory.SNACK)
                                .size(Food.FoodSize.SMALL)
                                .calories(300)
                                .sortOrder(26)
                                .build());

                foods.add(Food.builder()
                                .name("Khoai Tây Chiên")
                                .description("Khoai tây chiên giòn rụm, ăn kèm tương cà")
                                .imageUrl("https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400")
                                .price(new BigDecimal("49000"))
                                .category(Food.FoodCategory.SNACK)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(450)
                                .sortOrder(27)
                                .build());

                foods.add(Food.builder()
                                .name("Onion Rings")
                                .description("Hành tây chiên giòn phủ bột vàng ươm")
                                .imageUrl("https://images.unsplash.com/photo-1639024471283-03518883512d?w=400")
                                .price(new BigDecimal("45000"))
                                .category(Food.FoodCategory.SNACK)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(400)
                                .sortOrder(28)
                                .build());

                foods.add(Food.builder()
                                .name("Mozzarella Sticks")
                                .description("Que phô mai Mozzarella chiên giòn, kéo sợi thơm ngon")
                                .imageUrl("https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400")
                                .price(new BigDecimal("55000"))
                                .category(Food.FoodCategory.SNACK)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(480)
                                .sortOrder(29)
                                .build());

                foods.add(Food.builder()
                                .name("Chicken Nuggets")
                                .description("Gà viên chiên giòn (6 miếng), chấm sốt BBQ")
                                .imageUrl("https://images.unsplash.com/photo-1562967914-608f82629710?w=400")
                                .price(new BigDecimal("49000"))
                                .category(Food.FoodCategory.SNACK)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(350)
                                .sortOrder(30)
                                .build());

                foods.add(Food.builder()
                                .name("Chicken Nuggets")
                                .description("Gà viên chiên giòn (10 miếng), chấm sốt BBQ")
                                .imageUrl("https://images.unsplash.com/photo-1562967914-608f82629710?w=400")
                                .price(new BigDecimal("69000"))
                                .category(Food.FoodCategory.SNACK)
                                .size(Food.FoodSize.LARGE)
                                .calories(550)
                                .sortOrder(31)
                                .build());

                // ============== ĐỒ ĂN NHANH (FAST FOOD) ==============
                foods.add(Food.builder()
                                .name("Hot Dog Xúc Xích Đức")
                                .description("Bánh mì kẹp xúc xích Đức, tương mù tạt và hành phi")
                                .imageUrl("https://images.unsplash.com/photo-1612392062126-2f3f735b0c16?w=400")
                                .price(new BigDecimal("55000"))
                                .category(Food.FoodCategory.FAST_FOOD)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(450)
                                .sortOrder(32)
                                .build());

                foods.add(Food.builder()
                                .name("Hot Dog Phô Mai")
                                .description("Bánh mì kẹp xúc xích phủ phô mai tan chảy")
                                .imageUrl("https://images.unsplash.com/photo-1619740455993-9d701c57e6bc?w=400")
                                .price(new BigDecimal("65000"))
                                .category(Food.FoodCategory.FAST_FOOD)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(520)
                                .sortOrder(33)
                                .build());

                foods.add(Food.builder()
                                .name("Hamburger Bò")
                                .description("Hamburger thịt bò Úc, rau tươi, sốt đặc biệt")
                                .imageUrl("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400")
                                .price(new BigDecimal("79000"))
                                .category(Food.FoodCategory.FAST_FOOD)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(650)
                                .sortOrder(34)
                                .build());

                foods.add(Food.builder()
                                .name("Hamburger Gà")
                                .description("Hamburger gà rán giòn, salad, sốt mayo")
                                .imageUrl("https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400")
                                .price(new BigDecimal("69000"))
                                .category(Food.FoodCategory.FAST_FOOD)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(580)
                                .sortOrder(35)
                                .build());

                foods.add(Food.builder()
                                .name("Pizza Mini")
                                .description("Pizza size nhỏ vừa ăn một mình, nhiều topping")
                                .imageUrl("https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400")
                                .price(new BigDecimal("59000"))
                                .category(Food.FoodCategory.FAST_FOOD)
                                .size(Food.FoodSize.SMALL)
                                .calories(400)
                                .sortOrder(36)
                                .build());

                foods.add(Food.builder()
                                .name("Gà Rán (2 miếng)")
                                .description("Gà rán giòn rụm kiểu Hàn Quốc")
                                .imageUrl("https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400")
                                .price(new BigDecimal("59000"))
                                .category(Food.FoodCategory.FAST_FOOD)
                                .size(Food.FoodSize.SMALL)
                                .calories(500)
                                .sortOrder(37)
                                .build());

                foods.add(Food.builder()
                                .name("Gà Rán (4 miếng)")
                                .description("Gà rán giòn rụm kiểu Hàn Quốc")
                                .imageUrl("https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400")
                                .price(new BigDecimal("99000"))
                                .category(Food.FoodCategory.FAST_FOOD)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(900)
                                .sortOrder(38)
                                .build());

                // ============== KẸO BÁNH (CANDY) ==============
                foods.add(Food.builder()
                                .name("Kẹo Dẻo Gummy Bears")
                                .description("Kẹo dẻo hình gấu nhiều màu sắc, vị trái cây")
                                .imageUrl("https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400")
                                .price(new BigDecimal("25000"))
                                .category(Food.FoodCategory.CANDY)
                                .size(Food.FoodSize.SMALL)
                                .calories(140)
                                .sortOrder(39)
                                .build());

                foods.add(Food.builder()
                                .name("M&M's Chocolate")
                                .description("Kẹo chocolate M&M's nhiều màu sắc")
                                .imageUrl("https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=400")
                                .price(new BigDecimal("35000"))
                                .category(Food.FoodCategory.CANDY)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(240)
                                .sortOrder(40)
                                .build());

                foods.add(Food.builder()
                                .name("Snickers Bar")
                                .description("Thanh chocolate Snickers nhân đậu phộng caramel")
                                .imageUrl("https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400")
                                .price(new BigDecimal("25000"))
                                .category(Food.FoodCategory.CANDY)
                                .size(Food.FoodSize.SMALL)
                                .calories(280)
                                .sortOrder(41)
                                .build());

                foods.add(Food.builder()
                                .name("KitKat")
                                .description("Bánh xốp phủ chocolate KitKat")
                                .imageUrl("https://images.unsplash.com/photo-1527904324834-3bda86da6771?w=400")
                                .price(new BigDecimal("20000"))
                                .category(Food.FoodCategory.CANDY)
                                .size(Food.FoodSize.SMALL)
                                .calories(210)
                                .sortOrder(42)
                                .build());

                foods.add(Food.builder()
                                .name("Skittles")
                                .description("Kẹo cứng Skittles vị trái cây nhiệt đới")
                                .imageUrl("https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400")
                                .price(new BigDecimal("30000"))
                                .category(Food.FoodCategory.CANDY)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(180)
                                .sortOrder(43)
                                .build());

                // ============== KEM (ICE CREAM) ==============
                foods.add(Food.builder()
                                .name("Kem Vani")
                                .description("Kem vani mềm mịn, thơm ngon")
                                .imageUrl("https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400")
                                .price(new BigDecimal("25000"))
                                .category(Food.FoodCategory.ICE_CREAM)
                                .size(Food.FoodSize.SMALL)
                                .calories(180)
                                .sortOrder(44)
                                .build());

                foods.add(Food.builder()
                                .name("Kem Vani")
                                .description("Kem vani mềm mịn, thơm ngon")
                                .imageUrl("https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400")
                                .price(new BigDecimal("35000"))
                                .category(Food.FoodCategory.ICE_CREAM)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(280)
                                .sortOrder(45)
                                .build());

                foods.add(Food.builder()
                                .name("Kem Chocolate")
                                .description("Kem chocolate đậm đà, ngọt ngào")
                                .imageUrl("https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400")
                                .price(new BigDecimal("29000"))
                                .category(Food.FoodCategory.ICE_CREAM)
                                .size(Food.FoodSize.SMALL)
                                .calories(200)
                                .sortOrder(46)
                                .build());

                foods.add(Food.builder()
                                .name("Kem Chocolate")
                                .description("Kem chocolate đậm đà, ngọt ngào")
                                .imageUrl("https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400")
                                .price(new BigDecimal("39000"))
                                .category(Food.FoodCategory.ICE_CREAM)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(310)
                                .sortOrder(47)
                                .build());

                foods.add(Food.builder()
                                .name("Kem Sundae")
                                .description("Kem sundae với sốt chocolate, whipped cream và cherry")
                                .imageUrl("https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400")
                                .price(new BigDecimal("49000"))
                                .category(Food.FoodCategory.ICE_CREAM)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(420)
                                .sortOrder(48)
                                .build());

                foods.add(Food.builder()
                                .name("Kem Matcha")
                                .description("Kem trà xanh Nhật Bản thơm mát")
                                .imageUrl("https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=400")
                                .price(new BigDecimal("35000"))
                                .category(Food.FoodCategory.ICE_CREAM)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(220)
                                .sortOrder(49)
                                .build());

                // ============== COMBO ĐẶC BIỆT ==============
                foods.add(Food.builder()
                                .name("Combo Solo")
                                .description("1 Bắp rang bơ (M) + 1 Nước ngọt (M)")
                                .imageUrl("https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400")
                                .price(new BigDecimal("75000"))
                                .category(Food.FoodCategory.COMBO)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(600)
                                .isCombo(true)
                                .comboDescription("Tiết kiệm 12.000đ so với mua lẻ")
                                .originalPrice(new BigDecimal("87000"))
                                .discountPercent(14)
                                .sortOrder(50)
                                .build());

                foods.add(Food.builder()
                                .name("Combo Couple")
                                .description("1 Bắp rang bơ (L) + 2 Nước ngọt (M)")
                                .imageUrl("https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400")
                                .price(new BigDecimal("115000"))
                                .category(Food.FoodCategory.COMBO)
                                .size(Food.FoodSize.LARGE)
                                .calories(890)
                                .isCombo(true)
                                .comboDescription("Tiết kiệm 18.000đ so với mua lẻ")
                                .originalPrice(new BigDecimal("133000"))
                                .discountPercent(14)
                                .sortOrder(51)
                                .build());

                foods.add(Food.builder()
                                .name("Combo Family")
                                .description("2 Bắp rang bơ (L) + 4 Nước ngọt (L)")
                                .imageUrl("https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400")
                                .price(new BigDecimal("249000"))
                                .category(Food.FoodCategory.COMBO)
                                .size(Food.FoodSize.EXTRA_LARGE)
                                .calories(1780)
                                .isCombo(true)
                                .comboDescription("Tiết kiệm 45.000đ so với mua lẻ")
                                .originalPrice(new BigDecimal("294000"))
                                .discountPercent(15)
                                .sortOrder(52)
                                .build());

                foods.add(Food.builder()
                                .name("Combo Premium")
                                .description("1 Bắp rang caramel (L) + 2 Trà đào (L) + 1 Nachos phô mai (M)")
                                .imageUrl("https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400")
                                .price(new BigDecimal("169000"))
                                .category(Food.FoodCategory.COMBO)
                                .size(Food.FoodSize.LARGE)
                                .calories(1200)
                                .isCombo(true)
                                .comboDescription("Tiết kiệm 24.000đ so với mua lẻ")
                                .originalPrice(new BigDecimal("193000"))
                                .discountPercent(12)
                                .sortOrder(53)
                                .build());

                foods.add(Food.builder()
                                .name("Combo Snack Attack")
                                .description("1 Nachos phô mai (L) + 1 Mozzarella Sticks + 2 Coca-Cola (M)")
                                .imageUrl("https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400")
                                .price(new BigDecimal("179000"))
                                .category(Food.FoodCategory.COMBO)
                                .size(Food.FoodSize.LARGE)
                                .calories(1350)
                                .isCombo(true)
                                .comboDescription("Tiết kiệm 29.000đ so với mua lẻ")
                                .originalPrice(new BigDecimal("208000"))
                                .discountPercent(14)
                                .sortOrder(54)
                                .build());

                foods.add(Food.builder()
                                .name("Combo Hot Dog")
                                .description("2 Hot Dog Xúc Xích + 2 Coca-Cola (M) + 1 Khoai tây chiên (M)")
                                .imageUrl("https://images.unsplash.com/photo-1612392062126-2f3f735b0c16?w=400")
                                .price(new BigDecimal("159000"))
                                .category(Food.FoodCategory.COMBO)
                                .size(Food.FoodSize.LARGE)
                                .calories(1400)
                                .isCombo(true)
                                .comboDescription("Tiết kiệm 34.000đ so với mua lẻ")
                                .originalPrice(new BigDecimal("193000"))
                                .discountPercent(18)
                                .sortOrder(55)
                                .build());

                foods.add(Food.builder()
                                .name("Combo Burger Meal")
                                .description("1 Hamburger Bò + 1 Khoai tây chiên (M) + 1 Coca-Cola (L)")
                                .imageUrl("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400")
                                .price(new BigDecimal("139000"))
                                .category(Food.FoodCategory.COMBO)
                                .size(Food.FoodSize.LARGE)
                                .calories(1250)
                                .isCombo(true)
                                .comboDescription("Tiết kiệm 28.000đ so với mua lẻ")
                                .originalPrice(new BigDecimal("167000"))
                                .discountPercent(17)
                                .sortOrder(56)
                                .build());

                foods.add(Food.builder()
                                .name("Combo Chicken")
                                .description("1 Gà rán (4 miếng) + 1 Khoai tây chiên (M) + 2 Pepsi (M)")
                                .imageUrl("https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400")
                                .price(new BigDecimal("179000"))
                                .category(Food.FoodCategory.COMBO)
                                .size(Food.FoodSize.LARGE)
                                .calories(1600)
                                .isCombo(true)
                                .comboDescription("Tiết kiệm 33.000đ so với mua lẻ")
                                .originalPrice(new BigDecimal("212000"))
                                .discountPercent(16)
                                .sortOrder(57)
                                .build());

                foods.add(Food.builder()
                                .name("Combo Sweet Tooth")
                                .description("1 Bắp rang caramel (M) + 1 Kem Sundae + 1 M&M's")
                                .imageUrl("https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400")
                                .price(new BigDecimal("119000"))
                                .category(Food.FoodCategory.COMBO)
                                .size(Food.FoodSize.MEDIUM)
                                .calories(1100)
                                .isCombo(true)
                                .comboDescription("Tiết kiệm 24.000đ so với mua lẻ")
                                .originalPrice(new BigDecimal("143000"))
                                .discountPercent(17)
                                .sortOrder(58)
                                .build());

                foods.add(Food.builder()
                                .name("Combo Party Box")
                                .description("2 Bắp rang mix (L) + 4 Nước ngọt (L) + 2 Nachos phô mai (L) + 1 Gà rán (4 miếng)")
                                .imageUrl("https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400")
                                .price(new BigDecimal("449000"))
                                .category(Food.FoodCategory.COMBO)
                                .size(Food.FoodSize.EXTRA_LARGE)
                                .calories(3200)
                                .isCombo(true)
                                .comboDescription("Combo đại tiệc cho nhóm 6-8 người, tiết kiệm 92.000đ")
                                .originalPrice(new BigDecimal("541000"))
                                .discountPercent(17)
                                .sortOrder(59)
                                .build());

                foods.add(Food.builder()
                                .name("Combo Kids")
                                .description("1 Bắp rang bơ (S) + 1 Nước ngọt (S) + 1 Kẹo Gummy Bears")
                                .imageUrl("https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400")
                                .price(new BigDecimal("79000"))
                                .category(Food.FoodCategory.COMBO)
                                .size(Food.FoodSize.SMALL)
                                .calories(530)
                                .isCombo(true)
                                .comboDescription("Combo dành cho bé yêu, tiết kiệm 16.000đ")
                                .originalPrice(new BigDecimal("95000"))
                                .discountPercent(17)
                                .sortOrder(60)
                                .build());

                foods.add(Food.builder()
                                .name("Combo Date Night")
                                .description("1 Bắp phô mai (L) + 2 Trà đào (L) + 1 Kem Sundae chia đôi")
                                .imageUrl("https://images.unsplash.com/photo-1604476322443-1d7a45d02944?w=400")
                                .price(new BigDecimal("159000"))
                                .category(Food.FoodCategory.COMBO)
                                .size(Food.FoodSize.LARGE)
                                .calories(1150)
                                .isCombo(true)
                                .comboDescription("Combo lãng mạn cho cặp đôi, tiết kiệm 27.000đ")
                                .originalPrice(new BigDecimal("186000"))
                                .discountPercent(15)
                                .sortOrder(61)
                                .build());

                foodRepository.saveAll(foods);
                log.info("Created {} foods and combos", foods.size());
        }

        private void initCoupons() {
                List<Coupon> coupons = new ArrayList<>();

                // Coupon giảm 10%
                coupons.add(Coupon.builder()
                                .couponCode("GIAM10")
                                .pinCode("1234")
                                .discountType(Coupon.DiscountType.PERCENTAGE)
                                .discountValue(new BigDecimal("10"))
                                .maxDiscountAmount(new BigDecimal("50000"))
                                .minPurchaseAmount(new BigDecimal("100000"))
                                .usageLimit(100)
                                .usageCount(0)
                                .expiryDate(LocalDateTime.now().plusMonths(3))
                                .status(Coupon.CouponStatus.ACTIVE)
                                .description("Giảm 10% tối đa 50.000đ cho đơn từ 100.000đ")
                                .build());

                // Coupon giảm 50K
                coupons.add(Coupon.builder()
                                .couponCode("GIAM50K")
                                .pinCode("5678")
                                .discountType(Coupon.DiscountType.FIXED_AMOUNT)
                                .discountValue(new BigDecimal("50000"))
                                .maxDiscountAmount(new BigDecimal("50000"))
                                .minPurchaseAmount(new BigDecimal("200000"))
                                .usageLimit(50)
                                .usageCount(0)
                                .expiryDate(LocalDateTime.now().plusMonths(2))
                                .status(Coupon.CouponStatus.ACTIVE)
                                .description("Giảm trực tiếp 50.000đ cho đơn từ 200.000đ")
                                .build());

                // Coupon Welcome cho khách mới
                coupons.add(Coupon.builder()
                                .couponCode("WELCOME")
                                .pinCode("0000")
                                .discountType(Coupon.DiscountType.PERCENTAGE)
                                .discountValue(new BigDecimal("20"))
                                .maxDiscountAmount(new BigDecimal("100000"))
                                .minPurchaseAmount(new BigDecimal("150000"))
                                .usageLimit(1000)
                                .usageCount(0)
                                .expiryDate(LocalDateTime.now().plusMonths(6))
                                .status(Coupon.CouponStatus.ACTIVE)
                                .description("Giảm 20% tối đa 100.000đ cho thành viên mới")
                                .build());

                // Coupon giảm 30% cuối tuần
                coupons.add(Coupon.builder()
                                .couponCode("WEEKEND30")
                                .pinCode("9999")
                                .discountType(Coupon.DiscountType.PERCENTAGE)
                                .discountValue(new BigDecimal("30"))
                                .maxDiscountAmount(new BigDecimal("150000"))
                                .minPurchaseAmount(new BigDecimal("300000"))
                                .usageLimit(200)
                                .usageCount(0)
                                .expiryDate(LocalDateTime.now().plusMonths(1))
                                .status(Coupon.CouponStatus.ACTIVE)
                                .description("Giảm 30% tối đa 150.000đ cho đơn từ 300.000đ - Chỉ cuối tuần")
                                .build());

                // Coupon giảm 100K cho combo
                coupons.add(Coupon.builder()
                                .couponCode("COMBO100")
                                .pinCode("1111")
                                .discountType(Coupon.DiscountType.FIXED_AMOUNT)
                                .discountValue(new BigDecimal("100000"))
                                .maxDiscountAmount(new BigDecimal("100000"))
                                .minPurchaseAmount(new BigDecimal("500000"))
                                .usageLimit(30)
                                .usageCount(0)
                                .expiryDate(LocalDateTime.now().plusWeeks(2))
                                .status(Coupon.CouponStatus.ACTIVE)
                                .description("Giảm 100.000đ cho đơn combo từ 500.000đ")
                                .build());

                couponRepository.saveAll(coupons);
                log.info("Created {} coupons", coupons.size());
        }

        private void initVouchers() {
                List<Voucher> vouchers = new ArrayList<>();

                // Voucher 100K
                vouchers.add(Voucher.builder()
                                .voucherCode("VOC100K")
                                .pinCode("1111")
                                .value(new BigDecimal("100000"))
                                .minPurchaseAmount(new BigDecimal("200000"))
                                .expiryDate(LocalDateTime.now().plusMonths(6))
                                .status(Voucher.VoucherStatus.ACTIVE)
                                .build());

                // Voucher 50K
                vouchers.add(Voucher.builder()
                                .voucherCode("VOC50K")
                                .pinCode("2222")
                                .value(new BigDecimal("50000"))
                                .minPurchaseAmount(new BigDecimal("100000"))
                                .expiryDate(LocalDateTime.now().plusMonths(6))
                                .status(Voucher.VoucherStatus.ACTIVE)
                                .build());

                // Voucher 200K
                vouchers.add(Voucher.builder()
                                .voucherCode("VOC200K")
                                .pinCode("3333")
                                .value(new BigDecimal("200000"))
                                .minPurchaseAmount(new BigDecimal("500000"))
                                .expiryDate(LocalDateTime.now().plusMonths(3))
                                .status(Voucher.VoucherStatus.ACTIVE)
                                .build());

                // Voucher 500K Premium
                vouchers.add(Voucher.builder()
                                .voucherCode("PREMIUM500")
                                .pinCode("5555")
                                .value(new BigDecimal("500000"))
                                .minPurchaseAmount(new BigDecimal("1000000"))
                                .expiryDate(LocalDateTime.now().plusMonths(12))
                                .status(Voucher.VoucherStatus.ACTIVE)
                                .build());

                // Voucher sinh nhật
                vouchers.add(Voucher.builder()
                                .voucherCode("BIRTHDAY")
                                .pinCode("8888")
                                .value(new BigDecimal("150000"))
                                .minPurchaseAmount(new BigDecimal("0"))
                                .expiryDate(LocalDateTime.now().plusMonths(1))
                                .status(Voucher.VoucherStatus.ACTIVE)
                                .build());

                voucherRepository.saveAll(vouchers);
                log.info("Created {} vouchers", vouchers.size());
        }

        private void initPromotions() {
                List<Promotion> promotions = new ArrayList<>();

                // Promotion 1 - Mua 2 tặng 2
                promotions.add(Promotion.builder()
                                .title("MUA 02 TẶNG 02 - CONAN MOVIE 01 RA RẠP")
                                .shortDescription("Mua 02 vé tặng 01 thẻ sưu tầm & 01 móc khóa đựng thẻ")
                                .content("<h2>I. Thời gian và địa điểm áp dụng</h2>" +
                                                "<p><strong>Thời gian:</strong> Áp dụng cho các suất chiếu PHIM ĐIỆN ẢNH THÁM TỬ LỪNG DANH CONAN: QUẢ BOM CHỌC TRỜI trong các ngày 23, 24 và 25/01/2026, hoặc đến khi hết quà, tùy điều kiện nào đến trước.</p>"
                                                +
                                                "<h3>Địa điểm:</h3>" +
                                                "<p><strong>TP.HCM:</strong> CinemaPlus Vincom Bà Triệu, CinemaPlus Crescent Mall, CinemaPlus Thảo Điền Pearl...</p>"
                                                +
                                                "<p><strong>Hà Nội:</strong> CinemaPlus Vincom Center Bà Triệu, CinemaPlus Hồ Gươm Plaza...</p>"
                                                +
                                                "<h2>II. Điều kiện áp dụng</h2>" +
                                                "<ul><li>Mua 02 vé phim Conan: Quả Bom Chọc Trời</li><li>Nhận 01 thẻ sưu tầm phiên bản giới hạn</li><li>Nhận 01 móc khóa đựng thẻ exclusive</li></ul>"
                                                +
                                                "<h2>III. Lưu ý</h2>" +
                                                "<p>Số lượng quà có hạn, áp dụng cho đến khi hết quà. Mỗi khách hàng chỉ được nhận tối đa 2 phần quà/ngày.</p>")
                                .imageUrl("https://picsum.photos/seed/conan/980/448")
                                .thumbnailUrl("https://picsum.photos/seed/conan/400/400")
                                .startDate(LocalDate.of(2026, 1, 23))
                                .endDate(LocalDate.of(2026, 1, 25))
                                .status(Promotion.PromotionStatus.ACTIVE)
                                .type(Promotion.PromotionType.MOVIE)
                                .isFeatured(true)
                                .sortOrder(1)
                                .build());

                // Promotion 2 - Suất chiếu đặc biệt
                promotions.add(Promotion.builder()
                                .title("3 SUẤT CHIẾU ĐẶC BIỆT DÀNH CHO KHÁN GIẢ")
                                .shortDescription("Giá vé chỉ 69.000 VND tại một số rạp")
                                .content("<h2>Ưu đãi vé giá rẻ</h2>" +
                                                "<p>Chương trình áp dụng tại các rạp: TP.HCM, Hà Nội với giá vé ưu đãi chỉ <strong>69.000 VND</strong></p>"
                                                +
                                                "<h3>Điều kiện áp dụng:</h3>" +
                                                "<ul><li>Áp dụng cho các suất chiếu 10:00, 14:00 và 20:00</li><li>Áp dụng cho tất cả các phim 2D</li><li>Không áp dụng cùng các khuyến mãi khác</li></ul>"
                                                +
                                                "<p><em>*Chương trình có thể kết thúc sớm mà không cần báo trước</em></p>")
                                .imageUrl("https://picsum.photos/seed/special/980/448")
                                .thumbnailUrl("https://picsum.photos/seed/special/400/400")
                                .startDate(LocalDate.of(2026, 1, 1))
                                .endDate(LocalDate.of(2026, 1, 13))
                                .status(Promotion.PromotionStatus.ACTIVE)
                                .type(Promotion.PromotionType.TICKET)
                                .isFeatured(true)
                                .sortOrder(2)
                                .build());

                // Promotion 3 - Bao Lì Xì
                promotions.add(Promotion.builder()
                                .title("BAO LÌ XÌ - COOL DEAL NHẬN NGAY")
                                .shortDescription("Tặng 01 bộ lì xì Geo Quẻ cho mỗi hóa đơn mua bắp nước")
                                .content("<h2>Chương trình Tết 2026</h2>" +
                                                "<p>Tặng bao lì xì xinh xắn khi mua combo bắp nước</p>" +
                                                "<h3>Chi tiết ưu đãi:</h3>" +
                                                "<ul><li>Mua bất kỳ combo bắp nước từ 79.000đ trở lên</li><li>Nhận ngay 01 bộ bao lì xì Geo Quẻ 12 con giáp</li><li>Số lượng có hạn, đến khi hết quà</li></ul>"
                                                +
                                                "<h3>Thời gian áp dụng:</h3>" +
                                                "<p>Từ 09/01/2026 đến 15/02/2026 hoặc đến khi hết quà</p>")
                                .imageUrl("https://picsum.photos/seed/lixi/980/448")
                                .thumbnailUrl("https://picsum.photos/seed/lixi/400/400")
                                .startDate(LocalDate.of(2026, 1, 9))
                                .endDate(LocalDate.of(2026, 2, 15))
                                .status(Promotion.PromotionStatus.ACTIVE)
                                .type(Promotion.PromotionType.SPECIAL_DAY)
                                .isFeatured(true)
                                .sortOrder(3)
                                .build());

                // Promotion 4 - Lì Xì Liền Tay
                promotions.add(Promotion.builder()
                                .title("LÌ XÌ LIỀN TAY - BẮP NƯỚC BỜ ĐÂY")
                                .shortDescription("Khui bảo / Hibiscus Snack - Tặng ngay!")
                                .content("<h2>Ưu đãi Tết</h2>" +
                                                "<p>Chương trình Tết - Mua combo bắp nước nhận ngay lì xì may mắn</p>" +
                                                "<h3>Cách thức tham gia:</h3>" +
                                                "<ul><li>Mua combo bắp nước bất kỳ</li><li>Bóc ngay lì xì may mắn</li><li>Nhận quà tặng hấp dẫn</li></ul>"
                                                +
                                                "<p>Giải thưởng bao gồm: Voucher giảm giá, Bắp nước miễn phí, Vé xem phim...</p>")
                                .imageUrl("https://picsum.photos/seed/tet/980/448")
                                .thumbnailUrl("https://picsum.photos/seed/tet/400/400")
                                .startDate(LocalDate.of(2026, 1, 9))
                                .endDate(LocalDate.of(2026, 2, 1))
                                .status(Promotion.PromotionStatus.ACTIVE)
                                .type(Promotion.PromotionType.FOOD)
                                .isFeatured(false)
                                .sortOrder(4)
                                .build());

                // Promotion 5 - VISA
                promotions.add(Promotion.builder()
                                .title("MUA 2 VÉ CINEMAPLUS VỚI THẺ VISA TRÊN APPLE PAY")
                                .shortDescription("Tặng Combo 1 bắp 2 nước")
                                .content("<h2>Ưu đãi VISA x Apple Pay</h2>" +
                                                "<p>Áp dụng khi thanh toán bằng thẻ Visa qua Apple Pay tại quầy</p>" +
                                                "<h3>Điều kiện:</h3>" +
                                                "<ul><li>Mua tối thiểu 02 vé xem phim</li><li>Thanh toán bằng thẻ Visa qua Apple Pay</li><li>Nhận ngay Combo 1 bắp + 2 nước trị giá 89.000đ</li></ul>"
                                                +
                                                "<h3>Lưu ý:</h3>" +
                                                "<p>Mỗi thẻ chỉ được áp dụng 01 lần/tháng. Không áp dụng cùng các khuyến mãi khác.</p>")
                                .imageUrl("https://picsum.photos/seed/visa/980/448")
                                .thumbnailUrl("https://picsum.photos/seed/visa/400/400")
                                .startDate(LocalDate.of(2026, 1, 9))
                                .endDate(LocalDate.of(2026, 6, 30))
                                .status(Promotion.PromotionStatus.ACTIVE)
                                .type(Promotion.PromotionType.PARTNER)
                                .isFeatured(false)
                                .sortOrder(5)
                                .build());

                // Promotion 6 - ZaloPay
                promotions.add(Promotion.builder()
                                .title("ZALOPAY x CINEMAPLUS - ĐẶT VÉ PHIM TRÊN ZALOPAY")
                                .shortDescription("Chỉ với 19.000đ")
                                .content("<h2>Siêu ưu đãi ZaloPay</h2>" +
                                                "<p>Đặt vé phim qua ZaloPay với giá siêu ưu đãi chỉ <strong>19.000đ/vé</strong></p>"
                                                +
                                                "<h3>Cách thức tham gia:</h3>" +
                                                "<ol><li>Mở ứng dụng ZaloPay</li><li>Chọn mục Đặt vé xem phim</li><li>Chọn CinemaPlus và suất chiếu yêu thích</li><li>Thanh toán và nhận vé điện tử</li></ol>"
                                                +
                                                "<p><em>*Áp dụng cho người dùng mới ZaloPay, giới hạn 2 vé/giao dịch</em></p>")
                                .imageUrl("https://picsum.photos/seed/zalopay/980/448")
                                .thumbnailUrl("https://picsum.photos/seed/zalopay/400/400")
                                .startDate(LocalDate.of(2026, 1, 1))
                                .endDate(LocalDate.of(2026, 1, 31))
                                .status(Promotion.PromotionStatus.ACTIVE)
                                .type(Promotion.PromotionType.PARTNER)
                                .isFeatured(true)
                                .sortOrder(6)
                                .build());

                // Promotion 7 - MoMo
                promotions.add(Promotion.builder()
                                .title("BẠN THÂN MOMO - GIẢM 10K VÉ XEM PHIM")
                                .shortDescription("Kiểm tra quà có sẵn - Giảm 10K vé xem phim")
                                .content("<h2>Ưu đãi MoMo</h2>" +
                                                "<p>Ưu đãi dành cho thành viên MoMo - Giảm ngay <strong>10.000đ</strong> khi thanh toán bằng ví MoMo</p>"
                                                +
                                                "<h3>Điều kiện áp dụng:</h3>" +
                                                "<ul><li>Là thành viên MoMo</li><li>Thanh toán qua ví MoMo tại quầy hoặc web/app CinemaPlus</li><li>Không giới hạn số lần sử dụng</li></ul>")
                                .imageUrl("https://picsum.photos/seed/momo/980/448")
                                .thumbnailUrl("https://picsum.photos/seed/momo/400/400")
                                .startDate(LocalDate.of(2026, 1, 1))
                                .endDate(LocalDate.of(2026, 1, 31))
                                .status(Promotion.PromotionStatus.ACTIVE)
                                .type(Promotion.PromotionType.PARTNER)
                                .isFeatured(false)
                                .sortOrder(7)
                                .build());

                // Promotion 8 - XEM PHIM CHỈ 100K
                promotions.add(Promotion.builder()
                                .title("XEM PHIM CHỈ VỚI 100K - MUA 4 VÉ")
                                .shortDescription("Xem phim bất tận với gói 4 vé chỉ 100K")
                                .content("<h2>Gói vé siêu tiết kiệm</h2>" +
                                                "<p>Chương trình đặc biệt - Mua 4 vé xem phim với giá chỉ <strong>100.000đ</strong></p>"
                                                +
                                                "<h3>Chi tiết chương trình:</h3>" +
                                                "<ul><li>Mua gói 4 vé với giá 100.000đ (tiết kiệm đến 60%)</li><li>Áp dụng cho tất cả các phim 2D</li><li>Có thể sử dụng cho 4 suất chiếu khác nhau</li><li>Vé có hiệu lực trong vòng 30 ngày kể từ ngày mua</li></ul>")
                                .imageUrl("https://picsum.photos/seed/100k/980/448")
                                .thumbnailUrl("https://picsum.photos/seed/100k/400/400")
                                .startDate(LocalDate.of(2025, 12, 31))
                                .endDate(LocalDate.of(2026, 12, 31))
                                .status(Promotion.PromotionStatus.ACTIVE)
                                .type(Promotion.PromotionType.TICKET)
                                .isFeatured(false)
                                .sortOrder(8)
                                .build());

                // Promotion 9 - Quà sinh nhật
                promotions.add(Promotion.builder()
                                .title("QUÀ SINH NHẬT - MIỄN PHÍ")
                                .shortDescription("Quà Sinh Nhật MIỄN PHÍ cho thành viên")
                                .content("<h2>Ưu đãi sinh nhật thành viên</h2>" +
                                                "<p>Thành viên CinemaPlus có sinh nhật trong tháng nhận ngay quà tặng miễn phí</p>"
                                                +
                                                "<h3>Quyền lợi sinh nhật:</h3>" +
                                                "<ul><li>01 vé xem phim 2D miễn phí</li><li>01 phần bắp nước size M</li><li>Giảm 50% cho người đi cùng (tối đa 2 người)</li></ul>"
                                                +
                                                "<h3>Cách nhận quà:</h3>" +
                                                "<p>Xuất trình CMND/CCCD và thẻ thành viên CinemaPlus tại quầy vé</p>")
                                .imageUrl("https://picsum.photos/seed/birthday/980/448")
                                .thumbnailUrl("https://picsum.photos/seed/birthday/400/400")
                                .startDate(LocalDate.of(2026, 1, 1))
                                .endDate(LocalDate.of(2026, 12, 31))
                                .status(Promotion.PromotionStatus.ACTIVE)
                                .type(Promotion.PromotionType.MEMBER)
                                .isFeatured(false)
                                .sortOrder(9)
                                .build());

                // Promotion 10 - ShopeePay
                promotions.add(Promotion.builder()
                                .title("SHOPEE PAY - XEM PHIM XUYÊN LỄ ƯU ĐÃI SIÊU MÊ")
                                .shortDescription("Bạn mới giảm 20% - Bạn thân giảm 10%")
                                .content("<h2>Ưu đãi ShopeePay</h2>" +
                                                "<p>Thanh toán bằng ShopeePay tại web/ứng dụng CinemaPlus để nhận ưu đãi</p>"
                                                +
                                                "<h3>Mức ưu đãi:</h3>" +
                                                "<ul><li><strong>Bạn mới:</strong> Giảm 20% tối đa 50.000đ</li><li><strong>Bạn thân:</strong> Giảm 10% tối đa 30.000đ</li></ul>"
                                                +
                                                "<h3>Điều kiện:</h3>" +
                                                "<p>Thanh toán qua ShopeePay, không áp dụng cùng mã giảm giá khác</p>")
                                .imageUrl("https://picsum.photos/seed/shopee/980/448")
                                .thumbnailUrl("https://picsum.photos/seed/shopee/400/400")
                                .startDate(LocalDate.of(2026, 1, 1))
                                .endDate(LocalDate.of(2026, 1, 31))
                                .status(Promotion.PromotionStatus.ACTIVE)
                                .type(Promotion.PromotionType.PARTNER)
                                .isFeatured(false)
                                .sortOrder(10)
                                .build());

                // Promotion 11 - Wide Poster
                promotions.add(Promotion.builder()
                                .title("TẶNG 01 WIDE POSTER - SCREENX & IMAX")
                                .shortDescription("Mỗi vé IMAX/ScreenX nhận ngay Wide Poster")
                                .content("<h2>Quà tặng phim đặc biệt</h2>" +
                                                "<p>Chương trình áp dụng cho phim được chọn tại các rạp ScreenX và IMAX</p>"
                                                +
                                                "<h3>Chi tiết:</h3>" +
                                                "<ul><li>Mua vé xem phim tại rạp ScreenX hoặc IMAX</li><li>Nhận ngay 01 Wide Poster phim phiên bản giới hạn</li><li>Số lượng có hạn, đến khi hết quà</li></ul>"
                                                +
                                                "<h3>Danh sách phim áp dụng:</h3>" +
                                                "<p>Avatar 3, Transformers: Rise, Fast & Furious 11...</p>")
                                .imageUrl("https://picsum.photos/seed/poster/980/448")
                                .thumbnailUrl("https://picsum.photos/seed/poster/400/400")
                                .startDate(LocalDate.of(2026, 1, 3))
                                .endDate(LocalDate.of(2026, 1, 25))
                                .status(Promotion.PromotionStatus.ACTIVE)
                                .type(Promotion.PromotionType.MOVIE)
                                .isFeatured(false)
                                .sortOrder(11)
                                .build());

                // Promotion 12 - Đại Thoại Tây Du
                promotions.add(Promotion.builder()
                                .title("MUA 1 VÉ ĐẠI THOẠI TÂY DU - NHẬN NGAY 1 LỊCH ĐỂ BÀN 2026")
                                .shortDescription("Hình ảnh bản quyền cực nét!")
                                .content("<h2>Ưu đãi phim Đại Thoại Tây Du</h2>" +
                                                "<p>Chương trình đặc biệt cho phim Đại Thoại Tây Du - Nhận lịch để bàn 2026 khi mua vé</p>"
                                                +
                                                "<h3>Điều kiện:</h3>" +
                                                "<ul><li>Mua vé xem phim Đại Thoại Tây Du</li><li>Nhận ngay 01 Lịch để bàn 2026 phiên bản Tây Du Ký</li><li>Số lượng có hạn, đến khi hết quà</li></ul>"
                                                +
                                                "<h3>Lưu ý:</h3>" +
                                                "<p>Mỗi vé nhận 01 lịch. Quà tặng không quy đổi thành tiền mặt.</p>")
                                .imageUrl("https://picsum.photos/seed/taydu/980/448")
                                .thumbnailUrl("https://picsum.photos/seed/taydu/400/400")
                                .startDate(LocalDate.of(2026, 1, 1))
                                .endDate(LocalDate.of(2026, 1, 31))
                                .status(Promotion.PromotionStatus.ACTIVE)
                                .type(Promotion.PromotionType.MOVIE)
                                .isFeatured(false)
                                .sortOrder(12)
                                .build());

                promotionRepository.saveAll(promotions);
                log.info("Created {} promotions", promotions.size());
        }

        private void initSampleBookings() {
                log.info("Initializing sample bookings...");
                List<User> users = userRepository.findAll();
                List<Showtime> showtimes = showtimeRepository.findAll();

                if (users.isEmpty() || showtimes.isEmpty()) {
                        log.warn("Cannot init bookings: users or showtimes missing");
                        return;
                }

                Random random = new Random();
                List<Booking> bookings = new ArrayList<>();

                for (int i = 0; i < 50; i++) {
                        User user = users.get(random.nextInt(users.size()));
                        Showtime showtime = showtimes.get(random.nextInt(showtimes.size()));

                        // Skip if user is admin (optional, assuming role checks not needed for data init)
                        if (user.getRole() == User.Role.ADMIN) continue;

                        int seatsToBook = 1 + random.nextInt(4);
                        List<String> seatLabels = new ArrayList<>();
                        // Simple logic: pick random seats (collision possible but acceptable for sample data if we don't validate strictly here)
                        // Or better: use seats not yet booked for this showtime? 
                        // For simplicity in sample data, we'll just pick random seat names like A1, B2
                        char row = (char) ('A' + random.nextInt(8));
                        for (int j = 1; j <= seatsToBook; j++) {
                                seatLabels.add("" + row + (random.nextInt(10) + 1));
                        }

                        double totalAmount = seatsToBook * 80000.0; // Approx price

                        Booking booking = Booking.builder()
                                        .user(user)
                                        .showtime(showtime)
                                        .bookingCode("BK" + System.currentTimeMillis() + i)
                                        .numberOfSeats(seatsToBook)
                                        .seatAmount(new BigDecimal(totalAmount)) // Fix: convert double to BigDecimal
                                        .foodAmount(BigDecimal.ZERO)
                                        .totalAmount(new BigDecimal(totalAmount))
                                        .discountAmount(BigDecimal.ZERO)
                                        .finalAmount(new BigDecimal(totalAmount))
                                        .status(Booking.BookingStatus.values()[random.nextInt(Booking.BookingStatus.values().length)])
                                        .createdAt(LocalDateTime.now().minusDays(random.nextInt(30)).minusHours(random.nextInt(24)))
                                        .build();

                        // Sync payment status
                        Payment.PaymentStatus paymentStatus;
                        if (booking.getStatus() == Booking.BookingStatus.COMPLETED || booking.getStatus() == Booking.BookingStatus.CONFIRMED) {
                             paymentStatus = Payment.PaymentStatus.COMPLETED;
                        } else if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
                             paymentStatus = random.nextBoolean() ? Payment.PaymentStatus.REFUNDED : Payment.PaymentStatus.FAILED;
                        } else {
                             paymentStatus = Payment.PaymentStatus.PENDING;
                        }
                        
                        // Create Payment
                        Payment payment = Payment.builder()
                                .booking(booking)
                                .amount(booking.getFinalAmount())
                                .paymentMethod(Payment.PaymentMethod.values()[random.nextInt(Payment.PaymentMethod.values().length)])
                                .status(paymentStatus)
                                .transactionId("TXN" + System.currentTimeMillis() + i)
                                .createdAt(booking.getCreatedAt())
                                .build();
                        
                        booking.setPayment(payment);

                        // Save booking first to get ID if needed, but cascade PERSIST on Payment usually handles it?
                        // Actually usually we save booking, then payment. 
                        // Let's add into list and save all? 
                        // Better to save individually to handle relationships if CascadeType.ALL is set correct.
                        // Assuming CascadeType.ALL on Booking -> Payment
                        
                        bookings.add(booking);
                }
                
                bookingRepository.saveAll(bookings);
                log.info("Created {} sample bookings", bookings.size());
        }
}
