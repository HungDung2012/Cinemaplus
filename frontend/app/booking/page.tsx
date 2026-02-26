'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Showtime, Seat, Booking, PaymentMethod, Food, FoodOrderItem, CalculatePriceRequest, CalculatedPriceResponse, isOnlinePaymentMethod } from '@/types';
import { RewardPoints, Voucher, Coupon } from '@/types/profile';
import { showtimeService } from '@/services/showtimeService';
import { seatService } from '@/services/theaterService';
import { bookingService, paymentService } from '@/services/bookingService';
import { foodService } from '@/services/foodService';
import {
  getRewardPoints,
  getAvailableVouchers,
  getAvailableCoupons,
  redeemVoucher,
  redeemCoupon
} from '@/services/profileService';
import { SeatMap, PaymentMethodSelector } from '@/components';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';

// Thời gian giữ chỗ (5 phút = 300 giây)
const HOLD_TIME_SECONDS = 5 * 60;

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  'COMBO': 'Combo',
  'POPCORN': 'Bắp rang',
  'DRINK': 'Đồ uống',
  'SNACK': 'Snack',
  'FAST_FOOD': 'Đồ ăn nhanh',
  'CANDY': 'Kẹo bánh',
  'ICE_CREAM': 'Kem',
};

// Step labels
const STEPS = [
  { num: 1, label: 'Chọn ghế' },
  { num: 2, label: 'Đồ ăn' },
  { num: 3, label: 'Thanh toán' },
  { num: 4, label: 'Hoàn tất' },
];

