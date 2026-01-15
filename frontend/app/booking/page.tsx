'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Showtime, Seat, Booking, PaymentMethod, Food, FoodOrderItem } from '@/types';
import { showtimeService } from '@/services/showtimeService';
import { seatService } from '@/services/theaterService';
import { bookingService, paymentService } from '@/services/bookingService';
import { foodService } from '@/services/foodService';
import { SeatMap } from '@/components';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';

// Thời gian giữ chỗ (15 phút = 900 giây)
const HOLD_TIME_SECONDS = 15 * 60;

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

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const mainContentRef = useRef<HTMLDivElement>(null);

  const showtimeId = Number(searchParams.get('showtimeId'));

  // Steps: 1 = Chọn ghế, 2 = Chọn đồ ăn, 3 = Thanh toán, 4 = Hoàn tất
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

  // ===== UX FIX: Scroll to top when step changes =====
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Countdown timer effect
  useEffect(() => {
    if (!timerStarted || step === 4) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          alert('Hết thời gian giữ chỗ! Vui lòng đặt vé lại.');
          router.push(`/dat-ve?movieId=${showtime?.movieId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStarted, step, router, showtime?.movieId]);

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
  }, [showtimeId, isAuthenticated]);

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
      
      // Bắt đầu đếm ngược thời gian giữ chỗ
      setTimerStarted(true);
      setTimeLeft(HOLD_TIME_SECONDS);
      
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

  const handlePayment = async () => {
    if (!booking) return;

    try {
      setProcessing(true);
      const payment = await paymentService.createPayment({
        bookingId: booking.id,
        paymentMethod,
      });

      await paymentService.processPayment(payment.id);
      
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Thanh toán thất bại');
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
  const seatTotal = selectedSeats.reduce((sum, seat) => {
    return sum + (showtime?.basePrice || 0) * seat.priceMultiplier;
  }, 0);

  const foodTotal = foodOrders.reduce((sum, item) => {
    const food = foods.find((f) => f.id === item.foodId);
    return sum + (food?.price || 0) * item.quantity;
  }, 0);

  const totalAmount = seatTotal + foodTotal;

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
      {/* ===== STICKY HEADER WITH PROMINENT TIMER ===== */}
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-7xl mx-auto">
          {/* Timer Bar - Always visible when active */}
          {timerStarted && step < 4 && (
            <div className={`
              px-4 py-2 flex items-center justify-center gap-3 text-white transition-colors
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
      <main ref={mainContentRef} className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            
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

            {/* ===== STEP 2: FOOD SELECTION - MINIMALIST DESIGN ===== */}
            {step === 2 && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-zinc-100">
                  <h2 className="text-lg font-semibold text-zinc-900">Thêm đồ ăn & thức uống</h2>
                  <p className="text-sm text-zinc-500 mt-1">Tùy chọn - Có thể bỏ qua</p>
                </div>

                {/* Category Tabs - Clean design */}
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

                {/* Food Grid - Clean cards */}
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

                                {/* Quantity Controls - Minimal */}
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
                    onClick={() => setStep(1)}
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

            {/* ===== STEP 3: PAYMENT ===== */}
            {step === 3 && booking && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="p-5 border-b border-zinc-100">
                  <h2 className="text-lg font-semibold text-zinc-900">Thanh toán</h2>
                  <p className="text-sm text-zinc-500 mt-1">Chọn phương thức thanh toán</p>
                </div>
                
                <div className="p-5 space-y-3">
                  {(['MOMO', 'VNPAY', 'ZALOPAY', 'CREDIT_CARD', 'BANK_TRANSFER'] as PaymentMethod[]).map(
                    (method) => (
                      <label
                        key={method}
                        className={`
                          flex items-center p-4 border rounded-xl cursor-pointer transition-all
                          ${paymentMethod === method 
                            ? 'border-zinc-900 bg-zinc-50' 
                            : 'border-zinc-200 hover:border-zinc-300'}
                        `}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={() => setPaymentMethod(method)}
                          className="w-4 h-4 text-zinc-900 border-zinc-300 focus:ring-zinc-500"
                        />
                        <span className="ml-3 text-sm font-medium text-zinc-900">{getPaymentMethodName(method)}</span>
                      </label>
                    )
                  )}
                </div>

                <div className="p-5 border-t border-zinc-100 flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 text-sm font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="flex-1 py-3 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Đang xử lý...' : `Thanh toán ${formatCurrency(totalAmount)}`}
                  </button>
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

                <div className="p-5 border-t border-zinc-100 flex gap-3">
                  <Link href="/my-bookings" className="flex-1">
                    <button className="w-full py-3 text-sm font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">
                      Lịch sử đặt vé
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
                  </div>

                  {/* Total */}
                  <div className="p-4 border-t border-zinc-100 bg-zinc-50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-zinc-900">Tổng cộng</span>
                      <span className="text-lg font-bold text-zinc-900">
                        {formatCurrency(booking?.totalAmount || totalAmount)}
                      </span>
                    </div>
                    {booking?.discountAmount && booking.discountAmount > 0 && (
                      <>
                        <div className="flex justify-between items-center mt-2 text-sm text-green-600">
                          <span>Giảm giá</span>
                          <span>-{formatCurrency(booking.discountAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-200">
                          <span className="font-semibold text-zinc-900">Thanh toán</span>
                          <span className="text-xl font-bold text-zinc-900">
                            {formatCurrency(booking.finalAmount)}
                          </span>
                        </div>
                      </>
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
