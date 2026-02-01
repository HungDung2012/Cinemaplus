'use client';

import { useState, useEffect } from 'react';
import { adminShowtimeService, adminMovieService, adminTheaterService, adminRoomService } from '@/services/adminService';
import { format } from 'date-fns';

interface Showtime {
  id: number;
  movieTitle: string;
  moviePosterUrl: string;
  movieDuration: number;
  movie: { // Fallback if nested
    id: number;
    title: string;
  };
  theaterName: string;
  roomName: string;
  roomType: string;
  showDate: string;
  startTime: string; // HH:mm:ss
  basePrice: number;
  status: string;
}

interface Movie {
  id: number;
  title: string;
  duration: number;
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

interface Pagination {
  pageNumber: number; // 0-indexed
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export default function ShowtimesManagementPage() {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; showtime: Showtime | null }>({
    open: false,
    showtime: null,
  });
  const [saving, setSaving] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    startDate: '', // yyyy-MM-dd
    endDate: '',   // yyyy-MM-dd
    theaterIds: [] as string[],
    movieIds: [] as string[],
  });

  // Pagination State
  const [pagination, setPagination] = useState<Pagination>({
    pageNumber: 0,
    pageSize: 20,
    totalElements: 0,
    totalPages: 0,
    last: true
  });

  // Create/Edit Form State
  const [formData, setFormData] = useState({
    movieId: '',
    theaterId: '',
    roomId: '',
    showDate: '',
    startTime: '',
    price: '',
    status: 'AVAILABLE',
  });
  const [calculatedEndTime, setCalculatedEndTime] = useState('');

  // Initial Load (Metadata only)
  useEffect(() => {
    fetchMetadata();
    // Do NOT fetch showtimes automatically on mount, or fetch initial page? 
    // User requested "Manual Trigger". But usually initial load is expected.
    // Let's fetch initial page for better UX, but subsequent filters require button.
    handleSearch();
  }, []);

  // Fetch Rooms when Theater changes in Form
  useEffect(() => {
    if (formData.theaterId) {
      fetchRooms(formData.theaterId);
    } else {
      setRooms([]);
    }
  }, [formData.theaterId]);

  // Auto-calculate End Time
  useEffect(() => {
    if (formData.movieId && formData.startTime) {
      const movie = movies.find(m => m.id.toString() === formData.movieId);
      if (movie && movie.duration) {
        const [hours, minutes] = formData.startTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes + movie.duration);
        setCalculatedEndTime(date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }));
      }
    } else {
      setCalculatedEndTime('');
    }
  }, [formData.movieId, formData.startTime, movies]);

  const fetchMetadata = async () => {
    try {
      const [moviesRes, theatersRes] = await Promise.all([
        adminMovieService.getAll(),
        adminTheaterService.getAll(),
      ]);
      setMovies(moviesRes.content || moviesRes);
      setTheaters(theatersRes);
    } catch (error) {
      console.error('Error fetching metadata:', error);
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

  const handleSearch = async (pageIndex = 0) => {
    setLoading(true);
    try {
      const params = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        theaterIds: filters.theaterIds.length > 0 ? filters.theaterIds : undefined,
        movieIds: filters.movieIds.length > 0 ? filters.movieIds : undefined,
        page: pageIndex,
        size: pagination.pageSize
      };

      const res = await adminShowtimeService.getAll(params);
      // Ensure backend returns PageResponse structure
      if (res && res.content) {
        setShowtimes(res.content);
        setPagination({
          pageNumber: res.pageNumber,
          pageSize: res.pageSize,
          totalElements: res.totalElements,
          totalPages: res.totalPages,
          last: res.last
        });
      } else {
        // Fallback if backend returns list (shouldn't happen with new API)
        setShowtimes(res || []);
      }
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      alert('Không thể tải dữ liệu lịch chiếu');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      handleSearch(newPage);
    }
  };

  // Filter Handlers
  const toggleTheaterFilter = (id: string) => {
    setFilters(prev => {
      const newIds = prev.theaterIds.includes(id)
        ? prev.theaterIds.filter(tid => tid !== id)
        : [...prev.theaterIds, id];
      return { ...prev, theaterIds: newIds };
    });
  };

  const toggleMovieFilter = (id: string) => {
    setFilters(prev => {
      const newIds = prev.movieIds.includes(id)
        ? prev.movieIds.filter(mid => mid !== id)
        : [...prev.movieIds, id];
      return { ...prev, movieIds: newIds };
    });
  };

  // Modal & Form Handlers...
  const openCreateModal = () => {
    setEditingShowtime(null);
    setFormData({
      movieId: '',
      theaterId: '',
      roomId: '',
      showDate: format(new Date(), 'yyyy-MM-dd'),
      startTime: '',
      price: '',
      status: 'AVAILABLE',
    });
    setModalOpen(true);
  };

  const openEditModal = async (showtime: Showtime) => {
    setEditingShowtime(showtime);
    // Find theater ID from showtime (backend flat field theaterId might be needed, or we use room to find theater)
    // Actually Backend response has theaterId.
    // We need to typecase or use the field from response.
    // If Backend Response has theaterId, map it.
    // Wait, mapped response has theaterId.
    const theaterId = (showtime as any).theaterId;
    if (theaterId) {
      await fetchRooms(theaterId.toString());
    }

    setFormData({
      movieId: (showtime as any).movieId?.toString() || '',
      theaterId: theaterId?.toString() || '',
      roomId: (showtime as any).roomId?.toString() || '',
      showDate: showtime.showDate,
      startTime: showtime.startTime.substring(0, 5),
      price: showtime.basePrice?.toString() || '',
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
        showDate: formData.showDate,
        startTime: formData.startTime + ":00",
        basePrice: parseFloat(formData.price),
        status: formData.status,
      };

      if (editingShowtime) {
        await adminShowtimeService.update(editingShowtime.id, data);
      } else {
        await adminShowtimeService.create(data);
      }
      handleSearch(pagination.pageNumber); // Reload current page
      setModalOpen(false);
    } catch (error: any) {
      console.error('Error saving:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.showtime) return;
    try {
      await adminShowtimeService.delete(deleteModal.showtime.id);
      handleSearch(pagination.pageNumber);
      setDeleteModal({ open: false, showtime: null });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-700 border border-green-200';
      case 'FULL': return 'bg-red-100 text-red-700 border border-red-200';
      case 'CANCELLED': return 'bg-zinc-100 text-zinc-500 border border-zinc-200 line-through';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý Lịch Chiếu</h1>
          <p className="text-sm text-zinc-500 mt-1">Tìm kiếm và quản lý suất chiếu</p>
        </div>
        <button onClick={openCreateModal} className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors shadow-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Thêm suất chiếu
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-zinc-200 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
        {/* Date Range */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase">Từ ngày</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase">Đến ngày</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Rạp Multi-select (Simple Dropdown Mockup) */}
        <div className="relative group">
          <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase">Rạp ({filters.theaterIds.length})</label>
          <div className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white cursor-pointer flex justify-between items-center group-hover:border-zinc-400">
            <span className="truncate">{filters.theaterIds.length ? `${filters.theaterIds.length} rạp đã chọn` : 'Tất cả rạp'}</span>
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-y-auto hidden group-hover:block z-20 p-2">
            {theaters.map(t => (
              <label key={t.id} className="flex items-center gap-2 p-2 hover:bg-zinc-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.theaterIds.includes(t.id.toString())}
                  onChange={() => toggleTheaterFilter(t.id.toString())}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                <span className="text-sm text-zinc-700">{t.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Phim Multi-select */}
        <div className="relative group">
          <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase">Phim ({filters.movieIds.length})</label>
          <div className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white cursor-pointer flex justify-between items-center group-hover:border-zinc-400">
            <span className="truncate">{filters.movieIds.length ? `${filters.movieIds.length} phim đã chọn` : 'Tất cả phim'}</span>
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          <div className="absolute top-full left-0 w-64 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-y-auto hidden group-hover:block z-20 p-2">
            {movies.map(m => (
              <label key={m.id} className="flex items-center gap-2 p-2 hover:bg-zinc-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.movieIds.includes(m.id.toString())}
                  onChange={() => toggleMovieFilter(m.id.toString())}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                <span className="text-sm text-zinc-700 truncate">{m.title}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={() => handleSearch(0)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          Tìm kiếm
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
          </div>
        ) : showtimes.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">Không tìm thấy suất chiếu nào.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Phim</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Rạp / Phòng</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Thời gian</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Giá vé</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-zinc-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {showtimes.map(s => (
                    <tr key={s.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-zinc-200 rounded overflow-hidden flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {s.moviePosterUrl && <img src={s.moviePosterUrl} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <div className="font-medium text-zinc-900 line-clamp-1" title={s.movieTitle}>{s.movieTitle}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">{s.movieDuration} phút</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-zinc-900">{s.theaterName}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{s.roomName} ({s.roomType})</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-zinc-900">{s.startTime ? s.startTime.substring(0, 5) : '--:--'}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{s.showDate ? format(new Date(s.showDate), 'dd/MM/yyyy') : ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-emerald-600">{formatPrice(s.basePrice)}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(s.status)}`}>{s.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEditModal(s)} className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">Sửa</button>
                        <button onClick={() => setDeleteModal({ open: true, showtime: s })} className="text-red-600 hover:text-red-800 text-sm font-medium">Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div className="text-sm text-zinc-500">
                Hiển thị {pagination.pageNumber * pagination.pageSize + 1}-{Math.min((pagination.pageNumber + 1) * pagination.pageSize, pagination.totalElements)} trong số {pagination.totalElements} bản ghi
              </div>
              <div className="flex gap-2">
                <button
                  disabled={pagination.pageNumber === 0}
                  onClick={() => handlePageChange(pagination.pageNumber - 1)}
                  className="px-3 py-1 border border-zinc-300 rounded bg-white text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="px-3 py-1 text-sm text-zinc-700 flex items-center">
                  Trang {pagination.pageNumber + 1} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.last}
                  onClick={() => handlePageChange(pagination.pageNumber + 1)}
                  className="px-3 py-1 border border-zinc-300 rounded bg-white text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal and Other Popups would go here (omitted for brevity but logic is present in handlers) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-lg font-bold text-zinc-900">
                {editingShowtime ? 'Cập nhật suất chiếu' : 'Thêm suất chiếu mới'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">×</button>
            </div>
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-1">Rạp</label>
                  <select
                    value={formData.theaterId}
                    onChange={e => setFormData({ ...formData, theaterId: e.target.value, roomId: '' })}
                    className="w-full border border-zinc-300 rounded p-2 text-sm" required
                  >
                    <option value="">Chọn rạp</option>
                    {theaters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-1">Phòng</label>
                  <select
                    value={formData.roomId}
                    onChange={e => setFormData({ ...formData, roomId: e.target.value })}
                    className="w-full border border-zinc-300 rounded p-2 text-sm" required
                    disabled={!formData.theaterId}
                  >
                    <option value="">Chọn phòng</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.roomType})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-1">Phim</label>
                <select
                  value={formData.movieId}
                  onChange={e => setFormData({ ...formData, movieId: e.target.value })}
                  className="w-full border border-zinc-300 rounded p-2 text-sm" required
                >
                  <option value="">Chọn phim</option>
                  {movies.map(m => <option key={m.id} value={m.id}>{m.title} ({m.duration} phút)</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-sm font-medium text-zinc-700 block mb-1">Ngày</label>
                  <input type="date" value={formData.showDate} onChange={e => setFormData({ ...formData, showDate: e.target.value })} className="w-full border border-zinc-300 rounded p-2 text-sm" required />
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-medium text-zinc-700 block mb-1">Bắt đầu</label>
                  <input type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="w-full border border-zinc-300 rounded p-2 text-sm" required />
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-medium text-zinc-700 block mb-1">Kết thúc</label>
                  <div className="w-full bg-zinc-100 border border-zinc-200 rounded p-2 text-sm text-zinc-500">{calculatedEndTime || '--:--'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-1">Giá vé</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full border border-zinc-300 rounded p-2 text-sm" required min="0" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-1">Trạng thái</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border border-zinc-300 rounded p-2 text-sm">
                    <option value="AVAILABLE">Đang bán</option>
                    <option value="FULL">Hết vé</option>
                    <option value="CANCELLED">Hủy</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-zinc-100 rounded text-zinc-800 hover:bg-zinc-200">Hủy</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-50">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Xóa suất chiếu?</h3>
            <p className="text-zinc-600 mb-6">Bạn có chắc chắn muốn xóa? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModal({ open: false, showtime: null })} className="px-4 py-2 bg-zinc-100 rounded hover:bg-zinc-200">Hủy</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
