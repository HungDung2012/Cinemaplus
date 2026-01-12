'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Booking } from '@/types';
import { bookingService } from '@/services/bookingService';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function MyBookingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/my-bookings');
      return;
    }

    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated, authLoading]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getUserBookings();
      setBookings(data);
    } catch (err) {
      setError('Không thể tải lịch sử đặt vé');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!confirm('Bạn có chắc muốn hủy đơn đặt vé này?')) return;

    try {
      await bookingService.cancelBooking(id);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể hủy đơn đặt vé');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'Chờ thanh toán' },
      CONFIRMED: { color: 'bg-green-100 text-green-800', text: 'Đã xác nhận' },
      COMPLETED: { color: 'bg-blue-100 text-blue-800', text: 'Hoàn thành' },
      CANCELLED: { color: 'bg-red-100 text-red-800', text: 'Đã hủy' },
      EXPIRED: { color: 'bg-gray-100 text-gray-800', text: 'Hết hạn' },
    };
    return badges[status] || { color: 'bg-gray-100 text-gray-800', text: status };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-gray-300 border-t-red-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Lịch sử đặt vé</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <p className="text-gray-500 mb-4">Bạn chưa có đơn đặt vé nào</p>
            <Link
              href="/movies"
              className="inline-block bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Đặt vé ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const badge = getStatusBadge(booking.status);
              return (
                <div key={booking.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Poster */}
                      {booking.moviePosterUrl && (
                        <img
                          src={booking.moviePosterUrl}
                          alt={booking.movieTitle}
                          className="w-24 h-36 object-cover rounded"
                        />
                      )}
                      
                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg">{booking.movieTitle}</h3>
                            <p className="text-sm text-gray-500">Mã đặt vé: {booking.bookingCode}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                            {badge.text}
                          </span>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Rạp</p>
                            <p className="font-medium">{booking.theaterName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Phòng</p>
                            <p className="font-medium">{booking.roomName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Ngày chiếu</p>
                            <p className="font-medium">{formatDate(booking.showDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Giờ chiếu</p>
                            <p className="font-medium">{booking.startTime}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Ghế</p>
                            <p className="font-medium">{booking.seatLabels.join(', ')}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Số ghế</p>
                            <p className="font-medium">{booking.numberOfSeats}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Ngày đặt</p>
                            <p className="font-medium">{formatDate(booking.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Thanh toán</p>
                            <p className="font-medium">{booking.paymentStatus}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                    <div>
                      <span className="text-gray-500">Tổng tiền: </span>
                      <span className="text-xl font-bold text-red-500">{formatCurrency(booking.finalAmount)}</span>
                    </div>
                    
                    {booking.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
