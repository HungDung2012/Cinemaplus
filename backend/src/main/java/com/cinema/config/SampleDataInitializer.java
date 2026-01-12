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
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Khởi tạo dữ liệu mẫu cho hệ thống
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class SampleDataInitializer implements CommandLineRunner {

    private final RegionRepository regionRepository;
    private final TheaterRepository theaterRepository;
    private final RoomRepository roomRepository;
    private final SeatRepository seatRepository;
    private final MovieRepository movieRepository;
    private final ShowtimeRepository showtimeRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final FoodRepository foodRepository;

    @Override
    public void run(String... args) {
        if (regionRepository.count() == 0) {
            initRegions();
        }
        if (theaterRepository.count() == 0) {
            initTheaters();
        }
        // Tạo rooms và seats nếu có theaters nhưng không có rooms
        if (roomRepository.count() == 0 && theaterRepository.count() > 0) {
            initRoomsAndSeats();
        }
        if (movieRepository.count() == 0) {
            initSampleMovies();
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
            Region.builder().name("Miền Nam").code("SOUTH").build()
        );
        regionRepository.saveAll(regions);
        log.info("Created {} regions", regions.size());
    }

    private void initTheaters() {
        log.info("Initializing theaters...");
        
        Region north = regionRepository.findByCode("NORTH").orElse(null);
        Region central = regionRepository.findByCode("CENTRAL").orElse(null);
        Region south = regionRepository.findByCode("SOUTH").orElse(null);

        if (north == null || central == null || south == null) {
            log.warn("Regions not found, skipping theater initialization");
            return;
        }

        List<Theater> theaters = new ArrayList<>();

        // Miền Bắc
        theaters.add(createTheater("CinemaPlus Vincom Bà Triệu", "191 Bà Triệu, Hai Bà Trưng", "Hà Nội", north));
        theaters.add(createTheater("CinemaPlus Royal City", "72A Nguyễn Trãi, Thanh Xuân", "Hà Nội", north));
        theaters.add(createTheater("CinemaPlus Times City", "458 Minh Khai, Hai Bà Trưng", "Hà Nội", north));
        theaters.add(createTheater("CinemaPlus Aeon Long Biên", "27 Cổ Linh, Long Biên", "Hà Nội", north));
        theaters.add(createTheater("CinemaPlus Hải Phòng", "10 Lê Hồng Phong, Ngô Quyền", "Hải Phòng", north));

        // Miền Trung  
        theaters.add(createTheater("CinemaPlus Đà Nẵng", "910 Ngô Quyền, Sơn Trà", "Đà Nẵng", central));
        theaters.add(createTheater("CinemaPlus Vincom Đà Nẵng", "Vincom Plaza, Hải Châu", "Đà Nẵng", central));
        theaters.add(createTheater("CinemaPlus Huế", "25 Hai Bà Trưng, TP Huế", "Huế", central));
        theaters.add(createTheater("CinemaPlus Nha Trang", "50 Thống Nhất, Nha Trang", "Nha Trang", central));

        // Miền Nam
        theaters.add(createTheater("CinemaPlus Landmark 81", "Vinhomes Central Park, Bình Thạnh", "TP.HCM", south));
        theaters.add(createTheater("CinemaPlus Vincom Đồng Khởi", "72 Lê Thánh Tôn, Quận 1", "TP.HCM", south));
        theaters.add(createTheater("CinemaPlus Aeon Tân Phú", "30 Bờ Bao Tân Thắng, Tân Phú", "TP.HCM", south));
        theaters.add(createTheater("CinemaPlus Crescent Mall", "101 Tôn Dật Tiên, Quận 7", "TP.HCM", south));
        theaters.add(createTheater("CinemaPlus Giga Mall", "242 Phạm Văn Đồng, Thủ Đức", "TP.HCM", south));
        theaters.add(createTheater("CinemaPlus Cantavil", "1 Cantavil, Quận 2", "TP.HCM", south));
        theaters.add(createTheater("CinemaPlus Cần Thơ", "209 đường 30/4, Ninh Kiều", "Cần Thơ", south));
        theaters.add(createTheater("CinemaPlus Biên Hòa", "Vincom Biên Hòa, Đồng Nai", "Biên Hòa", south));

        theaterRepository.saveAll(theaters);
        log.info("Created {} theaters", theaters.size());

        // Create rooms and seats for each theater
        for (Theater theater : theaters) {
            createRoomsForTheater(theater);
        }
    }

    private Theater createTheater(String name, String address, String city, Region region) {
        return Theater.builder()
                .name(name)
                .address(address)
                .city(city)
                .region(region)
                .phone("1900" + (1000 + new Random().nextInt(9000)))
                .email(name.toLowerCase().replace(" ", "").replace("cinemaplus", "contact@cinemaplus") + ".vn")
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
        if (vipCount < 1) vipCount = 1;

        int roomNumber = 1;
        
        // Tạo phòng Standard 2D
        for (int i = 0; i < standard2DCount; i++) {
            rooms.add(createRoom(theater, "Phòng " + roomNumber++, Room.RoomType.STANDARD_2D, 10 + random.nextInt(3), 12 + random.nextInt(3)));
        }
        
        // Tạo phòng Standard 3D
        for (int i = 0; i < standard3DCount; i++) {
            rooms.add(createRoom(theater, "Phòng " + roomNumber++, Room.RoomType.STANDARD_3D, 10 + random.nextInt(2), 12 + random.nextInt(2)));
        }
        
        // Tạo phòng IMAX (lớn hơn)
        for (int i = 0; i < imaxCount; i++) {
            rooms.add(createRoom(theater, "IMAX " + (i + 1), Room.RoomType.IMAX, 14 + random.nextInt(3), 16 + random.nextInt(3)));
        }
        
        // Tạo phòng VIP/4DX (nhỏ hơn, cao cấp)
        for (int i = 0; i < vipCount; i++) {
            rooms.add(createRoom(theater, "VIP " + (i + 1), Room.RoomType.VIP_4DX, 6 + random.nextInt(2), 8 + random.nextInt(3)));
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

        for (int row = 0; row < totalRows; row++) {
            for (int col = 1; col <= seatsPerRow; col++) {
                Seat.SeatType seatType;
                BigDecimal priceMultiplier;

                if (roomType == Room.RoomType.VIP_4DX) {
                    // Phòng VIP: tất cả ghế đều VIP
                    if (row >= totalRows - 2) {
                        seatType = Seat.SeatType.COUPLE;
                        priceMultiplier = new BigDecimal("2.5");
                    } else {
                        seatType = Seat.SeatType.VIP;
                        priceMultiplier = new BigDecimal("1.5");
                    }
                } else if (roomType == Room.RoomType.IMAX) {
                    // Phòng IMAX: giữa VIP, 2 hàng cuối Couple
                    if (row >= totalRows - 2) {
                        seatType = Seat.SeatType.COUPLE;
                        priceMultiplier = new BigDecimal("2.2");
                    } else if (row >= totalRows / 3 && row <= 2 * totalRows / 3) {
                        // Khu vực giữa - ghế tốt nhất
                        seatType = Seat.SeatType.VIP;
                        priceMultiplier = new BigDecimal("1.4");
                    } else {
                        seatType = Seat.SeatType.STANDARD;
                        priceMultiplier = new BigDecimal("1.2");
                    }
                } else {
                    // Phòng thường (2D, 3D)
                    // 2 hàng cuối: Couple (góc) và VIP (giữa)
                    if (row >= totalRows - 2) {
                        if (col <= 2 || col > seatsPerRow - 2) {
                            seatType = Seat.SeatType.COUPLE;
                            priceMultiplier = new BigDecimal("2.0");
                        } else {
                            seatType = Seat.SeatType.VIP;
                            priceMultiplier = new BigDecimal("1.3");
                        }
                    }
                    // Hàng giữa (khu vực tốt)
                    else if (row >= totalRows / 3 && row <= 2 * totalRows / 3 && col > 2 && col <= seatsPerRow - 2) {
                        seatType = Seat.SeatType.VIP;
                        priceMultiplier = new BigDecimal("1.2");
                    }
                    // Ghế thường
                    else {
                        seatType = Seat.SeatType.STANDARD;
                        priceMultiplier = BigDecimal.ONE;
                    }
                }

                // Tạo một số ghế không khả dụng (đã hỏng, bảo trì)
                boolean isActive = true;
                // 2% ghế không khả dụng
                if (new Random().nextInt(100) < 2) {
                    isActive = false;
                }

                Seat seat = Seat.builder()
                        .room(room)
                        .rowName(String.valueOf(rowLabels[row]))
                        .seatNumber(col)
                        .seatType(seatType)
                        .priceMultiplier(priceMultiplier)
                        .active(isActive)
                        .build();
                seats.add(seat);
            }
        }

        seatRepository.saveAll(seats);
    }

    private void initSampleMovies() {
        log.info("Initializing sample movies...");
        List<Movie> movies = new ArrayList<>();

        // ============= PHIM ĐÃ CHIẾU (2019-2024) - ENDED =============
        
        // 2019
        movies.add(createMovie("Avengers: Endgame", "Anthony Russo, Joe Russo", "Robert Downey Jr., Chris Evans, Mark Ruffalo, Scarlett Johansson",
                "Sau những sự kiện tàn khốc của Infinity War, các Avengers còn lại phải tập hợp một lần nữa để đảo ngược hành động của Thanos và khôi phục vũ trụ.",
                181, "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
                "https://www.youtube.com/watch?v=TcMBFSGVi1c",
                LocalDate.of(2019, 4, 26), Movie.MovieStatus.ENDED, 8.4));

        movies.add(createMovie("Joker", "Todd Phillips", "Joaquin Phoenix, Robert De Niro, Zazie Beetz",
                "Câu chuyện gốc về Arthur Fleck, một người đàn ông bị xã hội ruồng bỏ dần dần trở thành kẻ thù tội phạm ở Gotham City.",
                122, "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
                "https://www.youtube.com/watch?v=zAGVQLHvwOY",
                LocalDate.of(2019, 10, 4), Movie.MovieStatus.ENDED, 8.4));

        movies.add(createMovie("Parasite", "Bong Joon-ho", "Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong, Choi Woo-shik",
                "Gia đình Kim nghèo khó tìm cách xâm nhập vào cuộc sống của gia đình Park giàu có, dẫn đến những hậu quả không ngờ.",
                132, "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
                "https://www.youtube.com/watch?v=5xH0HfJHsaY",
                LocalDate.of(2019, 5, 30), Movie.MovieStatus.ENDED, 8.6));

        movies.add(createMovie("The Lion King (2019)", "Jon Favreau", "Donald Glover, Beyoncé, James Earl Jones, Chiwetel Ejiofor",
                "Phiên bản làm lại của bộ phim hoạt hình kinh điển về chú sư tử Simba.",
                118, "https://image.tmdb.org/t/p/w500/2bXbqYdUdNVa8VIWXVfclP2ICtT.jpg",
                "https://www.youtube.com/watch?v=7TavVZMewpY",
                LocalDate.of(2019, 7, 19), Movie.MovieStatus.ENDED, 7.1));

        // 2020
        movies.add(createMovie("Tenet", "Christopher Nolan", "John David Washington, Robert Pattinson, Elizabeth Debicki",
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
        movies.add(createMovie("Spider-Man: No Way Home", "Jon Watts", "Tom Holland, Zendaya, Benedict Cumberbatch, Tobey Maguire, Andrew Garfield",
                "Peter Parker nhờ Doctor Strange giúp đỡ nhưng vô tình mở ra đa vũ trụ, mang theo những kẻ thù từ các thực tại khác.",
                148, "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
                "https://www.youtube.com/watch?v=JfVOs4VSpmA",
                LocalDate.of(2021, 12, 17), Movie.MovieStatus.ENDED, 8.3));

        movies.add(createMovie("Dune (2021)", "Denis Villeneuve", "Timothée Chalamet, Rebecca Ferguson, Oscar Isaac, Zendaya",
                "Paul Atreides, một chàng trai trẻ tài năng được định mệnh cho những điều vĩ đại, phải đến hành tinh nguy hiểm nhất vũ trụ.",
                155, "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
                "https://www.youtube.com/watch?v=8g18jFHCLXk",
                LocalDate.of(2021, 10, 22), Movie.MovieStatus.ENDED, 8.0));

        movies.add(createMovie("Shang-Chi and the Legend of the Ten Rings", "Destin Daniel Cretton", "Simu Liu, Awkwafina, Tony Leung",
                "Shang-Chi phải đối mặt với quá khứ khi bị lôi kéo vào tổ chức bí ẩn Ten Rings.",
                132, "https://image.tmdb.org/t/p/w500/1BIoJGKbXjdFDAqUEiA2VHqkK1Z.jpg",
                "https://www.youtube.com/watch?v=8YjFbMbfXaQ",
                LocalDate.of(2021, 9, 3), Movie.MovieStatus.ENDED, 7.4));

        movies.add(createMovie("Eternals", "Chloé Zhao", "Gemma Chan, Richard Madden, Angelina Jolie, Salma Hayek",
                "Nhóm siêu anh hùng bất tử Eternals phải bảo vệ Trái Đất khỏi những sinh vật cổ đại.",
                157, "https://image.tmdb.org/t/p/w500/bcCBq9N1EMo3daNIjWJ8kYvrQm6.jpg",
                "https://www.youtube.com/watch?v=x_me3xsvDgk",
                LocalDate.of(2021, 11, 5), Movie.MovieStatus.ENDED, 6.4));

        // 2022
        movies.add(createMovie("Avatar: The Way of Water", "James Cameron", "Sam Worthington, Zoe Saldana, Sigourney Weaver, Kate Winslet",
                "Jake Sully sống với gia đình mới trên Pandora. Khi mối đe dọa quen thuộc quay trở lại, họ phải làm việc với clan Metkayina.",
                192, "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
                "https://www.youtube.com/watch?v=d9MyW72ELq0",
                LocalDate.of(2022, 12, 16), Movie.MovieStatus.ENDED, 7.6));

        movies.add(createMovie("Top Gun: Maverick", "Joseph Kosinski", "Tom Cruise, Miles Teller, Jennifer Connelly, Jon Hamm",
                "Sau hơn 30 năm phục vụ, Pete 'Maverick' Mitchell phải huấn luyện một nhóm phi công Top Gun cho nhiệm vụ đặc biệt.",
                130, "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
                "https://www.youtube.com/watch?v=qSqVVswa420",
                LocalDate.of(2022, 5, 27), Movie.MovieStatus.ENDED, 8.3));

        movies.add(createMovie("The Batman", "Matt Reeves", "Robert Pattinson, Zoë Kravitz, Paul Dano, Colin Farrell",
                "Batman điều tra một loạt vụ giết người ở Gotham City, dẫn đến việc phơi bày sự tham nhũng.",
                176, "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fvber9h3tpEhF6J.jpg",
                "https://www.youtube.com/watch?v=mqqft2x_Aa4",
                LocalDate.of(2022, 3, 4), Movie.MovieStatus.ENDED, 7.7));

        movies.add(createMovie("Black Panther: Wakanda Forever", "Ryan Coogler", "Letitia Wright, Lupita Nyong'o, Danai Gurira, Angela Bassett",
                "Wakanda chiến đấu để bảo vệ đất nước sau cái chết của Vua T'Challa, đối mặt với kẻ thù mới Namor.",
                161, "https://image.tmdb.org/t/p/w500/sv1xJUazXeYqALJL7LrEJk8JpwJ.jpg",
                "https://www.youtube.com/watch?v=_Z3QKkl1WyM",
                LocalDate.of(2022, 11, 11), Movie.MovieStatus.ENDED, 7.3));

        movies.add(createMovie("Doctor Strange in the Multiverse of Madness", "Sam Raimi", "Benedict Cumberbatch, Elizabeth Olsen, Xochitl Gomez",
                "Doctor Strange đi qua các vũ trụ thay thế để đối mặt với một kẻ thù mới bí ẩn và mạnh mẽ.",
                126, "https://image.tmdb.org/t/p/w500/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg",
                "https://www.youtube.com/watch?v=aWzlQ2N6qqg",
                LocalDate.of(2022, 5, 6), Movie.MovieStatus.ENDED, 7.0));

        // 2023
        movies.add(createMovie("Oppenheimer", "Christopher Nolan", "Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.",
                "Câu chuyện về J. Robert Oppenheimer và vai trò của ông trong việc phát triển bom nguyên tử.",
                180, "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
                "https://www.youtube.com/watch?v=uYPbbksJxIg", 
                LocalDate.of(2023, 7, 21), Movie.MovieStatus.ENDED, 8.9));

        movies.add(createMovie("Barbie", "Greta Gerwig", "Margot Robbie, Ryan Gosling, America Ferrera, Kate McKinnon",
                "Barbie sống ở Barbie Land và bắt đầu đặt câu hỏi về cuộc sống của mình, dẫn đến hành trình khám phá thế giới thực.",
                114, "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
                "https://www.youtube.com/watch?v=pBk4NYhWNMM",
                LocalDate.of(2023, 7, 21), Movie.MovieStatus.ENDED, 7.8));

        movies.add(createMovie("Guardians of the Galaxy Vol. 3", "James Gunn", "Chris Pratt, Zoe Saldana, Dave Bautista, Karen Gillan",
                "Peter Quill phải tập hợp đội để bảo vệ Rocket khỏi kẻ thù mới High Evolutionary.",
                150, "https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg",
                "https://www.youtube.com/watch?v=u3V5KDHRQvk",
                LocalDate.of(2023, 5, 5), Movie.MovieStatus.ENDED, 8.0));

        movies.add(createMovie("John Wick: Chapter 4", "Chad Stahelski", "Keanu Reeves, Donnie Yen, Bill Skarsgård, Laurence Fishburne",
                "John Wick khám phá con đường để đánh bại High Table, đối mặt với kẻ thù mới và đồng minh cũ.",
                169, "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
                "https://www.youtube.com/watch?v=qEVUtrk8_B4",
                LocalDate.of(2023, 3, 24), Movie.MovieStatus.ENDED, 7.7));

        movies.add(createMovie("The Super Mario Bros. Movie", "Aaron Horvath, Michael Jelenic", "Chris Pratt, Anya Taylor-Joy, Charlie Day, Jack Black",
                "Mario và Luigi bị hút vào thế giới Mushroom Kingdom và phải cứu Princess Peach khỏi Bowser.",
                92, "https://image.tmdb.org/t/p/w500/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg",
                "https://www.youtube.com/watch?v=TnGl01FkMMo",
                LocalDate.of(2023, 4, 5), Movie.MovieStatus.ENDED, 7.1));

        movies.add(createMovie("Mission: Impossible - Dead Reckoning Part One", "Christopher McQuarrie", "Tom Cruise, Hayley Atwell, Ving Rhames",
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
        movies.add(createMovie("Dune: Part Two", "Denis Villeneuve", "Timothée Chalamet, Zendaya, Rebecca Ferguson, Austin Butler",
                "Paul Atreides hợp nhất với Chani và người Fremen trong cuộc chiến báo thù chống lại những kẻ đã phá hủy gia đình anh.",
                166, "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
                "https://www.youtube.com/watch?v=Way9Dexny3w",
                LocalDate.of(2024, 3, 1), Movie.MovieStatus.ENDED, 8.8));

        movies.add(createMovie("Kung Fu Panda 4", "Mike Mitchell", "Jack Black, Awkwafina, Viola Davis, Dustin Hoffman",
                "Po được chọn làm Thủ lĩnh tâm linh của Thung lũng Hòa bình và phải tìm Dragon Warrior mới.",
                94, "https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
                "https://www.youtube.com/watch?v=_inKs4eeHiI",
                LocalDate.of(2024, 3, 8), Movie.MovieStatus.ENDED, 7.0));

        movies.add(createMovie("Godzilla x Kong: The New Empire", "Adam Wingard", "Rebecca Hall, Brian Tyree Henry, Dan Stevens",
                "Godzilla và Kong phải hợp tác để đối mặt với mối đe dọa chưa từng có từ Hollow Earth.",
                115, "https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg",
                "https://www.youtube.com/watch?v=lV1OOlGwExM",
                LocalDate.of(2024, 3, 29), Movie.MovieStatus.ENDED, 6.6));

        movies.add(createMovie("Inside Out 2", "Kelsey Mann", "Amy Poehler, Maya Hawke, Kensington Tallman, Liza Lapira",
                "Riley bước vào tuổi thiếu niên và gặp gỡ những cảm xúc mới như Anxiety, Envy, Ennui và Embarrassment.",
                96, "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
                "https://www.youtube.com/watch?v=LEjhY15eCx0",
                LocalDate.of(2024, 6, 14), Movie.MovieStatus.ENDED, 8.2));

        movies.add(createMovie("Deadpool & Wolverine", "Shawn Levy", "Ryan Reynolds, Hugh Jackman, Emma Corrin",
                "Deadpool và Wolverine phải hợp tác để cứu đa vũ trụ khỏi bị hủy diệt.",
                128, "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
                "https://www.youtube.com/watch?v=73_1biulkYk",
                LocalDate.of(2024, 7, 26), Movie.MovieStatus.ENDED, 8.5));

        movies.add(createMovie("Furiosa: A Mad Max Saga", "George Miller", "Anya Taylor-Joy, Chris Hemsworth, Tom Burke",
                "Câu chuyện nguồn gốc của Furiosa trước khi gặp Max Rockatansky.",
                148, "https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg",
                "https://www.youtube.com/watch?v=XJMuhwVlca4",
                LocalDate.of(2024, 5, 24), Movie.MovieStatus.ENDED, 7.6));

        movies.add(createMovie("The Fall Guy", "David Leitch", "Ryan Gosling, Emily Blunt, Aaron Taylor-Johnson",
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

        movies.add(createMovie("Beetlejuice Beetlejuice", "Tim Burton", "Michael Keaton, Winona Ryder, Jenna Ortega",
                "Lydia Deetz phải đối mặt lại với Beetlejuice khi con gái cô vô tình mở cổng sang thế giới bên kia.",
                104, "https://image.tmdb.org/t/p/w500/kKgQzkUCnQmeTPkyIwHly2t6ZFI.jpg",
                "https://www.youtube.com/watch?v=ykdYU9YvVVk",
                LocalDate.of(2024, 9, 6), Movie.MovieStatus.ENDED, 7.1));

        movies.add(createMovie("Joker: Folie à Deux", "Todd Phillips", "Joaquin Phoenix, Lady Gaga, Brendan Gleeson",
                "Arthur Fleck gặp Harley Quinn trong bệnh viện tâm thần Arkham, dẫn đến mối quan hệ điên rồ.",
                138, "https://image.tmdb.org/t/p/w500/if8QiqCI7WAGImKcJCfzp6VTyKA.jpg",
                "https://www.youtube.com/watch?v=_OKAwz2MsJs",
                LocalDate.of(2024, 10, 4), Movie.MovieStatus.ENDED, 5.8));

        movies.add(createMovie("Venom: The Last Dance", "Kelly Marcel", "Tom Hardy, Juno Temple, Chiwetel Ejiofor",
                "Eddie và Venom phải đưa ra lựa chọn tàn khốc khi họ bị cả hai thế giới truy đuổi.",
                109, "https://image.tmdb.org/t/p/w500/k42Owka8v91Ey0f4vRsoazXpOTS.jpg",
                "https://www.youtube.com/watch?v=HyIyd9joTTc",
                LocalDate.of(2024, 10, 25), Movie.MovieStatus.ENDED, 6.5));

        movies.add(createMovie("Gladiator II", "Ridley Scott", "Paul Mescal, Pedro Pascal, Denzel Washington, Connie Nielsen",
                "Lucius, con trai của Lucilla, phải chiến đấu trong đấu trường để trả thù cho những gì Rome đã làm với gia đình mình.",
                148, "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
                "https://www.youtube.com/watch?v=4rgYUipGJNo",
                LocalDate.of(2024, 11, 22), Movie.MovieStatus.ENDED, 7.0));

        movies.add(createMovie("Moana 2", "David Derrick Jr., Jason Hand, Dana Ledoux Miller", "Auli'i Cravalho, Dwayne Johnson, Temuera Morrison",
                "Moana nhận được cuộc gọi từ tổ tiên và phải hành trình đến vùng biển xa xôi của Oceania.",
                100, "https://image.tmdb.org/t/p/w500/yh64qw9mgXBvlaWDi7Q9tpUBAvH.jpg",
                "https://www.youtube.com/watch?v=hDZ7y8RP5HE",
                LocalDate.of(2024, 11, 27), Movie.MovieStatus.ENDED, 7.2));

        movies.add(createMovie("Wicked", "Jon M. Chu", "Cynthia Erivo, Ariana Grande, Michelle Yeoh, Jeff Goldblum",
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

        movies.add(createMovie("Mufasa: The Lion King", "Barry Jenkins", "Aaron Pierre, Kelvin Harrison Jr., Mads Mikkelsen",
                "Câu chuyện về nguồn gốc của Mufasa, từ một con sư tử mồ côi trở thành vị vua huyền thoại của Pride Lands.",
                118, "https://image.tmdb.org/t/p/w500/lurEK87kukWNaHd0zYnsi3yzJrs.jpg",
                "https://www.youtube.com/watch?v=o17MF9vnabg",
                LocalDate.of(2025, 12, 20), Movie.MovieStatus.NOW_SHOWING, 7.5));

        movies.add(createMovie("Sonic the Hedgehog 3", "Jeff Fowler", "Ben Schwartz, Jim Carrey, Keanu Reeves, Idris Elba",
                "Sonic, Knuckles và Tails phải đối mặt với kẻ thù mới Shadow the Hedgehog để cứu thế giới.",
                109, "https://image.tmdb.org/t/p/w500/d8Ryb8AunYAuycVKDp5HpdWPKgC.jpg",
                "https://www.youtube.com/watch?v=qSu6i2iFMO0",
                LocalDate.of(2025, 12, 20), Movie.MovieStatus.NOW_SHOWING, 7.8));

        movies.add(createMovie("Nosferatu", "Robert Eggers", "Bill Skarsgård, Lily-Rose Depp, Nicholas Hoult, Willem Dafoe",
                "Phiên bản làm lại của bộ phim kinh điển năm 1922 về ma cà rồng Count Orlok ám ảnh một phụ nữ trẻ.",
                132, "https://image.tmdb.org/t/p/w500/5qGIxdEO841C0tdDjYsHFAi7qCr.jpg",
                "https://www.youtube.com/watch?v=nulvWqYUM8k",
                LocalDate.of(2025, 12, 25), Movie.MovieStatus.NOW_SHOWING, 8.1));

        movies.add(createMovie("Kraven the Hunter", "J.C. Chandor", "Aaron Taylor-Johnson, Ariana DeBose, Russell Crowe",
                "Câu chuyện nguồn gốc của một trong những kẻ thù đáng sợ nhất của Spider-Man.",
                127, "https://image.tmdb.org/t/p/w500/i47IUSsN126K11JUzqQIOi1Mg1M.jpg",
                "https://www.youtube.com/watch?v=gnDmJPJnD00",
                LocalDate.of(2025, 12, 13), Movie.MovieStatus.NOW_SHOWING, 6.2));

        movies.add(createMovie("A Complete Unknown", "James Mangold", "Timothée Chalamet, Edward Norton, Elle Fanning",
                "Câu chuyện về Bob Dylan từ ca sĩ folk vô danh trở thành huyền thoại âm nhạc.",
                140, "https://image.tmdb.org/t/p/w500/lntrXpIi9PfhBJejKo5m7cjVDbA.jpg",
                "https://www.youtube.com/watch?v=QaLPdFHTCfo",
                LocalDate.of(2025, 12, 25), Movie.MovieStatus.NOW_SHOWING, 7.8));

        // ============= PHIM SẮP CHIẾU - COMING_SOON =============
        movies.add(createMovie("Captain America: Brave New World", "Julius Onah", "Anthony Mackie, Harrison Ford, Tim Blake Nelson",
                "Sam Wilson tiếp tục di sản của Captain America trong thế giới mới đầy biến động chính trị.",
                120, "https://image.tmdb.org/t/p/w500/pzIddUEMWhiHYxavvgX5nLrjuqT.jpg",
                "https://www.youtube.com/watch?v=example3",
                LocalDate.of(2026, 2, 14), Movie.MovieStatus.COMING_SOON, 0.0));

        movies.add(createMovie("Snow White", "Marc Webb", "Rachel Zegler, Gal Gadot, Andrew Burnap",
                "Phiên bản live-action của câu chuyện cổ tích kinh điển Bạch Tuyết và bảy chú lùn.",
                110, "https://image.tmdb.org/t/p/w500/sSh8JVGxfHSIqerbnUrUZrVsCC.jpg",
                "https://www.youtube.com/watch?v=example4",
                LocalDate.of(2026, 3, 21), Movie.MovieStatus.COMING_SOON, 0.0));

        movies.add(createMovie("Avatar 3", "James Cameron", "Sam Worthington, Zoe Saldana, Sigourney Weaver, Kate Winslet",
                "Tiếp tục câu chuyện của Jake Sully và gia đình trên Pandora, khám phá vùng đất mới.",
                180, "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
                "https://www.youtube.com/watch?v=example5",
                LocalDate.of(2026, 12, 19), Movie.MovieStatus.COMING_SOON, 0.0));

        movies.add(createMovie("Jurassic World Rebirth", "Gareth Edwards", "Scarlett Johansson, Jonathan Bailey, Mahershala Ali",
                "Chương mới trong loạt phim khủng long huyền thoại với những sinh vật kỷ Jura đã tiến hóa.",
                140, "https://image.tmdb.org/t/p/w500/hkxxMIGaiCTmrEArK7J56JTKUlB.jpg",
                "https://www.youtube.com/watch?v=example6",
                LocalDate.of(2026, 7, 2), Movie.MovieStatus.COMING_SOON, 0.0));

        movies.add(createMovie("The Fantastic Four: First Steps", "Matt Shakman", "Pedro Pascal, Vanessa Kirby, Joseph Quinn, Ebon Moss-Bachrach",
                "Gia đình siêu anh hùng đầu tiên của Marvel giới thiệu với MCU.",
                150, "https://image.tmdb.org/t/p/w500/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg",
                "https://www.youtube.com/watch?v=example7",
                LocalDate.of(2026, 7, 25), Movie.MovieStatus.COMING_SOON, 0.0));

        movies.add(createMovie("Mission: Impossible 8", "Christopher McQuarrie", "Tom Cruise, Hayley Atwell, Simon Pegg, Ving Rhames",
                "Ethan Hunt đối mặt với thử thách lớn nhất trong sự nghiệp IMF.",
                160, "https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg",
                "https://www.youtube.com/watch?v=example8",
                LocalDate.of(2026, 5, 23), Movie.MovieStatus.COMING_SOON, 0.0));

        movies.add(createMovie("Zootopia 2", "Byron Howard, Jared Bush", "Ginnifer Goodwin, Jason Bateman, Idris Elba",
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

        log.info("Creating showtimes for {} movies in {} rooms", nowShowingMovies.size(), rooms.size());

        List<Showtime> showtimes = new ArrayList<>();
        LocalDate today = LocalDate.now();
        Random random = new Random();
        
        // Khung giờ chiếu trong ngày
        LocalTime[] morningTimes = {LocalTime.of(8, 0), LocalTime.of(8, 30), LocalTime.of(9, 0), LocalTime.of(9, 30), LocalTime.of(10, 0)};
        LocalTime[] afternoonTimes = {LocalTime.of(11, 30), LocalTime.of(12, 0), LocalTime.of(13, 0), LocalTime.of(14, 0), LocalTime.of(14, 30), LocalTime.of(15, 0), LocalTime.of(15, 30)};
        LocalTime[] eveningTimes = {LocalTime.of(17, 0), LocalTime.of(17, 30), LocalTime.of(18, 0), LocalTime.of(18, 30), LocalTime.of(19, 0), LocalTime.of(19, 30)};
        LocalTime[] nightTimes = {LocalTime.of(20, 0), LocalTime.of(20, 30), LocalTime.of(21, 0), LocalTime.of(21, 30), LocalTime.of(22, 0), LocalTime.of(22, 30), LocalTime.of(23, 0)};
        
        // Giá vé theo khung giờ
        BigDecimal morningPrice = new BigDecimal("65000");
        BigDecimal afternoonPrice = new BigDecimal("85000");
        BigDecimal eveningPrice = new BigDecimal("95000");
        BigDecimal nightPrice = new BigDecimal("105000");
        BigDecimal weekendSurcharge = new BigDecimal("20000");

        // Tạo lịch chiếu cho 14 ngày (2 tuần)
        for (int day = 0; day < 14; day++) {
            LocalDate showDate = today.plusDays(day);
            boolean isWeekend = showDate.getDayOfWeek().getValue() >= 6; // Saturday = 6, Sunday = 7
            
            for (Room room : rooms) {
                // Mỗi phòng có 5-8 suất chiếu/ngày
                int movieIndex = 0;
                
                // Suất sáng (1-2 suất)
                int morningSessions = 1 + random.nextInt(2);
                for (int i = 0; i < morningSessions; i++) {
                    LocalTime startTime = morningTimes[random.nextInt(morningTimes.length)];
                    Movie movie = nowShowingMovies.get(movieIndex % nowShowingMovies.size());
                    movieIndex++;
                    
                    BigDecimal price = morningPrice;
                    if (isWeekend) price = price.add(weekendSurcharge);
                    if (room.getRoomType() == Room.RoomType.IMAX) price = price.add(new BigDecimal("30000"));
                    if (room.getRoomType() == Room.RoomType.VIP_4DX) price = price.add(new BigDecimal("50000"));
                    if (room.getRoomType() == Room.RoomType.STANDARD_3D) price = price.add(new BigDecimal("15000"));
                    
                    showtimes.add(createShowtime(movie, room, showDate, startTime, price));
                }
                
                // Suất chiều (2-3 suất)
                int afternoonSessions = 2 + random.nextInt(2);
                for (int i = 0; i < afternoonSessions; i++) {
                    LocalTime startTime = afternoonTimes[random.nextInt(afternoonTimes.length)];
                    Movie movie = nowShowingMovies.get(movieIndex % nowShowingMovies.size());
                    movieIndex++;
                    
                    BigDecimal price = afternoonPrice;
                    if (isWeekend) price = price.add(weekendSurcharge);
                    if (room.getRoomType() == Room.RoomType.IMAX) price = price.add(new BigDecimal("30000"));
                    if (room.getRoomType() == Room.RoomType.VIP_4DX) price = price.add(new BigDecimal("50000"));
                    if (room.getRoomType() == Room.RoomType.STANDARD_3D) price = price.add(new BigDecimal("15000"));
                    
                    showtimes.add(createShowtime(movie, room, showDate, startTime, price));
                }
                
                // Suất tối (2-3 suất) - giờ vàng
                int eveningSessions = 2 + random.nextInt(2);
                for (int i = 0; i < eveningSessions; i++) {
                    LocalTime startTime = eveningTimes[random.nextInt(eveningTimes.length)];
                    Movie movie = nowShowingMovies.get(movieIndex % nowShowingMovies.size());
                    movieIndex++;
                    
                    BigDecimal price = eveningPrice;
                    if (isWeekend) price = price.add(weekendSurcharge);
                    if (room.getRoomType() == Room.RoomType.IMAX) price = price.add(new BigDecimal("30000"));
                    if (room.getRoomType() == Room.RoomType.VIP_4DX) price = price.add(new BigDecimal("50000"));
                    if (room.getRoomType() == Room.RoomType.STANDARD_3D) price = price.add(new BigDecimal("15000"));
                    
                    showtimes.add(createShowtime(movie, room, showDate, startTime, price));
                }
                
                // Suất khuya (1-2 suất)
                int nightSessions = 1 + random.nextInt(2);
                for (int i = 0; i < nightSessions; i++) {
                    LocalTime startTime = nightTimes[random.nextInt(nightTimes.length)];
                    Movie movie = nowShowingMovies.get(movieIndex % nowShowingMovies.size());
                    movieIndex++;
                    
                    BigDecimal price = nightPrice;
                    if (isWeekend) price = price.add(weekendSurcharge);
                    if (room.getRoomType() == Room.RoomType.IMAX) price = price.add(new BigDecimal("30000"));
                    if (room.getRoomType() == Room.RoomType.VIP_4DX) price = price.add(new BigDecimal("50000"));
                    if (room.getRoomType() == Room.RoomType.STANDARD_3D) price = price.add(new BigDecimal("15000"));
                    
                    showtimes.add(createShowtime(movie, room, showDate, startTime, price));
                }
            }
        }

        showtimeRepository.saveAll(showtimes);
        log.info("Created {} showtimes for 14 days across {} rooms", showtimes.size(), rooms.size());
    }

    private Showtime createShowtime(Movie movie, Room room, LocalDate showDate, LocalTime startTime, BigDecimal price) {
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
            if (movie.getStatus() == Movie.MovieStatus.COMING_SOON) continue;
            
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
}
