'use client';

import { useState, useEffect, useMemo } from 'react';
import { Showtime, Region, Theater } from '@/types';
import { showtimeService } from '@/services/showtimeService';
import { theaterService, regionService } from '@/services/theaterService';
import { formatCurrency } from '@/lib/utils';

interface ShowtimeSelectorProps {
  movieId: number;
  onSelect: (showtime: Showtime) => void;
}

// Định dạng phim labels
const ROOM_TYPE_LABELS: Record<string, string> = {
  'STANDARD_2D': '2D Phụ Đề Việt',
  'STANDARD_3D': '3D Phụ Đề Việt',
  'IMAX': 'IMAX Phụ Đề Việt',
  'IMAX_3D': 'IMAX3D Phụ Đề Việt',
  'VIP_4DX': '4DX3D Phụ Đề Việt',
  'SCREENX_3D': 'SCREENX-3D Phụ Đề Việt',
  'ULTRA_4DX': 'ULTRA 4DX-SCX3D Vietnam Sub',
};

export default function ShowtimeSelector({ movieId, onSelect }: ShowtimeSelectorProps) {
  // Data state
  const [regions, setRegions] = useState<Region[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  
  // Selection state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  
  // Loading
  const [loading, setLoading] = useState(false);

  // Generate dates (30 days)
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
    fetchRegions();
    setSelectedDate(dates[0]?.date || '');
  }, []);

  // Fetch showtimes when date or region changes
  useEffect(() => {
    if (selectedDate && selectedRegion) {
      fetchShowtimes();
    }
  }, [selectedDate, selectedRegion, movieId]);

  const fetchRegions = async () => {
    try {
      const data = await regionService.getAllRegions();
      setRegions(data);
      if (data.length > 0) {
        setSelectedRegion(data[0]);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchShowtimes = async () => {
    if (!selectedRegion || !selectedDate) return;
    
    try {
      setLoading(true);
      
      // Get theaters in region
      const theatersData = await theaterService.getTheatersByRegion(selectedRegion.id);
      setTheaters(theatersData);
      
      // Get showtimes for movie and date
      const showtimesData = await showtimeService.getShowtimesByMovieAndDate(movieId, selectedDate);
      
      // Filter by theaters in region
      const theaterIds = theatersData.map(t => t.id);
      const filteredShowtimes = showtimesData.filter(s => theaterIds.includes(s.theaterId));
      
      setShowtimes(filteredShowtimes);
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      setShowtimes([]);
    } finally {
      setLoading(false);
    }
  };

  // Get available room types
  const availableRoomTypes = useMemo(() => {
    const types = new Set(showtimes.map(s => s.roomType));
    return Array.from(types);
  }, [showtimes]);

  // Filter showtimes by room type
  const filteredShowtimes = useMemo(() => {
    if (selectedRoomType === 'all') return showtimes;
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
        const roomKey = `Rạp ${showtime.roomType}`;
        if (!grouped[showtime.theaterName].rooms[roomKey]) {
          grouped[showtime.theaterName].rooms[roomKey] = [];
        }
        grouped[showtime.theaterName].rooms[roomKey].push(showtime);
      }
    });
    
    // Sort by start time
    Object.values(grouped).forEach(theater => {
      Object.values(theater.rooms).forEach(showtimes => {
        showtimes.sort((a, b) => a.startTime.localeCompare(b.startTime));
      });
    });
    
    return grouped;
  }, [filteredShowtimes, theaters]);

  return (
    <div className="space-y-6">
      {/* Date Selector - Calendar Style */}
      <div>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1 min-w-max">
            {dates.map((d, idx) => {
              const isSelected = selectedDate === d.date;
              const isToday = idx === 0;
              
              return (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`flex flex-col items-center px-3 py-2 rounded transition-colors min-w-[56px] ${
                    isSelected
                      ? 'bg-red-500 text-white'
                      : isToday
                      ? 'bg-red-100 hover:bg-red-200'
                      : 'hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                    {d.month < 10 ? `0${d.month}` : d.month}
                  </span>
                  <span className="text-lg font-bold">{d.day}</span>
                  <span className={`text-xs ${
                    isSelected ? 'text-white' : 
                    d.dayName === 'CN' ? 'text-red-500' : 
                    d.dayName === 'T7' ? 'text-blue-500' : ''
                  }`}>
                    {d.dayName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Region Tabs */}
      <div>
        <div className="flex flex-wrap gap-2 border-b pb-3">
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region)}
              className={`px-4 py-2 text-sm rounded-t transition-colors ${
                selectedRegion?.id === region.id
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
        <div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedRoomType('all')}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                selectedRoomType === 'all'
                  ? 'bg-amber-100 border-amber-400 text-amber-800'
                  : 'border-gray-300 text-gray-600 hover:border-amber-400'
              }`}
            >
              Tất cả
            </button>
            {availableRoomTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedRoomType(type)}
                className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                  selectedRoomType === type
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

      {/* Showtimes */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg p-4 border">
              <div className="h-6 bg-gray-300 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-3"></div>
              <div className="flex gap-2">
                <div className="h-10 bg-gray-300 rounded w-16"></div>
                <div className="h-10 bg-gray-300 rounded w-16"></div>
                <div className="h-10 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(showtimesByTheater).length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Không có suất chiếu nào cho ngày và khu vực đã chọn</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(showtimesByTheater).map(([theaterName, { theater, rooms }]) => (
            <div key={theaterName} className="bg-white rounded-lg border overflow-hidden">
              {/* Theater Header */}
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {theaterName}
                </h3>
              </div>
              
              {/* Room Showtimes */}
              <div className="p-4 space-y-4">
                {Object.entries(rooms).map(([roomKey, roomShowtimes]) => (
                  <div key={roomKey}>
                    <p className="text-sm font-medium text-gray-600 mb-2">{roomKey}</p>
                    <div className="flex flex-wrap gap-2">
                      {roomShowtimes.map((showtime) => (
                        <button
                          key={showtime.id}
                          onClick={() => onSelect(showtime)}
                          disabled={showtime.status !== 'AVAILABLE'}
                          className={`px-4 py-2 border rounded transition-colors ${
                            showtime.status === 'AVAILABLE'
                              ? 'border-gray-300 hover:border-red-500 hover:text-red-500 hover:bg-red-50'
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
          ))}
        </div>
      )}
    </div>
  );
}
