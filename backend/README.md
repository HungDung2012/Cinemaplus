# Cinema Backend

Spring Boot REST API for Cinema ticket booking system.

## Getting Started

1. Configure MySQL database in `application.properties`

2. Build project:
```bash
mvn clean install
```

3. Run application:
```bash
mvn spring-boot:run
```

API will be available at: http://localhost:8080

## Tech Stack

- Java 17
- Spring Boot 3.2.0
- Spring Security + JWT
- Spring Data JPA
- MySQL
- Lombok
- ModelMapper

API Endpoints:
Method	Endpoint	Mô tả
POST	/api/auth/register	Đăng ký
POST	/api/auth/login	Đăng nhập
GET	/api/auth/me	Thông tin user
GET	/api/movies	Danh sách phim
GET	/api/movies/now-showing	Phim đang chiếu
GET	/api/movies/coming-soon	Phim sắp chiếu
GET	/api/showtimes/movie/{id}/date/{date}	Lịch chiếu
GET	/api/seats/showtime/{id}/room/{id}	Ghế + trạng thái
POST	/api/bookings	Đặt vé
POST	/api/payments	Thanh toán