'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getProfile,
  updateProfile,
  changePassword,
  getRewardPoints,
  getPointHistory,
  getUserVouchers,
  redeemVoucher,
  getUserCoupons,
  redeemCoupon,
  getTransactionHistory,
} from '@/services/profileService';
import {
  UserProfile,
  RewardPoints,
  PointHistory,
  Voucher,
  Coupon,
  TransactionHistory,
  PageResponse,
} from '@/types/profile';

// Tab types
type TabId = 'overview' | 'details' | 'rewards' | 'vouchers' | 'transactions';

// Icon Components
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const TicketIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rewards, setRewards] = useState<RewardPoints | null>(null);
  const [pointHistory, setPointHistory] = useState<PageResponse<PointHistory> | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [transactions, setTransactions] = useState<PageResponse<TransactionHistory> | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [editMode, setEditMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '' as 'MALE' | 'FEMALE' | 'OTHER' | '',
    dateOfBirth: '',
    phone: '',
    address: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherPin, setVoucherPin] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponPin, setCouponPin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pointTypeFilter, setPointTypeFilter] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load data based on active tab
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Always load profile
      const profileData = await getProfile();
      setProfile(profileData);
      setFormData({
        fullName: profileData.fullName || '',
        gender: profileData.gender || '',
        dateOfBirth: profileData.dateOfBirth || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
      });

      // Load tab-specific data
      switch (activeTab) {
        case 'rewards':
          const rewardsData = await getRewardPoints();
          setRewards(rewardsData);
          const historyData = await getPointHistory({ size: 10 });
          setPointHistory(historyData);
          break;
        case 'vouchers':
          const [vouchersData, couponsData] = await Promise.all([
            getUserVouchers(),
            getUserCoupons(),
          ]);
          setVouchers(vouchersData);
          setCoupons(couponsData);
          break;
        case 'transactions':
          const transData = await getTransactionHistory({ size: 10 });
          setTransactions(transData);
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const updated = await updateProfile({
        fullName: formData.fullName,
        gender: formData.gender || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      });
      setProfile(updated);
      setEditMode(false);
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Cập nhật thất bại' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await changePassword(passwordData);
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Đổi mật khẩu thất bại' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const newVoucher = await redeemVoucher({ voucherCode, pinCode: voucherPin });
      setVouchers([newVoucher, ...vouchers]);
      setVoucherCode('');
      setVoucherPin('');
      setMessage({ type: 'success', text: 'Đổi voucher thành công!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Mã voucher không hợp lệ' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const newCoupon = await redeemCoupon({ couponCode, pinCode: couponPin });
      setCoupons([newCoupon, ...coupons]);
      setCouponCode('');
      setCouponPin('');
      setMessage({ type: 'success', text: 'Đổi coupon thành công!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Mã coupon không hợp lệ' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMembershipColor = (level: string) => {
    switch (level) {
      case 'PLATINUM':
        return 'from-cyan-400 via-teal-500 to-emerald-600';
      case 'VIP':
        return 'from-amber-500 to-amber-700';
      default:
        return 'from-zinc-500 to-zinc-700';
    }
  };

  const getMembershipBadge = (level: string) => {
    switch (level) {
      case 'PLATINUM':
        return 'bg-gradient-to-r from-cyan-100 to-teal-100 text-teal-900 border border-teal-300';
      case 'VIP':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-zinc-100 text-zinc-800';
    }
  };

  const tabs = [
    { id: 'overview' as TabId, label: 'Thông tin chung', icon: UserIcon },
    { id: 'details' as TabId, label: 'Chi tiết & Bảo mật', icon: ShieldIcon },
    { id: 'rewards' as TabId, label: 'Điểm thưởng', icon: StarIcon },
    { id: 'vouchers' as TabId, label: 'Voucher & Coupon', icon: TicketIcon },
    { id: 'transactions' as TabId, label: 'Lịch sử giao dịch', icon: ClockIcon },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getMembershipColor(profile?.membershipLevel || 'NORMAL')}`}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-zinc-700 shadow-lg">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                profile?.fullName?.charAt(0).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="text-white">
              <h1 className="text-2xl font-bold">{profile?.fullName}</h1>
              <p className="text-white/80">{profile?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMembershipBadge(profile?.membershipLevel || 'NORMAL')}`}>
                  {profile?.membershipLevel === 'PLATINUM' ? '💎 Platinum' : profile?.membershipLevel === 'VIP' ? '⭐ VIP' : '👤 Thường'}
                </span>
                <span className="text-white/80">{profile?.currentPoints?.toLocaleString()} điểm</span>
              </div>
            </div>

            {/* Stats */}
            <div className="ml-auto grid grid-cols-3 gap-6 text-white text-center">
              <div>
                <div className="text-2xl font-bold">{profile?.totalBookings || 0}</div>
                <div className="text-sm text-white/70">Đơn hàng</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{profile?.totalVouchers || 0}</div>
                <div className="text-sm text-white/70">Voucher</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{profile?.totalCoupons || 0}</div>
                <div className="text-sm text-white/70">Coupon</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <tab.icon />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <>
            {/* Tab: Overview */}
            {activeTab === 'overview' && profile && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Membership Card */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-zinc-900 mb-4">Hạng thành viên</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-medium">
                      {profile.membershipLevel === 'PLATINUM' ? 'Platinum' : profile.membershipLevel}
                    </span>
                    {profile.nextLevelName && (
                      <span className="text-sm text-zinc-500">
                        → {profile.nextLevelName}
                      </span>
                    )}
                  </div>
                  {profile.nextLevelName && (
                    <>
                      <div className="w-full bg-zinc-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-zinc-800 h-2 rounded-full transition-all"
                          style={{ width: `${profile.progressToNextLevel}%` }}
                        />
                      </div>
                      <p className="text-sm text-zinc-500">
                        Còn {formatCurrency(profile.amountToNextLevel)} để lên hạng {profile.nextLevelName}
                      </p>
                    </>
                  )}
                </div>

                {/* Points Summary */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-zinc-900 mb-4">Điểm thưởng</h3>
                  <div className="text-3xl font-bold text-zinc-900 mb-2">
                    {profile.currentPoints?.toLocaleString()} điểm
                  </div>
                  <p className="text-sm text-zinc-500">
                    Tổng điểm đã tích lũy: {profile.totalPointsEarned?.toLocaleString()} điểm
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-zinc-900 mb-4">Tổng chi tiêu</h3>
                  <div className="text-2xl font-bold text-zinc-900">
                    {formatCurrency(profile.totalSpending || 0)}
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-zinc-900 mb-4">Thông tin tài khoản</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Email</span>
                      <span>{profile.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Ngày tham gia</span>
                      <span>{formatDate(profile.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Details & Security */}
            {activeTab === 'details' && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Profile Form */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-zinc-900">Thông tin cá nhân</h3>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Họ và tên</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 disabled:bg-zinc-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Giới tính</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
           
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 disabled:bg-zinc-50"
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Ngày sinh</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 disabled:bg-zinc-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 disabled:bg-zinc-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Địa chỉ</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 disabled:bg-zinc-50"
                      />
                    </div>

                    
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 bg-zinc-900 text-white py-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                        >
                          {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditMode(false)}
                          className="flex-1 border border-zinc-300 py-2 rounded-lg hover:bg-zinc-50"
                        >
                          Hủy
                        </button>
                      </div>
                    
                  </form>
                </div>

                {/* Password Form */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-zinc-900 mb-6">Bảo mật</h3>

                  {!showPasswordForm ? (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="w-full py-3 border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Đổi mật khẩu
                    </button>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Mật khẩu hiện tại</label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Mật khẩu mới</label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500"
                          required
                          minLength={6}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Xác nhận mật khẩu</label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500"
                          required
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 bg-zinc-900 text-white py-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                        >
                          {submitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPasswordForm(false)}
                          className="flex-1 border border-zinc-300 py-2 rounded-lg hover:bg-zinc-50"
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Rewards */}
            {activeTab === 'rewards' && rewards && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="text-sm text-zinc-500 mb-1">Điểm hiện tại</div>
                    <div className="text-2xl font-bold text-zinc-900">{rewards.currentPoints.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="text-sm text-zinc-500 mb-1">Đã tích lũy</div>
                    <div className="text-2xl font-bold text-green-600">+{rewards.totalPointsEarned.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="text-sm text-zinc-500 mb-1">Đã sử dụng</div>
                    <div className="text-2xl font-bold text-red-600">-{rewards.totalPointsRedeemed.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="text-sm text-zinc-500 mb-1">Quy đổi</div>
                    <div className="text-lg font-medium text-zinc-700">{rewards.pointConversionRate}</div>
                  </div>
                </div>

                {/* Point History */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="p-6 border-b border-zinc-100">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-zinc-900">Lịch sử điểm</h3>
                      <select
                        value={pointTypeFilter}
                        onChange={(e) => setPointTypeFilter(e.target.value)}
                        className="px-3 py-1.5 border border-zinc-300 rounded-lg text-sm"
                      >
                        <option value="">Tất cả</option>
                        <option value="EARNED">Tích điểm</option>
                        <option value="REDEEMED">Đổi điểm</option>
                        <option value="BONUS">Thưởng</option>
                      </select>
                    </div>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {pointHistory?.content.map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-zinc-900">{item.description}</div>
                          <div className="text-sm text-zinc-500">{formatDateTime(item.createdAt)}</div>
                        </div>
                        <div className={`font-semibold ${item.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.points > 0 ? '+' : ''}{item.points.toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {(!pointHistory || pointHistory.content.length === 0) && (
                      <div className="p-8 text-center text-zinc-500">Chưa có lịch sử điểm</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Vouchers & Coupons */}
            {activeTab === 'vouchers' && (
              <div className="space-y-6">
                {/* Redeem Forms */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Voucher Form */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold text-zinc-900 mb-4">Nhập mã Voucher</h3>
                    <form onSubmit={handleRedeemVoucher} className="space-y-4">
                      <input
                        type="text"
                        placeholder="Mã voucher"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Mã PIN"
                        value={voucherPin}
                        onChange={(e) => setVoucherPin(e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500"
                        required
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-zinc-900 text-white py-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                      >
                        {submitting ? 'Đang xử lý...' : 'Đổi Voucher'}
                      </button>
                    </form>
                  </div>

                  {/* Coupon Form */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold text-zinc-900 mb-4">Nhập mã Coupon</h3>
                    <form onSubmit={handleRedeemCoupon} className="space-y-4">
                      <input
                        type="text"
                        placeholder="Mã coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Mã PIN"
                        value={couponPin}
                        onChange={(e) => setCouponPin(e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500"
                        required
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-zinc-900 text-white py-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                      >
                        {submitting ? 'Đang xử lý...' : 'Đổi Coupon'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Voucher List */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="p-6 border-b border-zinc-100">
                    <h3 className="font-semibold text-zinc-900">Voucher của tôi ({vouchers.length})</h3>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {vouchers.map((voucher) => (
                      <div key={voucher.userVoucherId} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-zinc-900">{voucher.description}</div>
                          <div className="text-sm text-zinc-500">
                            Giá trị: {formatCurrency(voucher.value)} • HSD: {formatDate(voucher.expiryDate)}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          voucher.isUsable ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {voucher.statusDisplay}
                        </span>
                      </div>
                    ))}
                    {vouchers.length === 0 && (
                      <div className="p-8 text-center text-zinc-500">Chưa có voucher nào</div>
                    )}
                  </div>
                </div>

                {/* Coupon List */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="p-6 border-b border-zinc-100">
                    <h3 className="font-semibold text-zinc-900">Coupon của tôi ({coupons.length})</h3>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {coupons.map((coupon) => (
                      <div key={coupon.userCouponId} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-zinc-900">{coupon.description}</div>
                          <div className="text-sm text-zinc-500">
                            {coupon.discountDisplay} • HSD: {formatDateTime(coupon.expiryDate)}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          coupon.isUsable ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {coupon.statusDisplay}
                        </span>
                      </div>
                    ))}
                    {coupons.length === 0 && (
                      <div className="p-8 text-center text-zinc-500">Chưa có coupon nào</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Transactions */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên phim, mã đơn, rạp..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500"
                  />
                </div>

                {/* Transaction List */}
                <div className="space-y-4">
                  {transactions?.content.map((tx) => (
                    <div key={tx.bookingId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="p-4 flex gap-4">
                        {/* Poster */}
                        <div className="w-20 h-28 bg-zinc-200 rounded-lg overflow-hidden flex-shrink-0">
                          {tx.moviePoster ? (
                            <img src={tx.moviePoster} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-zinc-900 truncate">{tx.movieTitle}</h4>
                              <p className="text-sm text-zinc-500">Mã: {tx.bookingCode}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              tx.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                              tx.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-zinc-100 text-zinc-600'
                            }`}>
                              {tx.statusDisplay}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div>
                              <span className="text-zinc-500">Rạp:</span> {tx.theaterName}
                            </div>
                            <div>
                              <span className="text-zinc-500">Phòng:</span> {tx.roomName}
                            </div>
                            <div>
                              <span className="text-zinc-500">Suất:</span> {formatDateTime(tx.showtimeStart)}
                            </div>
                            <div>
                              <span className="text-zinc-500">Ghế:</span> {tx.seatNames.join(', ')}
                            </div>
                          </div>

                          {/* Thông tin đồ ăn */}
                          {tx.foodItems && tx.foodItems.length > 0 && (
                            <div className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                              <div className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Đồ ăn & Thức uống
                              </div>
                              <div className="space-y-1">
                                {tx.foodItems.map((food, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-zinc-700">
                                      {food.foodName} x{food.quantity}
                                    </span>
                                    <span className="text-zinc-600 font-medium">
                                      {formatCurrency(food.subtotal)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 pt-2 border-t border-amber-200 flex justify-between text-sm font-medium">
                                <span className="text-amber-800">Tổng đồ ăn:</span>
                                <span className="text-amber-900">{formatCurrency(tx.foodPrice)}</span>
                              </div>
                            </div>
                          )}

                          {/* Chi tiết giá */}
                          <div className="pt-3 border-t border-zinc-100 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-500">Vé ({tx.seatCount} ghế):</span>
                              <span className="text-zinc-700">{formatCurrency(tx.ticketPrice)}</span>
                            </div>
                            {tx.foodPrice > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Đồ ăn:</span>
                                <span className="text-zinc-700">{formatCurrency(tx.foodPrice)}</span>
                              </div>
                            )}
                            {tx.discountAmount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Giảm giá:</span>
                                <span className="text-green-600">-{formatCurrency(tx.discountAmount)}</span>
                              </div>
                            )}
                            {(tx.voucherCode || tx.couponCode) && (
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Mã giảm giá:</span>
                                <span className="text-blue-600">{tx.voucherCode || tx.couponCode}</span>
                              </div>
                            )}
                            {tx.pointsUsed > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Điểm sử dụng:</span>
                                <span className="text-orange-600">-{tx.pointsUsed} điểm</span>
                              </div>
                            )}
                            {tx.pointsEarned > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Điểm tích lũy:</span>
                                <span className="text-green-600">+{tx.pointsEarned} điểm</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                              <div className="text-sm text-zinc-500">
                                {formatDateTime(tx.bookingTime)}
                              </div>
                              <div className="font-bold text-lg text-zinc-900">
                                {formatCurrency(tx.totalAmount)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!transactions || transactions.content.length === 0) && (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center text-zinc-500">
                      Chưa có giao dịch nào
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
