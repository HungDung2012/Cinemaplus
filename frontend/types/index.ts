// User types
export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role: 'USER' | 'ADMIN';
  active: boolean;
  createdAt: string;
}

// Movie types
export type MovieStatus = 'COMING_SOON' | 'NOW_SHOWING' | 'ENDED';

export interface Movie {
  id: number;
  title: string;
  description?: string;
  duration: number;
  director?: string;
  actors?: string;
  genre?: string;
  language?: string;
  releaseDate?: string;
  endDate?: string;
  posterUrl?: string;
  trailerUrl?: string;
  ageRating?: string;
  rating?: number;
  status: MovieStatus;
}

// Theater types
export interface Theater {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  mapUrl?: string;
  description?: string;
  active: boolean;
  totalRooms: number;
  // City information
  cityId?: number;
  cityName?: string;
  cityCode?: string;
  // Region information (through City)
  regionId?: number;
  regionName?: string;
  regionCode?: string;
}

// City types
export interface City {
  id: number;
  name: string;
  code: string;
  provinceCode?: string;
  active: boolean;
  regionId: number;
  regionName: string;
  regionCode: string;
  theaterCount: number;
}

// Pagination
export interface Pagination {
  pageNumber: number; // 0-indexed
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// Room types
export type RoomType = 'STANDARD_2D' | 'STANDARD_3D' | 'IMAX' | 'IMAX_3D' | 'VIP_4DX';

export interface Room {
  id: number;
  name: string;
  totalSeats: number;
  rowsCount?: number;
  columnsCount?: number;
  roomType: RoomType;
  active: boolean;
  theaterId: number;
  theaterName: string;
}

// Seat types
export type SeatType = 'STANDARD' | 'VIP' | 'COUPLE' | 'DISABLED';

export interface Seat {
  id: number;
  rowName: string;
  seatNumber: number;
  seatLabel: string;
  seatType: SeatType;
  priceMultiplier: number;
  active: boolean;
  isBooked: boolean;
}

// Showtime types
export type ShowtimeStatus = 'AVAILABLE' | 'SOLD_OUT' | 'CANCELLED';

export interface Showtime {
  id: number;
  showDate: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  status: ShowtimeStatus;
  movieId: number;
  movieTitle: string;
  moviePosterUrl?: string;
  movieDuration: number;
  roomId: number;
  roomName: string;
  roomType: string;
  theaterId: number;
  theaterName: string;
  availableSeats: number;
}

// Booking types
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED';

export interface Booking {
  id: number;
  bookingCode: string;
  seatAmount: number;
  foodAmount: number;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  numberOfSeats: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  userId: number;
  userFullName: string;
  userEmail: string;
  showtimeId: number;
  showDate: string;
  startTime: string;
  movieId: number;
  movieTitle: string;
  moviePosterUrl?: string;
  theaterName: string;
  roomName: string;
  seatLabels: string[];
  paymentStatus: string;
}

// Payment types
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'MOMO' | 'VNPAY' | 'ZALOPAY' | 'BANK_TRANSFER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export interface Payment {
  id: number;
  transactionId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string;
  bookingId: number;
  bookingCode: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

// Auth types
export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
}

export interface BookingRequest {
  showtimeId: number;
  seatIds: number[];
  notes?: string;
  foodItems?: { foodId: number; quantity: number }[];
  discountCode?: string;
}

export interface PaymentRequest {
  bookingId: number;
  paymentMethod: PaymentMethod;
  pointsToUse?: number;
}

// Review types
export interface Review {
  id: number;
  movieId: number;
  movieTitle: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  rating: number;
  content: string;
  likesCount: number;
  createdAt: string;
  isSpoiler: boolean;
}

// Region types
export interface Region {
  id: number;
  name: string;
  code: string;
  theaterCount: number;
}

// Food types
export type FoodCategory = 'POPCORN' | 'DRINK' | 'SNACK' | 'COMBO' | 'FAST_FOOD' | 'CANDY' | 'ICE_CREAM';
export type FoodSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';

export interface Food {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  category: FoodCategory;
  categoryName: string;
  size: FoodSize;
  sizeName: string;
  isAvailable: boolean;
  isCombo: boolean;
  comboDescription?: string;
  originalPrice?: number;
  discountPercent?: number;
  savedAmount?: number;
  calories?: number;
}

export interface FoodOrderItem {
  foodId: number;
  quantity: number;
  food?: Food;
}

// Cinema types (for CGV-style cinema selector)
export interface GroupedTheaterResponse {
  cities: CityGroup[];
  totalTheaters: number;
}

export interface CityGroup {
  cityName: string;
  cityCode: string;
  theaterCount: number;
  theaters: TheaterSummary[];
}

export interface TheaterSummary {
  id: number;
  name: string;
  address: string;
  phone?: string;
  imageUrl?: string;
  mapUrl?: string;
  totalRooms: number;
}

export interface TheaterScheduleResponse {
  theaterId: number;
  theaterName: string;
  theaterAddress: string;
  theaterPhone?: string;
  theaterImageUrl?: string;
  scheduleDate: string;
  movies: MovieSchedule[];
}

export interface MovieSchedule {
  movieId: number;
  movieTitle: string;
  posterUrl?: string;
  duration: number;
  ageRating?: string;
  genre?: string;
  rating?: number;
  formats: FormatSchedule[];
}

export interface FormatSchedule {
  format: string;
  roomType: string;
  showtimes: ShowtimeSlot[];
}

export interface ShowtimeSlot {
  showtimeId: number;
  startTime: string;
  endTime: string;
  basePrice: number;
  status: string;
  roomName: string;
  availableSeats?: number;
}

// Promotion types
export type PromotionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'UPCOMING';
export type PromotionType = 'GENERAL' | 'TICKET' | 'FOOD' | 'COMBO' | 'MEMBER' | 'PARTNER' | 'SPECIAL_DAY' | 'MOVIE';

export interface Promotion {
  id: number;
  title: string;
  shortDescription?: string;
  content?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  startDate?: string;
  endDate?: string;
  status: PromotionStatus;
  type: PromotionType;
  isFeatured: boolean;
  viewCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  dateRangeDisplay?: string;
}

export interface PromotionTypeOption {
  value: string;
  label: string;
}

// Pricing types (Rate Card System)
export type CustomerType = 'ADULT' | 'STUDENT' | 'MEMBER';
export type DayType = 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY';
export type TimeSlot = 'MORNING' | 'DAY' | 'EVENING' | 'LATE';

export interface PriceHeader {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  priority: number;
  active: boolean;
}

export interface PriceLine {
  id?: number;
  priceHeaderId?: number;
  customerType: CustomerType;
  dayType: DayType;
  timeSlot: TimeSlot;
  roomType: RoomType;
  price: number;
}

export type SurchargeType = 'SEAT_TYPE' | 'MOVIE_TYPE' | 'DATE_TYPE' | 'FORMAT_3D';

export interface Surcharge {
  id: number;
  name: string;
  type: SurchargeType;
  targetId: string; // e.g., 'VIP', 'BLOCKBUSTER'
  amount: number;
  active: boolean;
}

// Price Calculation
export interface CalculatePriceRequest {
  showtimeId: number;
  seatIds: number[];
  userId?: number;
}

export interface CalculatedPriceResponse {
  totalPrice: number;
  details: PriceDetail[];
}

export interface PriceDetail {
  seatCode: string;
  originalPrice: number;
  finalPrice: number;
  description: string;
}
