'use client';

import { useState, useEffect, useMemo } from 'react';
import { CinemaScheduleResponse, MovieSchedule } from '@/types';
import { cinemaService } from '@/services/cinemaService';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ShowtimeScheduleProps {
  theaterId: number;
}

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getDayOfWeek = (date: Date): string => {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[date.getDay()];
};

const getDayMonth = (date: Date): string => {
  return `${date.getDate()}`;
};

const getMonthName = (date: Date): string => {
  return `Tháng ${date.getMonth() + 1}`;
};

const generateDateRange = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const getAgeRatingColor = (rating?: string): string => {
  if (!rating) return 'bg-green-600';
  const r = rating.toUpperCase();
  if (r.includes('18') || r === 'C18') return 'bg-red-600';
  if (r.includes('16') || r === 'C16') return 'bg-orange-600';
  if (r.includes('13') || r === 'C13') return 'bg-yellow-600';
  return 'bg-green-600';
};

export default function ShowtimeSchedule({ theaterId }: ShowtimeScheduleProps) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<CinemaScheduleResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateRange = useMemo(() => generateDateRange(), []);

  useEffect(() => {
    fetchSchedule();
  }, [theaterId, selectedDate]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cinemaService.getCinemaSchedule(theaterId, formatDate(selectedDate));
      setSchedule(data);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError('Không thể tải lịch chiếu');
    } finally {
      setLoading(false);
    }
  };

  const handleShowtimeClick = (showtimeId: number) => {
    router.push(`/booking?showtimeId=${showtimeId}`);
  };

  const scrollDates = (direction: 'left' | 'right') => {
    const container = document.getElementById('date-scroll-container');
    if (container) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Lịch Chiếu Phim
        </h2>
        <p className="text-zinc-400 text-sm mt-1">{getMonthName(selectedDate)}, {selectedDate.getFullYear()}</p>
      </div>

      {/* Date Picker */}
      <div className="relative bg-zinc-50 border-b border-zinc-200">
        <button 
          onClick={() => scrollDates('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg border border-zinc-200 rounded-full flex items-center justify-center hover:bg-zinc-50 transition-colors"
        >
          <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div 
          id="date-scroll-container"
          className="flex overflow-x-auto scrollbar-hide px-12 py-4 gap-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {dateRange.map((date, index) => {
            const isSelected = formatDate(date) === formatDate(selectedDate);
            const isToday = index === 0;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            return (
              <button
                key={formatDate(date)}
                onClick={() => setSelectedDate(date)}
                className={`
                  flex flex-col items-center min-w-[70px] px-3 py-3 rounded-xl transition-all duration-200
                  ${isSelected
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : isWeekend 
                      ? 'bg-white text-red-600 hover:bg-red-50 border border-zinc-200'
                      : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'}
                `}
              >
                <span className={`text-xs font-medium ${isSelected ? 'text-red-200' : isWeekend ? 'text-red-400' : 'text-zinc-400'}`}>
                  {isToday ? 'Hôm nay' : getDayOfWeek(date)}
                </span>
                <span className="text-xl font-bold mt-1">{getDayMonth(date)}</span>
              </button>
            );
          })}
        </div>

        <button 
          onClick={() => scrollDates('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg border border-zinc-200 rounded-full flex items-center justify-center hover:bg-zinc-50 transition-colors"
        >
          <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Schedule Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin w-10 h-10 border-3 border-zinc-200 border-t-red-600 rounded-full mb-4"></div>
            <p className="text-zinc-500">Đang tải lịch chiếu...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-red-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-500 mb-4 font-medium">{error}</p>
            <button 
              onClick={fetchSchedule}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Thử lại
            </button>
          </div>
        ) : !schedule?.movies || schedule.movies.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-20 h-20 text-zinc-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <p className="text-zinc-500 text-lg">Không có lịch chiếu trong ngày này</p>
            <p className="text-zinc-400 text-sm mt-2">Vui lòng chọn ngày khác</p>
          </div>
        ) : (
          <div className="space-y-8">
            {schedule.movies.map((movie) => (
              <MovieScheduleCard 
                key={movie.movieId} 
                movie={movie} 
                onShowtimeClick={handleShowtimeClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface MovieScheduleCardProps {
  movie: MovieSchedule;
  onShowtimeClick: (showtimeId: number) => void;
}

function MovieScheduleCard({ movie, onShowtimeClick }: MovieScheduleCardProps) {
  return (
    <div className="bg-zinc-50 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2 mb-5">
        <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-wide flex-1">
          {movie.movieTitle}
        </h3>
        {movie.ageRating && (
          <span className={`px-2.5 py-1 text-xs font-bold text-white rounded-md ${getAgeRatingColor(movie.ageRating)}`}>
            {movie.ageRating}
          </span>
        )}
      </div>

      <div className="flex gap-5">
        {movie.posterUrl && (
          <div className="relative w-28 h-40 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
            <Image
              src={movie.posterUrl}
              alt={movie.movieTitle}
              fill
              className="object-cover"
              sizes="112px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <div className="flex-1 space-y-5">
          {movie.formats.map((format, formatIndex) => (
            <div key={formatIndex}>
              <p className="text-sm text-zinc-500 mb-3 font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {format.format}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {format.showtimes.map((slot) => (
                  <button
                    key={slot.showtimeId}
                    onClick={() => onShowtimeClick(slot.showtimeId)}
                    disabled={slot.status !== 'AVAILABLE'}
                    className={`
                      group relative px-5 py-2.5 text-sm font-semibold border-2 rounded-lg transition-all duration-200
                      ${slot.status === 'AVAILABLE'
                        ? 'border-zinc-300 bg-white text-zinc-700 hover:border-red-500 hover:text-red-500 hover:shadow-md hover:-translate-y-0.5'
                        : 'border-zinc-200 text-zinc-400 bg-zinc-100 cursor-not-allowed'}
                    `}
                  >
                    {slot.startTime.substring(0, 5)}
                    {slot.status === 'AVAILABLE' && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
