// User Profile Types
export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  avatar?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  membershipLevel: 'NORMAL' | 'VIP' | 'PLATINUM';
  totalSpending: number;
  currentPoints: number;
  totalPointsEarned: number;
  totalBookings: number;
  totalVouchers: number;
  totalCoupons: number;
  createdAt: string;
  updatedAt: string;
  progressToNextLevel: number;
  amountToNextLevel: number;
  nextLevelName?: string;
}

export interface UserProfileUpdateRequest {
  fullName: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Reward Points Types
export interface RewardPoints {
  currentPoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  pointsExpiringSoon: number;
  membershipLevel: 'NORMAL' | 'VIP' | 'PLATINUM';
  membershipLevelDisplay: string;
  totalSpending: number;
  progressToNextLevel: number;
  amountToNextLevel: number;
  nextLevelName?: string;
  pointsPerTransaction: number;
  pointConversionRate: string;
}

export interface PointHistory {
  id: number;
  points: number;
  transactionType: 'EARNED' | 'REDEEMED' | 'BONUS' | 'EXPIRED' | 'ADJUSTED';
  transactionTypeDisplay: string;
  description: string;
  referenceId?: string;
  referenceType?: string;
  balanceAfter: number;
  createdAt: string;
}

// Voucher Types
export interface Voucher {
  id: number;
  userVoucherId: number;
  voucherCode: string;
  value: number;
  description: string;
  expiryDate: string;
  minPurchaseAmount?: number;
  voucherStatus: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  useStatus: 'AVAILABLE' | 'USED' | 'EXPIRED';
  statusDisplay: string;
  redeemedAt: string;
  usedAt?: string;
  usedForBookingId?: number;
  isExpired: boolean;
  isUsable: boolean;
  daysUntilExpiry?: number;
}

export interface VoucherRedeemRequest {
  voucherCode: string;
  pinCode: string;
}

// Coupon Types
export interface Coupon {
  id: number;
  userCouponId: number;
  couponCode: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscountAmount?: number;
  description: string;
  startDate: string;
  expiryDate: string;
  minPurchaseAmount?: number;
  couponStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  useStatus: 'AVAILABLE' | 'USED' | 'EXPIRED';
  statusDisplay: string;
  discountDisplay: string;
  redeemedAt: string;
  usedAt?: string;
  usedForBookingId?: number;
  isExpired: boolean;
  isUsable: boolean;
  hoursUntilExpiry?: number;
}

export interface CouponRedeemRequest {
  couponCode: string;
  pinCode: string;
}

// Transaction History Types
export interface TransactionHistory {
  bookingId: number;
  bookingCode: string;
  bookingTime: string;
  status: string;
  statusDisplay: string;
  movieTitle: string;
  moviePoster?: string;
  showtimeStart: string;
  theaterName: string;
  roomName: string;
  seatNames: string[];
  seatCount: number;
  foodItems: FoodItem[];
  ticketPrice: number;
  foodPrice: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: string;
  pointsEarned: number;
  pointsUsed: number;
  voucherCode?: string;
  couponCode?: string;
}

export interface FoodItem {
  foodName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// Pagination Types
export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}
