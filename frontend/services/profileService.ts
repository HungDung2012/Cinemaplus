import { api } from '@/lib/axios';
import {
  UserProfile,
  UserProfileUpdateRequest,
  ChangePasswordRequest,
  RewardPoints,
  PointHistory,
  Voucher,
  VoucherRedeemRequest,
  Coupon,
  CouponRedeemRequest,
  TransactionHistory,
  PageResponse,
} from '@/types/profile';

// ==================== PROFILE ====================

export const getProfile = async (): Promise<UserProfile> => {
  const response = await api.get('/user/profile');
  return response.data;
};


export const updateProfile = async (data: UserProfileUpdateRequest): Promise<UserProfile> => {
  const response = await api.put('/user/profile', data);
  return response.data;
};

export const changePassword = async (data: ChangePasswordRequest): Promise<{ message: string }> => {
  const response = await api.post('/user/change-password', data);
  return response.data;
};

// ==================== REWARD POINTS ====================

export const getRewardPoints = async (): Promise<RewardPoints> => {
  const response = await api.get('/user/rewards');
  return response.data;
};

export const getPointHistory = async (params?: {
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<PointHistory>> => {
  const response = await api.get('/user/point-history', { params });
  return response.data;
};

// ==================== VOUCHERS ====================

export const redeemVoucher = async (data: VoucherRedeemRequest): Promise<Voucher> => {
  const response = await api.post('/user/redeem-voucher', data);
  return response.data;
};

export const getUserVouchers = async (): Promise<Voucher[]> => {
  const response = await api.get('/user/vouchers');
  return response.data;
};

export const getAvailableVouchers = async (): Promise<Voucher[]> => {
  const response = await api.get('/user/vouchers/available');
  return response.data;
};

export const getExpiringVouchers = async (): Promise<Voucher[]> => {
  const response = await api.get('/user/vouchers/expiring');
  return response.data;
};

// ==================== COUPONS ====================

export const redeemCoupon = async (data: CouponRedeemRequest): Promise<Coupon> => {
  const response = await api.post('/user/redeem-coupon', data);
  return response.data;
};

export const getUserCoupons = async (): Promise<Coupon[]> => {
  const response = await api.get('/user/coupons');
  return response.data;
};

export const getAvailableCoupons = async (): Promise<Coupon[]> => {
  const response = await api.get('/user/coupons/available');
  return response.data;
};

export const getExpiringCoupons = async (): Promise<Coupon[]> => {
  const response = await api.get('/user/coupons/expiring');
  return response.data;
};

// ==================== TRANSACTIONS ====================

export const getTransactionHistory = async (params?: {
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<TransactionHistory>> => {
  const response = await api.get('/user/transactions', { params });
  return response.data;
};
