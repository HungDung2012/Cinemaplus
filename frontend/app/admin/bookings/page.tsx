'use client';

import { useState, useEffect } from 'react';
import { adminBookingService } from '@/services/adminService';

interface Booking {
  id: number;
  bookingCode: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
  };
  showtime: {
    id: number;
    movie: {
      title: string;
      posterUrl: string;
    };
    theater: {
      name: string;
    };
    room: {
      name: string;
    };
    startTime: string;
  };
  seats: string[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  { value: 'COMPLETED', label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'PAID', label: 'Đã thanh toán', color: 'bg-green-100 text-green-700' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền', color: 'bg-purple-100 text-purple-700' },
  { value: 'FAILED', label: 'Thất bại', color: 'bg-red-100 text-red-700' },
];

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<{ open: boolean; booking: Booking | null }>({
    open: false,
    booking: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; booking: Booking | null }>({
    open: false,
    booking: null,
  });
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    searchTerm: '',
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await adminBookingService.getAll();
      setBookings(response);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      await adminBookingService.updateStatus(bookingId, newStatus);
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.booking) return;

    try {
      await adminBookingService.delete(deleteModal.booking.id);
      setBookings(bookings.filter(b => b.id !== deleteModal.booking?.id));
      setDeleteModal({ open: false, booking: null });
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa đơn đặt vé');
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusInfo = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || { label: status, color: 'bg-zinc-100 text-zinc-700' };
  };

  const getPaymentStatusInfo = (status: string) => {
    return PAYMENT_STATUS_OPTIONS.find(s => s.value === status) || { label: status, color: 'bg-zinc-100 text-zinc-700' };
  };

  const filteredBookings = bookings.filter(booking => {
    if (filters.status && booking.status !== filters.status) return false;
    if (filters.paymentStatus && booking.paymentStatus !== filters.paymentStatus) return false;
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      if (
        !booking.bookingCode?.toLowerCase().includes(search) &&
        !booking.user?.fullName?.toLowerCase().includes(search) &&
        !booking.user?.email?.toLowerCase().includes(search) &&
        !booking.showtime?.movie?.title?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Quản lý đặt vé</h1>
        <p className="text-zinc-500 mt-1">Quản lý và theo dõi đơn đặt vé của khách hàng</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filters.paymentStatus}
            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
            className="px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tất cả thanh toán</option>
            {PAYMENT_STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setFilters({ status: '', paymentStatus: '', searchTerm: '' })}
            className="px-4 py-2 text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-zinc-900">{bookings.length}</div>
          <div className="text-sm text-zinc-500">Tổng đơn</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {bookings.filter(b => b.status === 'PENDING').length}
          </div>
          <div className="text-sm text-zinc-500">Chờ xử lý</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-green-600">
            {bookings.filter(b => b.status === 'COMPLETED').length}
          </div>
          <div className="text-sm text-zinc-500">Hoàn thành</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-red-600">
            {formatPrice(bookings.filter(b => b.paymentStatus === 'PAID').reduce((sum, b) => sum + (b.totalAmount || 0), 0))}
          </div>
          <div className="text-sm text-zinc-500">Doanh thu</div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Mã đặt vé</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Khách hàng</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Phim / Suất chiếu</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Ghế</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Tổng tiền</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Trạng thái</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredBookings.map((booking) => {
                const statusInfo = getStatusInfo(booking.status);
                const paymentInfo = getPaymentStatusInfo(booking.paymentStatus);
                
                return (
                  <tr key={booking.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium text-zinc-900">{booking.bookingCode}</div>
                      <div className="text-sm text-zinc-500">{formatDateTime(booking.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900">{booking.user?.fullName}</div>
                      <div className="text-sm text-zinc-500">{booking.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900">{booking.showtime?.movie?.title}</div>
                      <div className="text-sm text-zinc-500">
                        {booking.showtime?.theater?.name} - {booking.showtime?.room?.name}
                      </div>
                      <div className="text-sm text-zinc-500">{formatDateTime(booking.showtime?.startTime)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {booking.seats?.slice(0, 3).map((seat, idx) => (
                          <span key={idx} className="px-2 py-1 bg-zinc-100 rounded text-xs font-medium">
                            {seat}
                          </span>
                        ))}
                        {booking.seats?.length > 3 && (
                          <span className="px-2 py-1 bg-zinc-100 rounded text-xs font-medium">
                            +{booking.seats.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900">{formatPrice(booking.totalAmount)}</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${paymentInfo.color}`}>
                        {paymentInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                        className={`px-2 py-1 rounded text-sm font-medium border-0 cursor-pointer ${statusInfo.color}`}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailModal({ open: true, booking })}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, booking })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-zinc-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-zinc-500">Không tìm thấy đơn đặt vé nào</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal.open && detailModal.booking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900">Chi tiết đặt vé</h3>
              <button
                onClick={() => setDetailModal({ open: false, booking: null })}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 rounded-lg">
                <div className="text-sm text-zinc-500 mb-1">Mã đặt vé</div>
                <div className="font-mono font-bold text-lg">{detailModal.booking.bookingCode}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-zinc-500 mb-1">Khách hàng</div>
                  <div className="font-medium">{detailModal.booking.user?.fullName}</div>
                  <div className="text-sm text-zinc-600">{detailModal.booking.user?.email}</div>
                  <div className="text-sm text-zinc-600">{detailModal.booking.user?.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500 mb-1">Ngày đặt</div>
                  <div className="font-medium">{formatDateTime(detailModal.booking.createdAt)}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm text-zinc-500 mb-2">Thông tin suất chiếu</div>
                <div className="flex gap-3">
                  {detailModal.booking.showtime?.movie?.posterUrl && (
                    <img
                      src={detailModal.booking.showtime.movie.posterUrl}
                      alt=""
                      className="w-16 h-24 rounded object-cover"
                    />
                  )}
                  <div>
                    <div className="font-medium">{detailModal.booking.showtime?.movie?.title}</div>
                    <div className="text-sm text-zinc-600">{detailModal.booking.showtime?.theater?.name}</div>
                    <div className="text-sm text-zinc-600">{detailModal.booking.showtime?.room?.name}</div>
                    <div className="text-sm text-zinc-600">{formatDateTime(detailModal.booking.showtime?.startTime)}</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm text-zinc-500 mb-2">Ghế đã chọn</div>
                <div className="flex flex-wrap gap-2">
                  {detailModal.booking.seats?.map((seat, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded font-medium">
                      {seat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <div>
                  <div className="text-sm text-zinc-500">Tổng tiền</div>
                  <div className="text-2xl font-bold text-red-600">{formatPrice(detailModal.booking.totalAmount)}</div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(detailModal.booking.status).color}`}>
                    {getStatusInfo(detailModal.booking.status).label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Xác nhận xóa</h3>
            <p className="text-zinc-600 mb-6">
              Bạn có chắc chắn muốn xóa đơn đặt vé <span className="font-mono font-medium">{deleteModal.booking?.bookingCode}</span>?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ open: false, booking: null })}
                className="px-4 py-2 text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
