'use client';

import { useState, useEffect } from 'react';
import { GroupedTheaterResponse, CityGroup, TheaterSummary } from '@/types';
import { theaterService } from '@/services/theaterService';

interface CinemaSelectorProps {
  onSelectTheater: (theater: TheaterSummary, cityName?: string) => void;
  selectedTheaterId?: number;
}

export default function CinemaSelector({ onSelectTheater, selectedTheaterId }: CinemaSelectorProps) {
  const [cinemaData, setCinemaData] = useState<GroupedTheaterResponse | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCinemas();
  }, []);

  const fetchCinemas = async () => {
    try {
      setLoading(true);
      const data = await theaterService.getTheatersGroupedByCity();
      setCinemaData(data);

      if (data.cities.length > 0) {
        setSelectedCity(data.cities[0]);
      }
    } catch (err) {
      console.error('Error fetching cinemas:', err);
      setError('Không thể tải danh sách rạp');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-10 text-center">
        <div className="animate-spin w-10 h-10 border-3 border-zinc-200 border-t-red-600 rounded-full mx-auto"></div>
        <p className="text-zinc-500 mt-4">Đang tải danh sách rạp...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-10 text-center">
        <svg className="w-16 h-16 text-red-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button
          onClick={fetchCinemas}
          className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="flex min-h-[300px]">
        {/* Cities List */}
        <div className="w-1/3 bg-zinc-50 border-r border-zinc-200">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">Thành Phố</h3>
            <div className="space-y-1">
              {cinemaData?.cities.map((city) => (
                <button
                  key={city.cityCode}
                  onClick={() => setSelectedCity(city)}
                  className={`
                    w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-left flex items-center justify-between
                    ${selectedCity?.cityCode === city.cityCode
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-zinc-700 hover:bg-zinc-100'}
                  `}
                >
                  <span>{city.cityName}</span>
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${selectedCity?.cityCode === city.cityCode
                      ? 'bg-red-500 text-white'
                      : 'bg-zinc-200 text-zinc-600'}
                  `}>
                    {city.theaters.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Theaters List */}
        <div className="w-2/3 bg-white">
          {selectedCity && (
            <div className="p-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">
                Rạp tại {selectedCity.cityName}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedCity.theaters.map((theater) => (
                  <button
                    key={theater.id}
                    onClick={() => onSelectTheater(theater, selectedCity.cityName)}
                    className={`
                      p-4 rounded-lg transition-all duration-200 text-left border-2
                      ${selectedTheaterId === theater.id
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-white border-zinc-100 hover:border-red-300 hover:shadow-md text-zinc-700'}
                    `}
                  >
                    <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                      {selectedTheaterId === theater.id && (
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {theater.name}
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2">{theater.address}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
