# CinemaPlus - Hệ thống đặt vé xem phim trực tuyến

CinemaPlus là hệ thống đặt vé xem phim full-stack, được xây dựng với Spring Boot, MySQL, Next.js và TypeScript. Dự án hỗ trợ quy trình đặt vé từ đầu đến cuối: xem phim và lịch chiếu, chọn ghế, mua đồ ăn kèm, áp dụng voucher/coupon và điểm thưởng, tạo liên kết thanh toán trực tuyến, quản lý đơn đặt vé và vận hành hệ thống qua trang quản trị.

Tài khoản admin: admin@cinema.com - Admin123!

## Tính năng chính

### Khách hàng

- Đăng ký, đăng nhập và quản lý hồ sơ cá nhân bằng JWT authentication.
- Xem danh sách phim, phim đang chiếu, phim sắp chiếu, rạp, phòng chiếu, lịch chiếu, sơ đồ ghế, đồ ăn và khuyến mãi.
- Đặt vé với chọn ghế, combo đồ ăn, giá động, voucher/coupon và điểm thưởng.
- Thanh toán trực tuyến qua VNPay, MoMo và ZaloPay.
- Quay lại hệ thống sau khi thanh toán và kiểm tra trạng thái thanh toán theo mã đặt vé.
- Xem lịch sử đặt vé, chi tiết giao dịch, đánh giá và lịch sử điểm thưởng.

### Quản trị viên

- Quản lý phim, rạp, phòng, ghế, lịch chiếu, giá vé, đồ ăn, voucher, coupon, khuyến mãi, đánh giá, người dùng và đơn đặt vé.
- Tạo lịch chiếu thủ công hoặc tạo hàng loạt.
- Nhập dữ liệu phim từ TMDB.
- Theo dõi dashboard, thống kê, báo cáo, phân tích và audit log.
- Lọc đơn đặt vé theo trạng thái booking và trạng thái thanh toán.

### Backend

- Kiến trúc Spring Boot phân lớp: controller, service, repository, DTO, mapper, model, config, security và exception.
- Xác thực bằng JWT và phân quyền theo vai trò.
- Bean Validation và xử lý lỗi tập trung.
- Luồng đặt vé có transaction và pessimistic locking để giảm rủi ro trùng ghế khi có nhiều yêu cầu đồng thời.
- Lớp tích hợp thanh toán cho VNPay, MoMo và ZaloPay.
- Endpoint IPN/callback công khai để nhận thông báo thanh toán từ cổng thanh toán.
- Job định kỳ để hết hạn booking, cập nhật trạng thái phim và hết hạn voucher/coupon.

## Công nghệ sử dụng

### Frontend

- Next.js 16
- React 18
- TypeScript
- Tailwind CSS
- Axios
- React Query
- Zustand
- React Hook Form, Zod
- Recharts
- Lucide React

### Backend

- Java 17
- Spring Boot 3.2.0
- Spring Security
- Spring Data JPA
- MySQL 8
- JWT
- Lombok
- ModelMapper
- Springdoc OpenAPI

### DevOps

- Docker và Docker Compose
- Cấu hình triển khai trong thư mục `deploy/`
- Ghi chú triển khai cho môi trường cloud như Azure/DigitalOcean/Vercel tùy cấu hình sử dụng

## Cấu trúc thư mục

```text
cinema/
├── backend/                 # REST API Spring Boot
│   ├── src/main/java/com/cinema/
│   │   ├── audit/           # Audit log aspect, event, snapshot
│   │   ├── config/          # Security, CORS, app, TMDB, dữ liệu mẫu
│   │   ├── controller/      # REST controller public và admin
│   │   ├── dto/             # DTO cho request/response/payment/TMDB
│   │   ├── exception/       # Xử lý lỗi tập trung
│   │   ├── model/           # Entity JPA
│   │   ├── repository/      # Spring Data repository
│   │   ├── scheduler/       # Job hết hạn và cập nhật trạng thái
│   │   ├── security/        # JWT filter, provider, user principal
│   │   └── service/         # Logic nghiệp vụ và cổng thanh toán
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                # Giao diện Next.js App Router
│   ├── app/                 # Trang và route segment
│   ├── components/          # UI, layout, booking, admin component
│   ├── contexts/            # Auth context
│   ├── lib/                 # Tiện ích Axios/API
│   ├── services/            # API client
│   ├── types/               # TypeScript type dùng chung
│   ├── Dockerfile
│   └── package.json
├── deploy/                  # Cấu hình triển khai
├── docker-compose.yml
└── README.md
```

