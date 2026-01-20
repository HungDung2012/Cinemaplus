'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminShowtimeService, adminMovieService, adminTheaterService, adminRoomService } from '@/services/adminService';

interface Showtime {
  id: number;
  movie: {
    id: number;
    title: string;
    posterUrl: string;
    duration: number;
  };
  theater: {
    id: number;
    name: string;
  };
  room: {
    id: number;
    name: string;
    roomType: string;
  };
  startTime: string;
  endTime: string;
  price: number;
  status: string;
}

interface Movie {
  id: number;
  title: string;
}

interface Theater {
  id: number;
  name: string;
}

interface Room {
  id: number;
  name: string;
  roomType: string;
}

export default function ShowtimesManagementPage() {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; showtime: Showtime | null }>({
    open: false,
    showtime: null,
  });
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    movieId: '',
    theaterId: '',
    date: '',
  });

  const [formData, setFormData] = useState({
    movieId: '',
    theaterId: '',
    roomId: '',
    startTime: '',
    price: '',
    status: 'AVAILABLE',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.theaterId) {
      fetchRooms(formData.theaterId);
    } else {
      setRooms([]);
    }
  }, [formData.theaterId]);

  const fetchInitialData = async () => {
    try {
      const [showtimesRes, moviesRes, theatersRes] = await Promise.all([
        adminShowtimeService.getAll(),
        adminMovieService.getAll(),
        adminTheaterService.getAll(),
      ]);
      setShowtimes(showtimesRes);
      setMovies(moviesRes);
      setTheaters(theatersRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (theaterId: string) => {
    try {
      const response = await adminRoomService.getByTheater(Number(theaterId));
      setRooms(response);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const openCreateModal = () => {
    setEditingShowtime(null);
    setFormData({
      movieId: '',
      theaterId: '',
      roomId: '',
      startTime: '',
      price: '',
      status: 'AVAILABLE',
    });
    setModalOpen(true);
  };

  const openEditModal = async (showtime: Showtime) => {
    setEditingShowtime(showtime);
    if (showtime.theater?.id) {
      await fetchRooms(showtime.theater.id.toString());
    }
    setFormData({
      movieId: showtime.movie?.id?.toString() || '',
      theaterId: showtime.theater?.id?.toString() || '',
      roomId: showtime.room?.id?.toString() || '',
      startTime: showtime.startTime ? new Date(showtime.startTime).toISOString().slice(0, 16) : '',
      price: showtime.price?.toString() || '',
      status: showtime.status || 'AVAILABLE',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        movieId: parseInt(formData.movieId),
        theaterId: parseInt(formData.theaterId),
        roomId: parseInt(formData.roomId),
        startTime: formData.startTime,
        price: parseFloat(formData.price),
        status: formData.status,
      };

      if (editingShowtime) {
        await adminShowtimeService.update(editingShowtime.id, data);
      } else {
        await adminShowtimeService.create(data);
      }

      await fetchInitialData();
      setModalOpen(false);
    } catch (error: any) {
      console.error('Error saving showtime:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.showtime) return;

    try {
      await adminShowtimeService.delete(deleteModal.showtime.id);
      setShowtimes(showtimes.filter(s => s.id !== deleteModal.showtime?.id));
      setDeleteModal({ open: false, showtime: null });
    } catch (error: any) {
      console.error('Error deleting showtime:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa suất chiếu');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-700';
      case 'FULL': return 'bg-red-100 text-red-700';
      case 'CANCELLED': return 'bg-zinc-100 text-zinc-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Còn chỗ';
      case 'FULL': return 'Hết chỗ';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const filteredShowtimes = showtimes.filter(showtime => {
    if (filters.movieId && showtime.movie?.id !== parseInt(filters.movieId)) return false;
    if (filters.theaterId && showtime.theater?.id !== parseInt(filters.theaterId)) return false;
    if (filters.date) {
      const showtimeDate = new Date(showtime.startTime).toDateString();
      const filterDate = new Date(filters.date).toDateString();
      if (showtimeDate !== filterDate) return false;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý suất chiếu</h1>
          <p className="text-zinc-500 mt-1">Quản lý lịch chiếu phim tại các rạp</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm suất chiếu
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.movieId}
            onChange={(e) => setFilters({ ...filters, movieId: e.target.value })}
            className="px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tất cả phim</option>
            {movies.map(movie => (
              <option key={movie.id} value={movie.id}>{movie.title}</option>
            ))}
          </select>
          <select
            value={filters.theaterId}
            onChange={(e) => setFilters({ ...filters, theaterId: e.target.value })}
            className="px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tất cả rạp</option>
            {theaters.map(theater => (
              <option key={theater.id} value={theater.id}>{theater.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={() => setFilters({ movieId: '', theaterId: '', date: '' })}
            className="px-4 py-2 text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Showtimes Table */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Phim</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Rạp / Phòng</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Thời gian</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Giá vé</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Trạng thái</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredShowtimes.map((showtime) => (
                <tr key={showtime.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {showtime.movie?.posterUrl && (
                        <img
                          src={showtime.movie.posterUrl}
                          alt={showtime.movie.title}
                          className="w-10 h-14 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-zinc-900">{showtime.movie?.title}</div>
                        <div className="text-sm text-zinc-500">{showtime.movie?.duration} phút</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{showtime.theater?.name}</div>
                    <div className="text-sm text-zinc-500">
                      {showtime.room?.name} ({showtime.room?.roomType})
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-zinc-900">{formatDateTime(showtime.startTime)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{formatPrice(showtime.price)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(showtime.status)}`}>
                      {getStatusLabel(showtime.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(showtime)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, showtime })}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredShowtimes.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-zinc-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-zinc-500">Không tìm thấy suất chiếu nào</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">
              {editingShowtime ? 'Chỉnh sửa suất chiếu' : 'Thêm suất chiếu mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Phim <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.movieId}
                  onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Chọn phim</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>{movie.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Rạp <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.theaterId}
                  onChange={(e) => setFormData({ ...formData, theaterId: e.target.value, roomId: '' })}
                  required
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Chọn rạp</option>
                  {theaters.map(theater => (
                    <option key={theater.id} value={theater.id}>{theater.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Phòng chiếu <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  required
                  disabled={!formData.theaterId}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-zinc-100"
                >
                  <option value="">Chọn phòng</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name} ({room.roomType})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Thời gian bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Giá vé (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="90000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="AVAILABLE">Còn chỗ</option>
                  <option value="FULL">Hết chỗ</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  )}
                  {editingShowtime ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Xác nhận xóa</h3>
            <p className="text-zinc-600 mb-6">
              Bạn có chắc chắn muốn xóa suất chiếu này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ open: false, showtime: null })}
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
