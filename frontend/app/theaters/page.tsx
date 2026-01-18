'use client';

import { useState } from 'react';
import { TheaterSummary, CityGroup } from '@/types';
import { CinemaSelector, CinemaHeader, ShowtimeSchedule } from './components';

export default function TheatersPage() {
  const [selectedTheater, setSelectedTheater] = useState<TheaterSummary | null>(null);
  const [selectedCityName, setSelectedCityName] = useState<string>('');

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

            {/* Showtime Schedule */}
            <ShowtimeSchedule theaterId={selectedTheater.id} />
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
