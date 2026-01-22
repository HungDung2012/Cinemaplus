'use client';

import { useState } from 'react';
import { TheaterSummary, CityGroup } from '@/types';
import { CinemaSelector, CinemaHeader, ShowtimeSchedule } from './components';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function TheatersPage() {
  const [selectedTheater, setSelectedTheater] = useState<TheaterSummary | null>(null);
  const [selectedCityName, setSelectedCityName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleSelectTheater = (theater: TheaterSummary, cityName?: string) => {
    setSelectedTheater(theater);
    if (cityName) {
      setSelectedCityName(cityName);
    }
    // Scroll to detail section
    setTimeout(() => {
      document.getElementById('cinema-detail')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Tạo danh sách 14 ngày tiếp theo
  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white text-center">Hệ Thống Rạp Chiếu Phim</h1>
          <p className="text-zinc-400 text-center mt-2">Chọn rạp và xem lịch chiếu phim</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Cinema Selector */}
        <div className="mb-8">
          <CinemaSelector 
            onSelectTheater={handleSelectTheater}
            selectedTheaterId={selectedTheater?.id}
          />
        </div>

        {/* Selected Cinema Detail & Schedule */}
        {selectedTheater && (
          <div id="cinema-detail" className="space-y-8">
            {/* Cinema Header with Map */}
            <CinemaHeader theater={selectedTheater} cityName={selectedCityName} />

            {/* Date Selector */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Chọn ngày chiếu</h3>
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                {dates.map((date) => {
                  const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`
                        flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-lg border-2 transition-all
                        ${isSelected 
                          ? 'border-blue-600 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-blue-300 text-gray-600 hover:bg-gray-50'}
                      `}
                    >
                      <span className="text-xs font-medium uppercase">
                        {format(date, 'EEE', { locale: vi })}
                      </span>
                      <span className="text-2xl font-bold">
                        {format(date, 'dd')}
                      </span>
                      <span className="text-xs">
                        {format(date, 'MM')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Showtime Schedule */}
            <ShowtimeSchedule theaterId={selectedTheater.id} dates={selectedDate} />
          </div>
        )}

        {/* Placeholder when no theater selected */}
        {!selectedTheater && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="w-24 h-24 text-zinc-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-xl font-semibold text-zinc-700 mb-2">Chọn rạp để xem lịch chiếu</h3>
            <p className="text-zinc-500">Vui lòng chọn thành phố và rạp chiếu phim từ bảng chọn phía trên</p>
          </div>
        )}
      </div>
    </div>
  );
}
