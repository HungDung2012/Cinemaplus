'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminMovieService, adminTheaterService, adminBookingService, adminUserService, adminDashboardService } from '@/services/adminService';

interface DashboardStats {
  totalMovies: number;
  totalTheaters: number;
  totalBookings: number;
  totalUsers: number;
  totalRevenue: number;
  todayBookings: number;
  todayRevenue: number;
}

interface RecentBooking {
  id: number;
  bookingCode: string;
  userName: string;
  movieTitle: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [statsRes, bookingsRes] = await Promise.all([
        adminDashboardService.getStats(),
        adminBookingService.getAll().catch(() => []),
      ]);

      const dashboardStats = statsRes?.data; // API returns ApiResponse<DashboardStatsResponse>

      setStats({
        totalMovies: dashboardStats?.totalMovies || 0,
        totalTheaters: dashboardStats?.totalTheaters || 0,
        totalBookings: dashboardStats?.totalBookings || 0,
        totalUsers: dashboardStats?.totalUsers || 0,
        totalRevenue: dashboardStats?.totalRevenue || 0,
        todayBookings: dashboardStats?.todayBookings || 0,
        todayRevenue: dashboardStats?.todayRevenue || 0,
      });

      const bookings = Array.isArray(bookingsRes) ? bookingsRes : [];

      // Get recent bookings
      setRecentBookings(bookings.slice(0, 10).map((b: any) => ({
        id: b.id,
        bookingCode: b.bookingCode,
        userName: b.userFullName || b.user?.fullName || 'N/A',
        movieTitle: b.movieTitle || b.showtime?.movie?.title || 'N/A',
        totalAmount: b.totalAmount || 0,
        status: b.status,
        createdAt: b.createdAt,
      })));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-blue-100 text-blue-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      'PENDING': 'Chờ xử lý',
      'CONFIRMED': 'Đã xác nhận',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-zinc-300 border-t-zinc-800 rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Tổng quan hệ thống quản lý rạp chiếu phim</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Movies */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Tổng số phim</p>
              <p className="text-3xl font-bold text-zinc-900 mt-1">{stats?.totalMovies || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          </div>
          <Link href="/admin/movies" className="text-sm text-blue-600 hover:underline mt-3 inline-block">
            Quản lý phim →
          </Link>
        </div>

        {/* Total Theaters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Tổng số rạp</p>
              <p className="text-3xl font-bold text-zinc-900 mt-1">{stats?.totalTheaters || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <Link href="/admin/theaters" className="text-sm text-purple-600 hover:underline mt-3 inline-block">
            Quản lý rạp →
          </Link>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Tổng người dùng</p>
              <p className="text-3xl font-bold text-zinc-900 mt-1">{stats?.totalUsers || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <Link href="/admin/users" className="text-sm text-green-600 hover:underline mt-3 inline-block">
            Quản lý người dùng →
          </Link>
        </div>

        {/* Total Bookings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Tổng đặt vé</p>
              <p className="text-3xl font-bold text-zinc-900 mt-1">{stats?.totalBookings || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
          <Link href="/admin/bookings" className="text-sm text-orange-600 hover:underline mt-3 inline-block">
            Quản lý đặt vé →
          </Link>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Tổng doanh thu</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats?.totalRevenue || 0)}</p>
            </div>
            <svg className="w-12 h-12 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100">Doanh thu hôm nay</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats?.todayRevenue || 0)}</p>
              <p className="text-emerald-200 text-sm mt-1">{stats?.todayBookings || 0} đơn đặt vé</p>
            </div>
            <svg className="w-12 h-12 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200">
        <div className="p-6 border-b border-zinc-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Đơn đặt vé gần đây</h2>
            <Link href="/admin/bookings" className="text-sm text-red-600 hover:underline">
              Xem tất cả →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Phim</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    Chưa có đơn đặt vé nào
                  </td>
                </tr>
              ) : (
                recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-zinc-900">{booking.bookingCode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-zinc-900">{booking.userName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-900 line-clamp-1">{booking.movieTitle}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-zinc-900">{formatCurrency(booking.totalAmount)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-zinc-500">{formatDate(booking.createdAt)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
