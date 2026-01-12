# 🎬 Cinema - Hệ thống đặt vé xem phim online

Dự án đặt vé xem phim trực tuyến sử dụng Next.js (Frontend) và Java Spring Boot (Backend).

## 📋 Công nghệ sử dụng

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Query** - Data fetching & caching
- **Zustand** - State management
- **date-fns** - Date utilities
- **Lucide React** - Icons

### Backend
- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Security** - Authentication & Authorization
- **Spring Data JPA** - Database ORM
- **MySQL** - Database
- **JWT** - Token-based authentication
- **Lombok** - Code generation
- **ModelMapper** - Object mapping

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js 18+ và npm/yarn
- Java 17+
- Maven 3.8+
- MySQL 8.0+

### 1. Cài đặt Frontend

```bash
cd frontend
npm install
```

Tạo file `.env.local` (đã có sẵn):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

Chạy development server:
```bash
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

### 2. Cài đặt Backend

#### Cấu hình MySQL
Tạo database trong MySQL:
```sql
CREATE DATABASE cinema_db;
```

Cập nhật thông tin database trong `backend/src/main/resources/application.properties`:
```properties
spring.datasource.username=your_username
spring.datasource.password=your_password
```

#### Chạy Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend sẽ chạy tại: http://localhost:8080

## 📁 Cấu trúc dự án

```
cinema/
├── frontend/              # Next.js application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/             # Utilities & configs
│   └── package.json
│
├── backend/              # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/cinema/
│   │   │   │   ├── config/      # Configurations
│   │   │   │   ├── controller/  # REST Controllers
│   │   │   │   ├── model/       # Entities
│   │   │   │   ├── repository/  # JPA Repositories
│   │   │   │   ├── service/     # Business logic
│   │   │   │   └── dto/         # Data Transfer Objects
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   └── pom.xml
│
└── README.md
```

## 🔑 API Endpoints (Dự kiến)

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Thông tin user

### Movies
- `GET /api/movies` - Danh sách phim
- `GET /api/movies/{id}` - Chi tiết phim
- `POST /api/movies` - Thêm phim (Admin)
- `PUT /api/movies/{id}` - Cập nhật phim (Admin)
- `DELETE /api/movies/{id}` - Xóa phim (Admin)

### Showtimes
- `GET /api/showtimes` - Lịch chiếu
- `GET /api/showtimes/{id}` - Chi tiết lịch chiếu
- `POST /api/showtimes` - Thêm lịch chiếu (Admin)

### Bookings
- `POST /api/bookings` - Đặt vé
- `GET /api/bookings` - Lịch sử đặt vé
- `GET /api/bookings/{id}` - Chi tiết đặt vé
- `DELETE /api/bookings/{id}` - Hủy vé

## 📊 Database Schema (Dự kiến)

### Tables
- **users** - Thông tin người dùng
- **movies** - Thông tin phim
- **theaters** - Rạp chiếu
- **rooms** - Phòng chiếu
- **seats** - Ghế ngồi
- **showtimes** - Lịch chiếu
- **bookings** - Đơn đặt vé
- **booking_seats** - Ghế đã đặt
- **payments** - Thanh toán

## 🛠️ Phát triển tiếp

### Frontend
1. Tạo các components cho Movie listing, Movie detail
2. Tạo trang đặt vé với seat selection
3. Tích hợp thanh toán
4. Tạo trang quản lý đơn hàng

### Backend
1. Implement các Entity models
2. Tạo Repository interfaces
3. Viết Business logic trong Services
4. Implement JWT authentication
5. Tạo các REST API endpoints
6. Thêm validation và error handling

## 📝 Scripts

### Frontend
- `npm run dev` - Chạy development
- `npm run build` - Build production
- `npm start` - Chạy production
- `npm run lint` - Lint code

### Backend
- `mvn spring-boot:run` - Chạy application
- `mvn clean install` - Build project
- `mvn test` - Chạy tests

## 📄 License

MIT License

## 👥 Contributors

Dự án thực hành Next.js + Spring Boot