// Payment methods config đã được chuyển vào component PaymentMethodSelector

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const mainContentRef = useRef<HTMLDivElement>(null);

  const showtimeId = Number(searchParams.get('showtimeId'));

  // Steps: 1 = Chọn ghế, 2 = Chọn đồ ăn, 3 = Thanh toán (Giảm giá + HTTT), 4 = Hoàn tất
  const [step, setStep] = useState(1);
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOMO');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Food selection state
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('COMBO');
  const [loadingFoods, setLoadingFoods] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<number>(HOLD_TIME_SECONDS);
  const [timerStarted, setTimerStarted] = useState(false);

  // Reward points state
  const [userPoints, setUserPoints] = useState<RewardPoints | null>(null);
  const [pointsToUse, setPointsToUse] = useState<number>(0);
  const [usePoints, setUsePoints] = useState<boolean>(false);
  const [showPointsDropdown, setShowPointsDropdown] = useState(false);

  // Voucher state
  const [userVouchers, setUserVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showVoucherDropdown, setShowVoucherDropdown] = useState(false);
  const [voucherInputMode, setVoucherInputMode] = useState<'select' | 'input'>('select');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherPin, setVoucherPin] = useState('');
  const [loadingVoucher, setLoadingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // Coupon state
  const [userCoupons, setUserCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showCouponDropdown, setShowCouponDropdown] = useState(false);
  const [couponInputMode, setCouponInputMode] = useState<'select' | 'input'>('select');
  const [couponCode, setCouponCode] = useState('');
  const [couponPin, setCouponPin] = useState('');
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Terms agreement
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Dynamic Pricing State
  const [calculatedPrice, setCalculatedPrice] = useState<CalculatedPriceResponse | null>(null);

  // Calculate Price Effect
  useEffect(() => {
    const calculate = async () => {
      if (selectedSeats.length === 0 || !showtimeId) {
        setCalculatedPrice(null);
        return;
      }
      try {
        const response = await bookingService.calculatePrice({
          showtimeId,
          seatIds: selectedSeats.map(s => s.id),
        });
        setCalculatedPrice(response);
      } catch (err) {
        console.error("Price calculation failed", err);
        // Fallback or error handling
      }
    };
    calculate();
  }, [selectedSeats, showtimeId]);

  // ===== UX FIX: Scroll to top when step changes =====
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Countdown timer effect
  useEffect(() => {
    if (!timerStarted || step === 4 || step === 1) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Reset all states when time expires
          setSelectedSeats([]);
          setFoodOrders([]);
          setTimerStarted(false);
          setStep(1);
          alert('Hết thời gian giữ chỗ! Vui lòng chọn ghế lại.');
          return HOLD_TIME_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStarted, step]);

  // Handler for going back to step 1 - reset timer
  const handleBackToStep1 = () => {
    setTimerStarted(false);
    setTimeLeft(HOLD_TIME_SECONDS);
    setStep(1);
  };

  // Format time for display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get timer urgency level
  const getTimerUrgency = useCallback(() => {
    if (timeLeft <= 60) return 'critical';
    if (timeLeft <= 180) return 'warning';
    return 'normal';
  }, [timeLeft]);

  useEffect(() => {
    if (showtimeId) {
      fetchShowtimeAndSeats();
      fetchFoods();
    }
    // Fetch user data if authenticated
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [showtimeId, isAuthenticated]);

  const fetchUserData = async () => {
    try {
      const [points, vouchers, coupons] = await Promise.all([
        getRewardPoints(),
        getAvailableVouchers(),
        getAvailableCoupons()
      ]);
      setUserPoints(points);
      setUserVouchers(vouchers);
      setUserCoupons(coupons);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const fetchShowtimeAndSeats = async () => {
    try {
      setLoading(true);
      const showtimeData = await showtimeService.getShowtimeById(showtimeId);
      setShowtime(showtimeData);

      const seatsData = await seatService.getSeatsByShowtime(showtimeId, showtimeData.roomId);
      setSeats(seatsData);
    } catch (err) {
      setError('Không thể tải thông tin suất chiếu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoods = async () => {
    try {
      setLoadingFoods(true);
      const foodsData = await foodService.getAllFoods();
      setFoods(foodsData);
    } catch (err) {
      console.error('Error fetching foods:', err);
    } finally {
      setLoadingFoods(false);
    }
  };

  const handleSeatSelection = (seats: Seat[]) => {
    setSelectedSeats(seats);
  };

  // Step 1 → Step 2: Chỉ chuyển bước, chưa tạo booking
  const handleContinueToFood = () => {
    if (selectedSeats.length === 0) {
      alert('Vui lòng chọn ít nhất 1 ghế');
      return;
    }
    // Bắt đầu đếm ngược thời gian giữ chỗ khi chọn ghế xong
    if (!timerStarted) {
      setTimerStarted(true);
      setTimeLeft(HOLD_TIME_SECONDS);
    }
    setStep(2);
  };

  // Step 2 → Step 3: Tạo booking với cả seats + foods
  const handleCreateBooking = async () => {
    try {
      setProcessing(true);
      const bookingData = await bookingService.createBooking({
        showtimeId,
        seatIds: selectedSeats.map((s) => s.id),
        foodItems: foodOrders.filter(f => f.quantity > 0).map(f => ({
          foodId: f.foodId,
          quantity: f.quantity,
        })),
      });
      setBooking(bookingData);

      setStep(3);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể tạo đơn đặt vé';
      alert(errorMessage);
      // Quay lại step 1 nếu có lỗi
      setStep(1);
    } finally {
      setProcessing(false);
    }
  };

  const handleContinueToPayment = () => {
    handleCreateBooking();
  };

  // Handle voucher redeem
  const handleRedeemVoucher = async () => {
    if (!voucherCode || !voucherPin) return;

    try {
      setLoadingVoucher(true);
      setVoucherError(null);
      const voucher = await redeemVoucher({ voucherCode, pinCode: voucherPin });
      setUserVouchers(prev => [...prev, voucher]);
      setSelectedVoucher(voucher);
      setVoucherCode('');
      setVoucherPin('');
      setVoucherInputMode('select');
    } catch (err: any) {
      setVoucherError(err.response?.data?.message || 'Mã voucher không hợp lệ');
    } finally {
      setLoadingVoucher(false);
    }
  };

  // Handle coupon redeem
  const handleRedeemCoupon = async () => {
    if (!couponCode || !couponPin) return;

    try {
      setLoadingCoupon(true);
      setCouponError(null);
      const coupon = await redeemCoupon({ couponCode, pinCode: couponPin });
      setUserCoupons(prev => [...prev, coupon]);
      setSelectedCoupon(coupon);
      setCouponCode('');
      setCouponPin('');
      setCouponInputMode('select');
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Mã coupon không hợp lệ');
    } finally {
      setLoadingCoupon(false);
    }
  };

  // Reset all discounts
  const handleResetDiscounts = () => {
    setSelectedVoucher(null);
    setSelectedCoupon(null);
    setUsePoints(false);
    setPointsToUse(0);
  };

  const handlePayment = async () => {
    if (!booking) return;
    if (!agreeTerms) {
      alert('Vui lòng đồng ý với điều khoản sử dụng');
      return;
    }

    try {
      setProcessing(true);

      // Online gateway (VNPay, MoMo, ZaloPay) → tạo URL + redirect
      if (isOnlinePaymentMethod(paymentMethod)) {
        const result = await paymentService.createPaymentUrl({
          bookingId: booking.id,
          paymentMethod,
          pointsToUse: usePoints ? pointsToUse : 0,
        });

        if (result.paymentUrl) {
          // Redirect user đến cổng thanh toán
          window.location.href = result.paymentUrl;
          return; // Không setProcessing(false) vì đang redirect
        } else {
          throw new Error('Không thể tạo liên kết thanh toán');
        }
      }

      // Offline methods (CASH, CREDIT_CARD, etc.) → xử lý trực tiếp
      const payment = await paymentService.createPayment({
        bookingId: booking.id,
        paymentMethod,
        pointsToUse: usePoints ? pointsToUse : 0,
      });

      await paymentService.processPayment(payment.id);

      // Cập nhật điểm thưởng sau khi thanh toán thành công
      const earnedPoints = Math.floor((totalAmount - totalDiscount) / 10000);
      setUserPoints(prev => {
        if (!prev) return prev;
        const newPoints = prev.currentPoints - (usePoints ? pointsToUse : 0) + earnedPoints;
        return { ...prev, currentPoints: newPoints };
      });

      setStep(4);
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Thanh toán thất bại';
      setError(errorMsg);
      alert('Lỗi thanh toán: ' + errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  // Food order handlers
  const handleAddFood = (food: Food) => {
    setFoodOrders((prev) => {
      const existing = prev.find((f) => f.foodId === food.id);
      if (existing) {
        return prev.map((f) =>
          f.foodId === food.id ? { ...f, quantity: f.quantity + 1 } : f
        );
      }
      return [...prev, { foodId: food.id, quantity: 1, food }];
    });
  };

  const handleRemoveFood = (foodId: number) => {
    setFoodOrders((prev) => {
      const existing = prev.find((f) => f.foodId === foodId);
      if (existing && existing.quantity > 1) {
        return prev.map((f) =>
          f.foodId === foodId ? { ...f, quantity: f.quantity - 1 } : f
        );
      }
      return prev.filter((f) => f.foodId !== foodId);
    });
  };

  const getFoodQuantity = (foodId: number) => {
    return foodOrders.find((f) => f.foodId === foodId)?.quantity || 0;
  };

  // Calculate totals
  // Use calculated price from backend if available, otherwise 0 (or fallback)
  const seatTotal = calculatedPrice?.totalPrice || 0;

  const foodTotal = foodOrders.reduce((sum, item) => {
    const food = foods.find((f) => f.id === item.foodId);
    return sum + (food?.price || 0) * item.quantity;
  }, 0);

  const totalAmount = seatTotal + foodTotal;

  // Points calculation (1 point = 1,000 VND)
  const POINT_TO_VND = 1000;
  const maxPointsCanUse = userPoints ? Math.min(
    userPoints.currentPoints,
    Math.floor(totalAmount / POINT_TO_VND)
  ) : 0;
  const pointsDiscount = usePoints ? pointsToUse * POINT_TO_VND : 0;

  // Voucher discount
  const voucherDiscount = selectedVoucher ? selectedVoucher.value : 0;

  // Coupon discount
  const couponDiscount = selectedCoupon ? (
    selectedCoupon.discountType === 'PERCENTAGE'
      ? Math.min(
        (totalAmount * selectedCoupon.discountValue) / 100,
        selectedCoupon.maxDiscountAmount || Infinity
      )
      : selectedCoupon.discountValue
  ) : 0;

  // Total discount
  const totalDiscount = pointsDiscount + voucherDiscount + couponDiscount;
  const finalPaymentAmount = Math.max(0, totalAmount - totalDiscount);

  // Points to earn from this transaction (10,000 VND = 1 point)
  const pointsToEarn = Math.floor(finalPaymentAmount / 10000);

  // Handle points toggle
  const handleUsePointsChange = (checked: boolean) => {
    setUsePoints(checked);
    if (checked && maxPointsCanUse > 0) {
      setPointsToUse(maxPointsCanUse);
    } else {
      setPointsToUse(0);
    }
  };

  // Handle points input change
  const handlePointsInputChange = (value: number) => {
    const validValue = Math.min(Math.max(0, value), maxPointsCanUse);
    setPointsToUse(validValue);
  };

  // Filter foods by category
  const filteredFoods = foods.filter((f) => f.category === selectedCategory);

  // Get available categories
  const availableCategories = Array.from(new Set(foods.map((f) => f.category)));

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-zinc-200 border-t-zinc-800 rounded-full mx-auto"></div>
          <p className="mt-4 text-zinc-500 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error && !showtime) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-600 mb-4">{error}</p>
          <Link href="/movies" className="text-zinc-800 underline hover:text-zinc-600">
            Quay lại danh sách phim
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ===== FIXED TIMER BAR - Below main header ===== */}
      {timerStarted && step > 1 && step < 4 && (
        <div className={`
          fixed top-16 left-0 right-0 z-40 px-4 py-2 flex items-center justify-center gap-3 text-white transition-colors shadow-lg
          ${getTimerUrgency() === 'critical'
            ? 'bg-red-600 animate-pulse'
            : getTimerUrgency() === 'warning'
              ? 'bg-amber-500'
              : 'bg-zinc-800'}
        `}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-mono text-xl font-bold tracking-wider">
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm opacity-90">
            {getTimerUrgency() === 'critical'
              ? 'Sắp hết giờ!'
              : 'thời gian giữ chỗ'}
          </span>
        </div>
      )}

      {/* ===== STICKY HEADER ===== */}
      <header className={`sticky z-10 bg-white border-b border-zinc-200 shadow-sm ${timerStarted && step > 1 && step < 4 ? 'top-[104px]' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Navigation Header */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-zinc-900">Đặt vé</h1>

              {/* Minimal Stepper */}
              <div className="flex items-center gap-1">
                {STEPS.map((s, idx) => (
                  <div key={s.num} className="flex items-center">
                    <div className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all
                      ${step > s.num
                        ? 'bg-zinc-800 text-white'
                        : step === s.num
                          ? 'bg-zinc-800 text-white ring-2 ring-zinc-300 ring-offset-2'
                          : 'bg-zinc-200 text-zinc-500'}
                    `}>
                      {step > s.num ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        s.num
                      )}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`w-6 h-0.5 mx-1 ${step > s.num ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main ref={mainContentRef} className="max-w-7xl mx-auto px-4 py-6 pt-16">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
          {/* Main Content Area */}
          <div className="lg:col-span-2 ">

            {/* ===== STEP 1: SEAT SELECTION ===== */}
            {step === 1 && showtime && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="p-5 border-b border-zinc-100">
                  <h2 className="text-lg font-semibold text-zinc-900">Chọn ghế ngồi</h2>
                  <p className="text-sm text-zinc-500 mt-1">Chạm vào ghế để chọn</p>
                </div>

                <div className="p-5">
                  <SeatMap
                    seats={seats}
                    basePrice={showtime.basePrice}
                    onSelectionChange={handleSeatSelection}
                  />
                </div>

                <div className="p-5 border-t border-zinc-100 bg-zinc-50">
                  <Button
                    onClick={handleContinueToFood}
                    disabled={selectedSeats.length === 0}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white"
                    size="lg"
                  >
                    Tiếp tục
                  </Button>
                </div>
              </div>
            )}

            {/* ===== STEP 2: FOOD SELECTION ===== */}
            {step === 2 && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden ">
                {/* Header */}
                <div className="p-5 border-b border-zinc-100">
                  <h2 className="text-lg font-semibold text-zinc-900">Thêm đồ ăn & thức uống</h2>
                  <p className="text-sm text-zinc-500 mt-1">Tùy chọn - Có thể bỏ qua</p>
                </div>

                {/* Category Tabs */}
                <div className="border-b border-zinc-100 overflow-x-auto">
                  <div className="flex px-2">
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`
                          px-4 py-3 text-sm font-medium transition-all whitespace-nowrap relative
                          ${selectedCategory === cat
                            ? 'text-zinc-900'
                            : 'text-zinc-500 hover:text-zinc-700'}
                        `}
                      >
                        {CATEGORY_LABELS[cat] || cat}
                        {selectedCategory === cat && (
                          <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-zinc-900 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Food Grid */}
                <div className="p-5">
                  {loadingFoods ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex gap-4 p-4 border border-zinc-100 rounded-lg">
                            <div className="w-20 h-20 bg-zinc-100 rounded-lg"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
                              <div className="h-3 bg-zinc-100 rounded w-1/2"></div>
                              <div className="h-5 bg-zinc-100 rounded w-1/3"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredFoods.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                      <svg className="w-12 h-12 mx-auto mb-3 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
                      </svg>
                      <p className="text-sm">Không có sản phẩm</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredFoods.map((food) => {
                        const quantity = getFoodQuantity(food.id);
                        const isSelected = quantity > 0;

                        return (
                          <div
                            key={food.id}
                            className={`
                              group p-4 rounded-xl border transition-all
                              ${isSelected
                                ? 'border-zinc-900 bg-zinc-50'
                                : 'border-zinc-200 hover:border-zinc-300'}
                            `}
                          >
                            <div className="flex gap-4">
                              {/* Image */}
                              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-100">
                                {food.imageUrl ? (
                                  <img
                                    src={food.imageUrl}
                                    alt={food.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-zinc-900 text-sm line-clamp-2">{food.name}</h3>
                                {food.description && (
                                  <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{food.description}</p>
                                )}

                                {/* Price */}
                                <div className="mt-2 flex items-baseline gap-2">
                                  <span className="font-semibold text-zinc-900">{formatCurrency(food.price)}</span>
                                  {food.isCombo && food.originalPrice && (
                                    <span className="text-xs text-zinc-400 line-through">
                                      {formatCurrency(food.originalPrice)}
                                    </span>
                                  )}
                                </div>

                                {/* Quantity Controls */}
                                <div className="mt-3">
                                  {isSelected ? (
                                    <div className="inline-flex items-center border border-zinc-300 rounded-lg">
                                      <button
                                        onClick={() => handleRemoveFood(food.id)}
                                        className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 rounded-l-lg transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                      </button>
                                      <span className="w-10 text-center text-sm font-medium text-zinc-900">{quantity}</span>
                                      <button
                                        onClick={() => handleAddFood(food)}
                                        className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 rounded-r-lg transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleAddFood(food)}
                                      className="px-4 py-1.5 text-sm font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50 hover:border-zinc-400 transition-all"
                                    >
                                      Thêm
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Summary */}
                {foodOrders.length > 0 && (
                  <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600">
                        Đã chọn {foodOrders.reduce((sum, f) => sum + f.quantity, 0)} món
                      </span>
                      <span className="font-semibold text-zinc-900">{formatCurrency(foodTotal)}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="p-5 border-t border-zinc-100 flex gap-3">
                  <button
                    onClick={handleBackToStep1}
                    disabled={processing}
                    className="flex-1 py-3 text-sm font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleContinueToPayment}
                    disabled={processing}
                    className="flex-1 py-3 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      foodOrders.length > 0 ? 'Tiếp tục thanh toán' : 'Bỏ qua, thanh toán ngay'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP 3: PAYMENT (Giảm giá + Hình thức thanh toán) ===== */}
            {step === 3 && booking && (
              <div className="space-y-4">
                {/* ===== BƯỚC 1: GIẢM GIÁ ===== */}
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                  <div className="bg-zinc-800 text-white px-4 py-3 flex items-center justify-between">
                    <span className="font-semibold">Bước 1: GIẢM GIÁ</span>
                    <button
                      onClick={handleResetDiscounts}
                      className="text-sm flex items-center gap-1 hover:underline text-zinc-300 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Đặt lại
                    </button>
                  </div>

                  <div className="divide-y divide-zinc-100">
                    {/* ===== VOUCHER DROPDOWN ===== */}
                    <div>
                      <button
                        onClick={() => {
                          setShowVoucherDropdown(!showVoucherDropdown);
                          setShowCouponDropdown(false);
                          setShowPointsDropdown(false);
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
                      >
                        <span className="text-zinc-800 font-medium">Voucher</span>
                        <div className="flex items-center gap-2">
                          {selectedVoucher && (
                            <span className="text-green-600 text-sm">
                              -{formatCurrency(selectedVoucher.value)}
                            </span>
                          )}
                          <svg className={`w-5 h-5 text-zinc-400 transition-transform ${showVoucherDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {showVoucherDropdown && (
                        <div className="px-4 pb-4 bg-zinc-50">
                          {/* Mode Toggle */}
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={() => setVoucherInputMode('select')}
                              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${voucherInputMode === 'select'
                                ? 'bg-zinc-800 text-white'
                                : 'bg-white border border-zinc-200 text-zinc-700'
                                }`}
                            >
                              Chọn voucher
                            </button>
                            <button
                              onClick={() => setVoucherInputMode('input')}
                              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${voucherInputMode === 'input'
                                ? 'bg-zinc-800 text-white'
                                : 'bg-white border border-zinc-200 text-zinc-700'
                                }`}
                            >
                              Nhập mã
                            </button>
                          </div>

                          {voucherInputMode === 'select' ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {userVouchers.length === 0 ? (
                                <p className="text-sm text-zinc-500 text-center py-3">Bạn chưa có voucher nào</p>
                              ) : (
                                <>
                                  <label className={`flex items-center p-3 bg-white rounded-lg border cursor-pointer transition-all ${!selectedVoucher ? 'border-zinc-800' : 'border-zinc-200'
                                    }`}>
                                    <input
                                      type="radio"
                                      name="voucher"
                                      checked={!selectedVoucher}
                                      onChange={() => setSelectedVoucher(null)}
                                      className="w-4 h-4 text-zinc-800"
                                    />
                                    <span className="ml-3 text-sm text-zinc-700">Không sử dụng</span>
                                  </label>
                                  {userVouchers.map((v) => (
                                    <label
                                      key={v.id}
                                      className={`flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer transition-all ${selectedVoucher?.id === v.id ? 'border-zinc-800' : 'border-zinc-200'
                                        }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="radio"
                                          name="voucher"
                                          checked={selectedVoucher?.id === v.id}
                                          onChange={() => setSelectedVoucher(v)}
                                          className="w-4 h-4 text-zinc-800"
                                        />
                                        <div>
                                          <p className="text-sm font-medium text-zinc-900">{v.voucherCode}</p>
                                          <p className="text-xs text-zinc-500">HSD: {formatDate(v.expiryDate)}</p>
                                        </div>
                                      </div>
                                      <span className="text-green-600 font-semibold">-{formatCurrency(v.value)}</span>
                                    </label>
                                  ))}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={voucherCode}
                                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                placeholder="Nhập mã voucher"
                                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                              />
                              <input
                                type="text"
                                value={voucherPin}
                                onChange={(e) => setVoucherPin(e.target.value)}
                                placeholder="Nhập mã PIN"
                                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                              />
                              {voucherError && (
                                <p className="text-red-600 text-sm">{voucherError}</p>
                              )}
                              <button
                                onClick={handleRedeemVoucher}
                                disabled={loadingVoucher || !voucherCode || !voucherPin}
                                className="w-full py-2 text-sm font-medium text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                              >
                                {loadingVoucher ? 'Đang kiểm tra...' : 'Áp dụng'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ===== COUPON DROPDOWN ===== */}
                    <div>
                      <button
                        onClick={() => {
                          setShowCouponDropdown(!showCouponDropdown);
                          setShowVoucherDropdown(false);
                          setShowPointsDropdown(false);
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
                      >
                        <span className="text-zinc-800 font-medium">Mã giảm giá (Coupon)</span>
                        <div className="flex items-center gap-2">
                          {selectedCoupon && (
                            <span className="text-green-600 text-sm">
                              {selectedCoupon.discountType === 'PERCENTAGE'
                                ? `-${selectedCoupon.discountValue}%`
                                : `-${formatCurrency(selectedCoupon.discountValue)}`}
                            </span>
                          )}
                          <svg className={`w-5 h-5 text-zinc-400 transition-transform ${showCouponDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {showCouponDropdown && (
                        <div className="px-4 pb-4 bg-zinc-50">
                          {/* Mode Toggle */}
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={() => setCouponInputMode('select')}
                              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${couponInputMode === 'select'
                                ? 'bg-zinc-800 text-white'
                                : 'bg-white border border-zinc-200 text-zinc-700'
                                }`}
                            >
                              Chọn coupon
                            </button>
                            <button
                              onClick={() => setCouponInputMode('input')}
                              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${couponInputMode === 'input'
                                ? 'bg-zinc-800 text-white'
                                : 'bg-white border border-zinc-200 text-zinc-700'
                                }`}
                            >
                              Nhập mã
                            </button>
                          </div>

                          {couponInputMode === 'select' ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {userCoupons.length === 0 ? (
                                <p className="text-sm text-zinc-500 text-center py-3">Bạn chưa có coupon nào</p>
                              ) : (
                                <>
                                  <label className={`flex items-center p-3 bg-white rounded-lg border cursor-pointer transition-all ${!selectedCoupon ? 'border-zinc-800' : 'border-zinc-200'
                                    }`}>
                                    <input
                                      type="radio"
                                      name="coupon"
                                      checked={!selectedCoupon}
                                      onChange={() => setSelectedCoupon(null)}
                                      className="w-4 h-4 text-zinc-800"
                                    />
                                    <span className="ml-3 text-sm text-zinc-700">Không sử dụng</span>
                                  </label>
                                  {userCoupons.map((c) => (
                                    <label
                                      key={c.id}
                                      className={`flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer transition-all ${selectedCoupon?.id === c.id ? 'border-zinc-800' : 'border-zinc-200'
                                        }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="radio"
                                          name="coupon"
                                          checked={selectedCoupon?.id === c.id}
                                          onChange={() => setSelectedCoupon(c)}
                                          className="w-4 h-4 text-zinc-800"
                                        />
                                        <div>
                                          <p className="text-sm font-medium text-zinc-900">{c.couponCode}</p>
                                          <p className="text-xs text-zinc-500">{c.description}</p>
                                        </div>
                                      </div>
                                      <span className="text-green-600 font-semibold">
                                        {c.discountType === 'PERCENTAGE'
                                          ? `-${c.discountValue}%`
                                          : `-${formatCurrency(c.discountValue)}`}
                                      </span>
                                    </label>
                                  ))}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                placeholder="Nhập mã coupon"
                                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                              />
                              <input
                                type="text"
                                value={couponPin}
                                onChange={(e) => setCouponPin(e.target.value)}
                                placeholder="Nhập mã PIN"
                                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                              />
                              {couponError && (
                                <p className="text-red-600 text-sm">{couponError}</p>
                              )}
                              <button
                                onClick={handleRedeemCoupon}
                                disabled={loadingCoupon || !couponCode || !couponPin}
                                className="w-full py-2 text-sm font-medium text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                              >
                                {loadingCoupon ? 'Đang kiểm tra...' : 'Áp dụng'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ===== ĐIỂM THƯỞNG DROPDOWN ===== */}
                    <div>
                      <button
                        onClick={() => {
                          setShowPointsDropdown(!showPointsDropdown);
                          setShowVoucherDropdown(false);
                          setShowCouponDropdown(false);
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
                      >
                        <span className="text-zinc-800 font-medium">Điểm thưởng</span>
                        <div className="flex items-center gap-2">
                          {usePoints && pointsToUse > 0 && (
                            <span className="text-green-600 text-sm">
                              -{formatCurrency(pointsDiscount)}
                            </span>
                          )}
                          <svg className={`w-5 h-5 text-zinc-400 transition-transform ${showPointsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {showPointsDropdown && (
                        <div className="px-4 pb-4 bg-zinc-50">
                          {userPoints ? (
                            <div className="space-y-3">
                              {/* Hiển thị điểm hiện có */}
                              <div className="p-3 bg-white rounded-lg border border-zinc-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-zinc-600">Điểm hiện có:</span>
                                  <span className="text-lg font-bold text-zinc-900">{userPoints.currentPoints.toLocaleString()} điểm</span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">1 điểm = 1.000đ</p>
                              </div>

                              {/* Ô nhập số điểm muốn dùng */}
                              {userPoints.currentPoints > 0 && (
                                <div className="p-3 bg-white rounded-lg border border-zinc-200">
                                  <label className="block text-sm text-zinc-700 mb-2">Số điểm muốn sử dụng:</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max={maxPointsCanUse}
                                      value={pointsToUse}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        handlePointsInputChange(val);
                                        setUsePoints(val > 0);
                                      }}
                                      placeholder="0"
                                      className="flex-1 px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                                    />
                                    <span className="text-sm text-zinc-500">/ {maxPointsCanUse.toLocaleString()}</span>
                                  </div>
                                  {pointsToUse > 0 && (
                                    <p className="text-sm text-green-600 mt-2">
                                      Giảm: {formatCurrency(pointsDiscount)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-zinc-500 text-center py-3">
                              Bạn chưa có điểm thưởng
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ===== BƯỚC 2: HÌNH THỨC THANH TOÁN ===== */}
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                  <div className="bg-zinc-800 text-white px-4 py-3">
                    <span className="font-semibold">Bước 2: HÌNH THỨC THANH TOÁN</span>
                  </div>

                  <PaymentMethodSelector
                    selectedMethod={paymentMethod}
                    onMethodChange={setPaymentMethod}
                    disabled={processing}
                    loading={processing}
                  />
                </div>

                {/* ===== ĐIỀU KHOẢN & NÚT THANH TOÁN ===== */}
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                  <label className="flex items-start gap-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-zinc-800 border-zinc-300 rounded focus:ring-zinc-500"
                    />
                    <span className="text-sm text-zinc-700">
                      Tôi đồng ý với{' '}
                      <a href="#" className="text-zinc-800 font-medium hover:underline">điều khoản sử dụng</a>
                      {' '}và mua vé cho người có độ tuổi phù hợp
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-3 text-sm font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={processing || !agreeTerms}
                      className="flex-1 py-3 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Đang xử lý...' : `Thanh toán ${formatCurrency(finalPaymentAmount)}`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== STEP 4: SUCCESS ===== */}
            {step === 4 && booking && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-900 mb-2">Đặt vé thành công!</h2>
                  <p className="text-zinc-500">
                    Mã đặt vé: <span className="font-mono font-semibold text-zinc-900">{booking.bookingCode}</span>
                  </p>
                </div>

                <div className="mx-5 p-4 bg-zinc-50 rounded-xl mb-5">
                  <h3 className="font-medium text-zinc-900 mb-3">Thông tin vé</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Phim</span>
                      <span className="text-zinc-900 font-medium">{booking.movieTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Rạp</span>
                      <span className="text-zinc-900">{booking.theaterName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Phòng</span>
                      <span className="text-zinc-900">{booking.roomName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Suất chiếu</span>
                      <span className="text-zinc-900">{formatDate(booking.showDate)} • {booking.startTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Ghế</span>
                      <span className="text-zinc-900 font-medium">{booking.seatLabels.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* Points earned notification */}
                {pointsToEarn > 0 && (
                  <div className="mx-5 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl mb-5 border border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-amber-900">+{pointsToEarn} điểm tích lũy</p>
                        <p className="text-xs text-amber-700">Điểm đã được cộng vào tài khoản của bạn</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-5 border-t border-zinc-100 flex gap-3">
                  <Link href="/profile" className="flex-1">
                    <button className="w-full py-3 text-sm font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">
                      Tài khoản
                    </button>
                  </Link>
                  <Link href="/movies" className="flex-1">
                    <button className="w-full py-3 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
                      Tiếp tục
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ===== SIDEBAR - ORDER SUMMARY ===== */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-zinc-200 sticky top-32 overflow-hidden">
              {showtime && (
                <>
                  {/* Movie Info */}
                  <div className="p-4 border-b border-zinc-100">
                    <div className="flex gap-3">
                      {showtime.moviePosterUrl && (
                        <img
                          src={showtime.moviePosterUrl}
                          alt={showtime.movieTitle}
                          className="w-16 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-900 text-sm line-clamp-2">{showtime.movieTitle}</h3>
                        <p className="text-xs text-zinc-500 mt-1">{showtime.roomType}</p>
                        <div className="mt-2 text-xs text-zinc-600">
                          <p>{showtime.theaterName}</p>
                          <p className="font-medium">{formatDate(showtime.showDate)} • {showtime.startTime.substring(0, 5)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-4 space-y-3 text-sm">
                    {selectedSeats.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Ghế ({selectedSeats.length})</span>
                        <span className="text-zinc-900">{selectedSeats.map((s) => s.seatLabel).join(', ')}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-zinc-500">Vé</span>
                      <span className="text-zinc-900">
                        {formatCurrency(booking?.seatAmount || seatTotal)}
                      </span>
                    </div>

                    {(foodOrders.length > 0 || (booking?.foodAmount && booking.foodAmount > 0)) && (
                      <>
                        <div className="border-t border-zinc-100 pt-3 space-y-2">
                          {foodOrders.map((item) => {
                            const food = foods.find((f) => f.id === item.foodId);
                            return (
                              <div key={item.foodId} className="flex justify-between text-xs">
                                <span className="text-zinc-500">{food?.name} ×{item.quantity}</span>
                                <span className="text-zinc-700">{formatCurrency((food?.price || 0) * item.quantity)}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Đồ ăn</span>
                          <span className="text-zinc-900">
                            {formatCurrency(booking?.foodAmount || foodTotal)}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Discounts */}
                    {step === 3 && totalDiscount > 0 && (
                      <div className="border-t border-zinc-100 pt-3 space-y-2">
                        <p className="text-xs text-zinc-500 uppercase font-medium">Giảm giá</p>
                        {selectedVoucher && (
                          <div className="flex justify-between text-green-600 text-xs">
                            <span>Voucher ({selectedVoucher.voucherCode})</span>
                            <span>-{formatCurrency(voucherDiscount)}</span>
                          </div>
                        )}
                        {selectedCoupon && (
                          <div className="flex justify-between text-green-600 text-xs">
                            <span>Coupon ({selectedCoupon.couponCode})</span>
                            <span>-{formatCurrency(couponDiscount)}</span>
                          </div>
                        )}
                        {usePoints && pointsToUse > 0 && (
                          <div className="flex justify-between text-green-600 text-xs">
                            <span>Điểm ({pointsToUse.toLocaleString()})</span>
                            <span>-{formatCurrency(pointsDiscount)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="p-4 border-t border-zinc-100 bg-zinc-50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-zinc-900">Tổng cộng</span>
                      <span className="text-lg font-bold text-zinc-900">
                        {formatCurrency(booking?.totalAmount || totalAmount)}
                      </span>
                    </div>

                    {/* Final payment amount with discounts */}
                    {step === 3 && totalDiscount > 0 && (
                      <>
                        <div className="flex justify-between items-center mt-2 text-sm text-green-600">
                          <span>Giảm giá</span>
                          <span>-{formatCurrency(totalDiscount)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-200">
                          <span className="font-semibold text-zinc-900">Thanh toán</span>
                          <span className="text-xl font-bold text-zinc-900">
                            {formatCurrency(finalPaymentAmount)}
                          </span>
                        </div>
                      </>
                    )}

                    {booking?.discountAmount != null && booking.discountAmount > 0 && (
                      <>
                        <div className="flex justify-between items-center mt-2 text-sm text-green-600">
                          <span>Giảm giá</span>
                          <span>-{formatCurrency(booking.discountAmount)}</span>
                        </div>
                      </>
                    )}

                    {/* Points to earn info */}
                    {step >= 2 && pointsToEarn > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center gap-2 text-xs text-zinc-600">
                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Tích lũy <span className="font-bold">+{pointsToEarn}</span> điểm</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getPaymentMethodName(method: PaymentMethod): string {
  const names: Record<PaymentMethod, string> = {
    MOMO: 'Ví MoMo',
    VNPAY: 'VNPay',
    ZALOPAY: 'ZaloPay',
    CREDIT_CARD: 'Thẻ tín dụng',
    DEBIT_CARD: 'Thẻ ghi nợ',
    CASH: 'Tiền mặt',
    BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  };
  return names[method];
}

function BookingLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-2 border-zinc-200 border-t-zinc-800 rounded-full mx-auto"></div>
        <p className="mt-4 text-zinc-500 text-sm">Đang tải...</p>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingLoading />}>
      <BookingContent />
    </Suspense>
  );
}
