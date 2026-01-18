'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Movie, Theater, Showtime, Region, RoomType } from '@/types';
import { movieService } from '@/services/movieService';
import { theaterService, regionService } from '@/services/theaterService';
import { showtimeService } from '@/services/showtimeService';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';

// Định dạng phim
const ROOM_TYPE_LABELS: Record<string, string> = {
  'STANDARD_2D': '2D Phụ Đề Việt',
  'STANDARD_3D': '3D Phụ Đề Việt',
  'IMAX': 'IMAX Phụ Đề Việt',
  'IMAX_3D': 'IMAX3D Phụ Đề Việt',
  'VIP_4DX': '4DX3D Phụ Đề Việt',
  'SCREENX_3D': 'SCREENX-3D Phụ Đề Việt',
  'ULTRA_4DX': 'ULTRA 4DX-SCX3D Vietnam Sub',
};

function BookingFlowContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const preselectedMovieId = searchParams.get('movieId') ? Number(searchParams.get('movieId')) : null;

  // Data state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);

  // Selection state
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('STANDARD_2D');

  // Loading states
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);

  // Generate dates (30 days calendar like CGV)
  const dates = useMemo(() => {
    const result: { date: string; day: number; month: number; dayName: string }[] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      result.push({
        date: d.toISOString().split('T')[0],
        day: d.getDate(),
        month: d.getMonth() + 1,
        dayName: dayNames[d.getDay()],
      });
    }
    return result;
  }, []);

  // Init
  useEffect(() => {
    fetchMovies();
    fetchRegions();
    // Set default date to today
    setSelectedDate(dates[0]?.date || '');
  }, []);

  // Preselect movie if provided in URL
  useEffect(() => {
    if (preselectedMovieId && movies.length > 0) {
      const movie = movies.find(m => m.id === preselectedMovieId);
      if (movie) {
        setSelectedMovie(movie);
      }
    }
  }, [preselectedMovieId, movies]);

  // Fetch showtimes when movie, region, or date changes
  useEffect(() => {
    if (selectedMovie && selectedRegion && selectedDate) {
      fetchShowtimesForRegion();
    }
  }, [selectedMovie, selectedRegion, selectedDate]);

  const fetchMovies = async () => {
    try {
      setLoadingMovies(true);
      const data = await movieService.getNowShowingMovies();
      setMovies(data);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoadingMovies(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const data = await regionService.getAllRegions();
      setRegions(data);
      // Set default region (first one)
      if (data.length > 0) {
        setSelectedRegion(data[0]);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchShowtimesForRegion = async () => {
    if (!selectedMovie || !selectedRegion || !selectedDate) return;

    try {
      setLoadingShowtimes(true);

      // Get theaters in selected region
      const theatersData = await theaterService.getTheatersByRegion(selectedRegion.id);
      setTheaters(theatersData);

      // Get showtimes for movie and date at all theaters
      const showtimesData = await showtimeService.getShowtimesByMovieAndDate(
        selectedMovie.id,
        selectedDate
      );

      // Filter showtimes by theaters in selected region
      const theaterIds = theatersData.map(t => t.id);
      const filteredShowtimes = showtimesData.filter(s => theaterIds.includes(s.theaterId));

      setShowtimes(filteredShowtimes);
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      setShowtimes([]);
    } finally {
      setLoadingShowtimes(false);
    }
  };

  // Get available room types from showtimes
  const availableRoomTypes = useMemo(() => {
    const types = new Set(showtimes.map(s => s.roomType));
    return Array.from(types);
  }, [showtimes]);

  // Filter showtimes by room type
  const filteredShowtimes = useMemo(() => {
    return showtimes.filter(s => s.roomType === selectedRoomType);
  }, [showtimes, selectedRoomType]);

  // Group showtimes by theater and room
  const showtimesByTheater = useMemo(() => {
    const grouped: Record<string, { theater: Theater; rooms: Record<string, Showtime[]> }> = {};

    filteredShowtimes.forEach(showtime => {
      if (!grouped[showtime.theaterName]) {
        const theater = theaters.find(t => t.id === showtime.theaterId);
        if (theater) {
          grouped[showtime.theaterName] = { theater, rooms: {} };
        }
      }

      if (grouped[showtime.theaterName]) {
        const roomKey = `${showtime.roomType}`;
        if (!grouped[showtime.theaterName].rooms[roomKey]) {
          grouped[showtime.theaterName].rooms[roomKey] = [];
        }
        grouped[showtime.theaterName].rooms[roomKey].push(showtime);
      }
    });

    // Sort showtimes by start time
    Object.values(grouped).forEach(theater => {
      Object.values(theater.rooms).forEach(showtimes => {
        showtimes.sort((a, b) => a.startTime.localeCompare(b.startTime));
      });
    });

    return grouped;
  }, [filteredShowtimes, theaters]);

  const handleSelectShowtime = (showtime: Showtime) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/dat-ve?movieId=${selectedMovie?.id}`);
      return;
    }
    router.push(`/booking?showtimeId=${showtime.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gray-900 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold">Đặt vé xem phim</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Left */}
          <div className="lg:col-span-3 space-y-4">

            {/* Movie Selector */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
                Chọn phim
              </h2>

              {loadingMovies ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse flex-shrink-0 w-24">
                      <div className="bg-gray-300 aspect-[2/3] rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {movies.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => setSelectedMovie(movie)}
                      className={`flex-shrink-0 w-24 cursor-pointer transition-all ${selectedMovie?.id === movie.id
                          ? 'ring-2 ring-red-500 rounded-lg'
                          : 'opacity-70 hover:opacity-100'
                        }`}
                    >
                      <img
                        src={movie.posterUrl || '/placeholder-movie.jpg'}
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover rounded"
                      />
                      <p className="text-xs mt-1 text-center line-clamp-2">{movie.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date Calendar */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
                Chọn ngày
              </h2>

              <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {dates.map((d, idx) => {
                    // Hiển thị theo hàng (7 ngày/hàng như lịch)
                    const isSelected = selectedDate === d.date;
                    const isToday = idx === 0;

                    return (
                      <button
                        key={d.date}
                        onClick={() => setSelectedDate(d.date)}
                        className={`flex flex-col items-center px-3 py-2 rounded transition-colors min-w-[56px] ${isSelected
                            ? 'bg-red-500 text-white'
                            : isToday
                              ? 'bg-red-100 hover:bg-red-200'
                              : 'hover:bg-gray-100'
                          }`}
                      >
                        <span className="text-xs text-gray-500" style={{ color: isSelected ? 'white' : undefined }}>
                          {d.month < 10 ? `0${d.month}` : d.month}
                        </span>
                        <span className="text-lg font-bold">{d.day}</span>
                        <span className="text-xs" style={{ color: isSelected ? 'white' : d.dayName === 'CN' ? '#ef4444' : d.dayName === 'T7' ? '#3b82f6' : undefined }}>
                          {d.dayName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Region Tabs */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
                Chọn khu vực
              </h2>

              <div className="flex flex-wrap gap-2 border-b pb-3 mb-3">
                {regions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => setSelectedRegion(region)}
                    className={`px-4 py-2 text-sm rounded-t transition-colors ${selectedRegion?.id === region.id
                        ? 'bg-amber-100 text-amber-800 border-b-2 border-amber-500 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    {region.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Type Filter */}
            {availableRoomTypes.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm">4</span>
                  Định dạng phim
                </h2>

                <div className="flex flex-wrap gap-2">
                  {availableRoomTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedRoomType(type)}
                      className={`px-4 py-2 text-sm rounded-full border transition-colors ${selectedRoomType === type
                          ? 'bg-amber-100 border-amber-400 text-amber-800'
                          : 'border-gray-300 text-gray-600 hover:border-amber-400'
                        }`}
                    >
                      {ROOM_TYPE_LABELS[type] || type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Showtimes by Theater */}
            <div className="space-y-4">
              {loadingShowtimes ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="flex gap-2">
                      <div className="h-10 bg-gray-300 rounded w-16"></div>
                      <div className="h-10 bg-gray-300 rounded w-16"></div>
                      <div className="h-10 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ) : !selectedMovie ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  <p>Vui lòng chọn phim để xem lịch chiếu</p>
                </div>
              ) : Object.keys(showtimesByTheater).length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Không có suất chiếu nào cho ngày và khu vực đã chọn</p>
                </div>
              ) : (
                Object.entries(showtimesByTheater).map(([theaterName, { rooms }]) => (
                  <div key={theaterName} className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Theater Header */}
                    <div className="p-4 border-b bg-gray-50">
                      <h3 className="font-bold text-lg">{theaterName}</h3>
                    </div>

                    {/* Room Showtimes */}
                    <div className="p-4 space-y-4">
                      {Object.entries(rooms).map(([roomKey, roomShowtimes]) => (
                        <div key={roomKey}>
                          <p className="text-sm font-medium text-gray-700 mb-2">{roomKey}</p>
                          <div className="flex flex-wrap gap-2">
                            {roomShowtimes.map((showtime) => (
                              <button
                                key={showtime.id}
                                onClick={() => handleSelectShowtime(showtime)}
                                disabled={showtime.status !== 'AVAILABLE'}
                                className={`px-4 py-2 border rounded transition-colors ${showtime.status === 'AVAILABLE'
                                    ? 'border-gray-300 hover:border-red-500 hover:text-red-500'
                                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                              >
                                <span className="font-medium">{showtime.startTime.substring(0, 5)}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar - Right */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow sticky top-24">
              <div className="p-4 border-b bg-red-500 text-white rounded-t-lg">
                <h3 className="font-bold">Thông tin đặt vé</h3>
              </div>

              <div className="p-4 space-y-4">
                {selectedMovie ? (
                  <>
                    {/* Movie Info */}
                    <div className="flex gap-3">
                      <img
                        src={selectedMovie.posterUrl || '/placeholder-movie.jpg'}
                        alt={selectedMovie.title}
                        className="w-20 rounded shadow"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{selectedMovie.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{selectedMovie.duration} phút</p>
                        {selectedMovie.ageRating && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                            {selectedMovie.ageRating}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selected Info */}
                    <div className="border-t pt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ngày:</span>
                        <span className="font-medium">
                          {selectedDate ? formatDate(selectedDate) : 'Chưa chọn'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Khu vực:</span>
                        <span className="font-medium">
                          {selectedRegion?.name || 'Chưa chọn'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Định dạng:</span>
                        <span className="font-medium">
                          {ROOM_TYPE_LABELS[selectedRoomType] || selectedRoomType}
                        </span>
                      </div>
                    </div>

                    {/* Help Text */}
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500 text-center">
                        Chọn suất chiếu bên trái để tiếp tục đặt vé
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <p className="text-sm">Vui lòng chọn phim</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingFlowLoading() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-gray-300 border-t-red-500 rounded-full"></div>
    </div>
  );
}

export default function BookingFlowPage() {
  return (
    <Suspense fallback={<BookingFlowLoading />}>
      <BookingFlowContent />
    </Suspense>
  );
}