## Cài đặt và chạy dự án

### Yêu cầu

- Node.js 18+
- npm
- Java 17+
- Maven 3.8+
- MySQL 8+
- Docker, nếu muốn chạy bằng Docker Compose

### Chạy bằng Docker Compose

```bash
docker compose up --build
```

Các service mặc định:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- MySQL: service nội bộ tên `db`

### Chạy backend local

Tạo database MySQL:

```sql
CREATE DATABASE cinema;
```

Tạo file cấu hình từ file mẫu:

```bash
cp backend/src/main/resources/application.properties.example backend/src/main/resources/application.properties
```

Cập nhật các giá trị local:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/cinema
spring.datasource.username=root
spring.datasource.password=YOUR_DB_PASSWORD
jwt.secret=YOUR_JWT_SECRET_KEY_MIN_32_CHARS
cors.allowed-origins=http://localhost:3000
```

Khởi động backend:

```bash
cd backend
mvn spring-boot:run
```

Backend chạy tại `http://localhost:8080`.

### Chạy frontend local

Tạo file `frontend/.env.local`:

```env
BACKEND_INTERNAL_URL=http://localhost:8080
# Tùy chọn. Có thể để trống để dùng proxy /api của Next.js.
# NEXT_PUBLIC_API_URL=/api
```

Cài dependency và chạy development server:

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại `http://localhost:3000`.

## Cấu hình thanh toán

CinemaPlus tích hợp thanh toán trực tuyến qua VNPay, MoMo và ZaloPay. Frontend gọi `POST /api/payments/create-payment-url`, nhận URL thanh toán, chuyển người dùng sang cổng thanh toán, sau đó kiểm tra trạng thái khi cổng thanh toán redirect về hệ thống.

Ví dụ cấu hình VNPay:

```properties
vnpay.tmn-code=YOUR_TMN_CODE
vnpay.hash-secret=YOUR_SECRET
vnpay.url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
vnpay.return-url=http://localhost:3000/payment/return?method=vnpay
```

Các endpoint liên quan:

- `POST /api/payments/create-payment-url` - tạo payment record và URL redirect sang cổng thanh toán.
- `GET /api/payments/ipn/vnpay` - webhook IPN của VNPay.
- `POST /api/payments/ipn/momo` - webhook IPN của MoMo.
- `POST /api/payments/ipn/zalopay` - callback của ZaloPay.
- `GET /api/payments/status/{bookingCode}` - kiểm tra trạng thái thanh toán theo mã đặt vé.

## Nhóm API chính

- `POST /api/auth/register` - đăng ký tài khoản.
- `POST /api/auth/login` - đăng nhập.
- `GET /api/auth/me` - lấy thông tin người dùng hiện tại.
- `GET /api/movies` - danh sách phim.
- `GET /api/movies/now-showing` - phim đang chiếu.
- `GET /api/movies/coming-soon` - phim sắp chiếu.
- `GET /api/theaters` - danh sách rạp.
- `GET /api/showtimes` - lịch chiếu.
- `GET /api/seats/showtime/{showtimeId}/room/{roomId}` - sơ đồ ghế theo suất chiếu và phòng.
- `POST /api/bookings` - tạo đơn đặt vé.
- `POST /api/payments/create-payment-url` - tạo URL thanh toán.
- `GET /api/payments/status/{bookingCode}` - tra cứu trạng thái thanh toán.
- `GET /api/admin/**` - API đọc dữ liệu quản trị.
- `POST /api/admin/**` - API tạo dữ liệu quản trị.
- `PUT /api/admin/**` - API cập nhật dữ liệu quản trị.
- `DELETE /api/admin/**` - API xóa dữ liệu quản trị.

## Lệnh thường dùng

### Backend

```bash
cd backend
mvn test
mvn clean package
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run start
npm run lint
```

## Ghi chú

- Cổng thanh toán trực tuyến cần thông tin sandbox hoặc production hợp lệ.
- URL IPN/callback phải truy cập được từ phía cổng thanh toán khi triển khai thật.
- `BACKEND_URL` và `FRONTEND_URL` cần trỏ đúng URL public ở môi trường production để tạo return URL và callback URL chính xác.
- Chức năng import phim từ TMDB cần `tmdb.api.token` hoặc biến môi trường tương ứng.

## Mục đích sử dụng

Dự án được xây dựng phục vụ học tập, thực hành và làm portfolio.
