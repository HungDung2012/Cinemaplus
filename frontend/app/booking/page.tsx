'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Showtime, Seat, Booking, PaymentMethod } from '@/types';
import { showtimeService } from '@/services/showtimeService';
import { seatService } from '@/services/theaterService';
import { bookingService, paymentService } from '@/services/bookingService';
import { SeatMap } from '@/components';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const showtimeId = Number(searchParams.get('showtimeId'));

  const [step, setStep] = useState(1);
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOMO');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/booking?showtimeId=${showtimeId}`);
      return;
    }

    if (showtimeId) {
      fetchShowtimeAndSeats();
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

  const handleSeatSelection = (seats: Seat[]) => {
    setSelectedSeats(seats);
  };

  const handleCreateBooking = async () => {
    if (selectedSeats.length === 0) {
      alert('Vui lòng chọn ít nhất 1 ghế');
      return;
    }

    try {
      setProcessing(true);
      const bookingData = await bookingService.createBooking({
        showtimeId,
        seatIds: selectedSeats.map((s) => s.id),
      });
      setBooking(bookingData);
      setStep(2);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo đơn đặt vé');
      router.push(`/dat-ve?movieId=${showtime?.movieId}`);
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!booking) return;

    try {
      setProcessing(true);
      const payment = await paymentService.createPayment({
        bookingId: booking.id,
        paymentMethod,
      });

      // Process payment
      await paymentService.processPayment(payment.id);

      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Thanh toán thất bại');
    } finally {
      setProcessing(false);
    }
  };

  const totalAmount = selectedSeats.reduce((sum, seat) => {
    return sum + (showtime?.basePrice || 0) * seat.priceMultiplier;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-gray-300 border-t-red-500 rounded-full"></div>
      </div>
    );
  }

  if (error && !showtime) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/movies" className="text-red-500 hover:text-red-600">
            Quay lại danh sách phim
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Đặt vé</h1>
          
          {/* Stepper */}
          <div className="flex items-center mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= s ? 'bg-red-500' : 'bg-gray-600'
                  }`}
                >
                  {step > s ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s
                  )}
                </div>
                <span className="ml-2 text-sm">
                  {s === 1 ? 'Chọn ghế' : s === 2 ? 'Thanh toán' : 'Hoàn tất'}
                </span>
                {s < 3 && <div className="w-12 h-0.5 bg-gray-600 mx-4"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && showtime && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h2 className="text-xl font-bold mb-6">Chọn ghế</h2>
                <SeatMap
                  seats={seats}
                  basePrice={showtime.basePrice}
                  onSelectionChange={handleSeatSelection}
                />
                
                <div className="mt-6">
                  <Button
                    onClick={handleCreateBooking}
                    disabled={selectedSeats.length === 0 || processing}
                    isLoading={processing}
                    className="w-full"
                    size="lg"
                  >
                    Tiếp tục
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && booking && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h2 className="text-xl font-bold mb-6">Thanh toán</h2>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Chọn phương thức thanh toán</h3>
                    <div className="space-y-2">
                      {(['MOMO', 'VNPAY', 'ZALOPAY', 'CREDIT_CARD', 'BANK_TRANSFER'] as PaymentMethod[]).map(
                        (method) => (
                          <label
                            key={method}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                              paymentMethod === method ? 'border-red-500 bg-red-50' : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method}
                              checked={paymentMethod === method}
                              onChange={() => setPaymentMethod(method)}
                              className="text-red-500"
                            />
                            <span className="ml-3">{getPaymentMethodName(method)}</span>
                          </label>
                        )
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={processing}
                    isLoading={processing}
                    className="w-full"
                    size="lg"
                  >
                    Thanh toán {formatCurrency(booking.finalAmount)}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && booking && (
              <div className="bg-white rounded-lg p-6 shadow text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">Đặt vé thành công!</h2>
                <p className="text-gray-600 mb-6">Mã đặt vé: <span className="font-bold">{booking.bookingCode}</span></p>
                
                <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold mb-2">Thông tin vé</h3>
                  <p>Phim: {booking.movieTitle}</p>
                  <p>Rạp: {booking.theaterName}</p>
                  <p>Phòng: {booking.roomName}</p>
                  <p>Ngày: {formatDate(booking.showDate)}</p>
                  <p>Giờ: {booking.startTime}</p>
                  <p>Ghế: {booking.seatLabels.join(', ')}</p>
                </div>

                <div className="flex gap-4 justify-center">
                  <Link href="/my-bookings">
                    <Button variant="outline">Xem lịch sử đặt vé</Button>
                  </Link>
                  <Link href="/movies">
                    <Button>Tiếp tục đặt vé</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow sticky top-24">
              {showtime && (
                <>
                  <div className="p-4 border-b">
                    <div className="flex gap-4">
                      {showtime.moviePosterUrl && (
                        <img
                          src={showtime.moviePosterUrl}
                          alt={showtime.movieTitle}
                          className="w-20 rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-bold">{showtime.movieTitle}</h3>
                        <p className="text-sm text-gray-600">{showtime.roomType}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rạp</span>
                      <span>{showtime.theaterName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phòng</span>
                      <span>{showtime.roomName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày</span>
                      <span>{formatDate(showtime.showDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giờ</span>
                      <span>{showtime.startTime.substring(0, 5)}</span>
                    </div>
                    {selectedSeats.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ghế</span>
                        <span>{selectedSeats.map((s) => s.seatLabel).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Tổng tiền</span>
                      <span className="text-xl font-bold text-red-500">
                        {formatCurrency(step >= 2 && booking ? booking.finalAmount : totalAmount)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-gray-300 border-t-red-500 rounded-full"></div>
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
