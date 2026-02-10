'use client';

import ShowtimeTimeline from '@/components/admin/ShowtimeTimeline';
import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/Toast';
import { adminMovieService, adminRoomService, adminShowtimeService, adminTheaterService } from '@/services/adminService';

import { Showtime, Movie, Theater, Room, Pagination } from '@/types';
import { useRouter } from 'next/navigation';
import { movieService } from '@/services';

export default function ShowtimesManagementPage() {
  const router = useRouter();
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]); // For timeline view

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list'); // New state

  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; showtime: Showtime | null }>({
    open: false,
    showtime: null,
  });
  const [saving, setSaving] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Cache for bulk data
  const [cachedShowtimes, setCachedShowtimes] = useState<Showtime[]>([]);
  const [isCached, setIsCached] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'), // Default to today for easier timeline view
    endDate: format(new Date(), 'yyyy-MM-dd'),
    theaterIds: [] as string[],
    movieIds: [] as string[],
  });

  // UI State
  const [openFilter, setOpenFilter] = useState<'theater' | 'movie' | null>(null);
  const theaterFilterRef = useRef<HTMLDivElement>(null);
  const movieFilterRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [pagination, setPagination] = useState<Pagination>({
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
    last: true,
  });

  // Form Data
  const [formData, setFormData] = useState({
    theaterId: '',
    roomId: '',
    movieId: '',
    showDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    basePrice: 60000,
    status: 'AVAILABLE'
  });

  // Click Outside for Filters
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (theaterFilterRef.current && !theaterFilterRef.current.contains(event.target as Node) &&
        openFilter === 'theater') {
        setOpenFilter(null);
      }
      if (movieFilterRef.current && !movieFilterRef.current.contains(event.target as Node) &&
        openFilter === 'movie') {
        setOpenFilter(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openFilter]);

  // Initial Data Load
  useEffect(() => {
    fetchMetadata();
    fetchAllRooms(); // Fetch all rooms initially for quick schedule / timeline
  }, []);

  // Reset cache when filters change
  useEffect(() => {
    setIsCached(false);
    setCachedShowtimes([]);
  }, [filters.startDate, filters.endDate, filters.theaterIds, filters.movieIds]);

  // Trigger search/refresh when switching views if needed, or rely on cache
  useEffect(() => {
    if (hasSearched) {
      handleSearch(0);
    }
  }, [viewMode]);

  // ... (keep click outside)

  const fetchMetadata = async () => {
    try {
      const [moviesRes, theatersRes] = await Promise.all([
        movieService.getNowShowingMovies(),
        adminTheaterService.getAll(),
      ]);

      setMovies(moviesRes || []);
      setTheaters(Array.isArray(theatersRes) ? theatersRes : []);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  const fetchRooms = async (theaterId: string) => {
    // Keep existing specific fetch for edit modal
    try {
      const response = await adminRoomService.getByTheater(Number(theaterId));
      setRooms(response);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchAllRooms = async () => {
    try {
      const res = await adminRoomService.getAll();
      setAllRooms(res || []);
    } catch (e) {
      console.error("Error fetching all rooms", e);
    }
  };

  const { toast } = useToast();

  // ... (keep state)

  // ... (keep derived state)

  // Auto-calculate Price based on Room Type
  useEffect(() => {
    if (formData.roomId) {
      const room = rooms.find(r => r.id.toString() === formData.roomId) || allRooms.find(r => r.id.toString() === formData.roomId);
      if (room) {
        let price = 60000;
        if (room.roomType === 'VIP_4DX' || room.roomType === 'STANDARD_3D') price = 80000;
        if (room.roomType === 'IMAX' || room.roomType === 'IMAX_3D') price = 100000;
        setFormData(prev => ({ ...prev, basePrice: price }));
      }
    }
  }, [formData.roomId, rooms, allRooms]);

  // ... (keep click outside)

  // ... (keep fetch functions)

  const handleSearch = async (pageIndex = 0) => {
    if (filters.theaterIds.length === 0 && filters.movieIds.length === 0 && !filters.startDate && !filters.endDate) {
      if (viewMode === 'timeline' && !filters.startDate) {
        toast("Vui lòng chọn ngày để xem lịch biểu", "error");
        return;
      }
      if (viewMode === 'list') {
        toast("Vui lòng chọn ít nhất một điều kiện lọc!", "error");
        return;
      }
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const fetchSize = viewMode === 'timeline' ? 2000 : pagination.pageSize;

      const params: any = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        theaterIds: filters.theaterIds.length > 0 ? filters.theaterIds : undefined,
        movieIds: filters.movieIds.length > 0 ? filters.movieIds : undefined,
      };

      if (viewMode === 'timeline') {
        // Fetch ALL for timeline and cache it
        params.page = 0;
        params.size = 2000;
        const res = await adminShowtimeService.getAll(params);
        const content = res.content || [];
        setCachedShowtimes(content);
        setIsCached(true);
        setShowtimes(content);
        setPagination({
          pageNumber: 0,
          pageSize: content.length,
          totalElements: res.totalElements,
          totalPages: 1,
          last: true
        });
      } else {
        // List View: Use cache if available
        const listPageSize = 20; // Enforce 20 as requested

        if (isCached && cachedShowtimes.length > 0) {
          const startIndex = pageIndex * listPageSize;
          const endIndex = startIndex + listPageSize;
          const data = cachedShowtimes.slice(startIndex, endIndex);
          setShowtimes(data);
          setPagination({
            pageNumber: pageIndex,
            pageSize: listPageSize,
            totalElements: cachedShowtimes.length,
            totalPages: Math.ceil(cachedShowtimes.length / listPageSize),
            last: endIndex >= cachedShowtimes.length
          });
        } else {
          // Server-side fetch
          params.page = pageIndex;
          params.size = listPageSize;
          const res = await adminShowtimeService.getAll(params);
          if (res) {
            setShowtimes(res.content || []);
            setPagination({
              pageNumber: res.pageNumber,
              pageSize: res.pageSize,
              totalElements: res.totalElements,
              totalPages: res.totalPages,
              last: res.last
            });
          } else {
            setShowtimes([]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      toast('Không thể tải dữ liệu lịch chiếu', "error");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (showtime: Showtime) => {
    setEditingShowtime(showtime);
    // Logic to populate form
    setFormData({
      theaterId: '',
      roomId: showtime.id ? '' : '',
      movieId: showtime.movieId.toString(),
      showDate: showtime.showDate,
      startTime: showtime.startTime,
      basePrice: showtime.basePrice,
      status: showtime.status
    });

    const s = showtime as any;
    if (s.theaterId) {
      setFormData(prev => ({ ...prev, theaterId: s.theaterId, roomId: s.roomId }));
      fetchRooms(s.theaterId.toString());
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // ... (payload)
      const payload = {
        ...formData,
        movieId: Number(formData.movieId),
        roomId: Number(formData.roomId),
        basePrice: Number(formData.basePrice)
      };

      if (editingShowtime) {
        await adminShowtimeService.update(editingShowtime.id, payload);
        toast('Cập nhật thành công!', "success");
      } else {
        await adminShowtimeService.create(payload);
        toast('Tạo mới thành công!', "success");
      }
      setModalOpen(false);
      handleSearch(pagination.pageNumber);
    } catch (error: any) {
      console.error(error);
      toast(error.response?.data?.message || 'Có lỗi xảy ra', "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    handleSearch(newPage);
  };

  const toggleTheaterFilter = (id: string) => {
    setFilters(prev => {
      const exists = prev.theaterIds.includes(id);
      const newIds = exists ? prev.theaterIds.filter(x => x !== id) : [...prev.theaterIds, id];
      return { ...prev, theaterIds: newIds };
    });
  };

  const toggleMovieFilter = (id: string) => {
    setFilters(prev => {
      const exists = prev.movieIds.includes(id);
      const newIds = exists ? prev.movieIds.filter(x => x !== id) : [...prev.movieIds, id];
      return { ...prev, movieIds: newIds };
    });
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý Lịch Chiếu</h1>
          <p className="text-sm text-zinc-500 mt-1">Tìm kiếm và quản lý suất chiếu</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-zinc-100 p-1 rounded-lg flex text-sm font-medium">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Danh sách
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'timeline' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Lịch biểu
            </button>
          </div>

          <button onClick={() => router.push('/admin/showtimes/create')} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium flex items-center gap-2">
            Thay đổi lịch chiếu
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-zinc-200 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
        {/* Date Range */}
        {/* Date Range or Single Date */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {viewMode === 'timeline' ? (
            <div className="col-span-2 flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase">Ngày chiếu</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const d = new Date(filters.startDate);
                      d.setDate(d.getDate() - 1);
                      const s = format(d, 'yyyy-MM-dd');
                      setFilters({ ...filters, startDate: s, endDate: s });
                    }}
                    className="p-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600"
                    title="Ngày trước"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={e => setFilters({ ...filters, startDate: e.target.value, endDate: e.target.value })}
                    className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none text-center font-medium h-[38px]"
                  />
                  <button
                    onClick={() => {
                      const d = new Date(filters.startDate);
                      d.setDate(d.getDate() + 1);
                      const s = format(d, 'yyyy-MM-dd');
                      setFilters({ ...filters, startDate: s, endDate: s });
                    }}
                    className="p-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600"
                    title="Ngày sau"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Rạp Multi-select */}
        <div className="relative" ref={theaterFilterRef}>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase">Rạp</label>
          <div
            onClick={() => setOpenFilter(openFilter === 'theater' ? null : 'theater')}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white cursor-pointer flex justify-between items-center transition-colors ${openFilter === 'theater' ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-400'}`}
          >
            <span className="truncate">{filters.theaterIds.length ? `${filters.theaterIds.length} rạp đã chọn` : 'Tất cả rạp'}</span>
            <svg className={`w-4 h-4 text-zinc-400 transition-transform ${openFilter === 'theater' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          {/* Dropdown Content */}
          {openFilter === 'theater' && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20 p-2">
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
          )}
        </div>

        {/* Phim Multi-select */}
        <div className="relative" ref={movieFilterRef}>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase">Phim</label>
          <div
            onClick={() => setOpenFilter(openFilter === 'movie' ? null : 'movie')}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white cursor-pointer flex justify-between items-center transition-colors ${openFilter === 'movie' ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-400'}`}
          >
            <span className="truncate">{filters.movieIds.length ? `${filters.movieIds.length} phim đã chọn` : 'Tất cả phim'}</span>
            <svg className={`w-4 h-4 text-zinc-400 transition-transform ${openFilter === 'movie' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          {openFilter === 'movie' && (
            <div className="absolute top-full left-0 max-w-sm w-max mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20 p-2">
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
          )}
        </div>

        <button
          onClick={() => handleSearch(0)}
          className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium shadow-sm flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          Tìm kiếm
        </button>
      </div>

      {/* View Content */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
          </div>
        ) : !hasSearched && viewMode === 'list' ? (
          <div className="text-center py-20">
            <div className="bg-zinc-50 inline-flex p-4 rounded-full mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-900">Chưa có kết quả</h3>
            <p className="text-zinc-500 mt-1 max-w-sm mx-auto">Vui lòng chọn điều kiện lọc và nhấn nút "Tìm kiếm" để xem lịch chiếu.</p>
          </div>
        ) : viewMode === 'timeline' ? (
          <ShowtimeTimeline
            rooms={
              allRooms.length > 0
                ? (filters.theaterIds.length > 0
                  ? allRooms.filter(r => filters.theaterIds.includes(r.theaterId?.toString() || ''))
                  : allRooms)
                : rooms
            }
            showtimes={showtimes}
            onShowtimeClick={openEditModal}
            date={filters.startDate}
          />
        ) : showtimes.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">Không tìm thấy suất chiếu nào.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Phim</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Rạp</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Phòng</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Thời gian</th>

                    <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-500 uppercase">Thông tin vé</th>
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
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-900">{s.roomName}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{s.roomType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-zinc-900">{s.startTime ? s.startTime.substring(0, 5) : '--:--'}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{s.showDate ? format(new Date(s.showDate), 'dd/MM/yyyy') : ''}</div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {s.status === 'AVAILABLE' ? 'Sẵn sàng' : s.status}
                          </span>
                          <span className="text-sm font-semibold text-indigo-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.basePrice)}
                          </span>
                        </div>
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
    </div>
  );
}
