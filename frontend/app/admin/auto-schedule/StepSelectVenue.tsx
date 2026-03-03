'use client';

import { useMemo } from 'react';
import { Theater } from '@/types';

interface Props {
  theaters: Theater[];
  selectedTheaterIds: number[];
  setSelectedTheaterIds: (ids: number[]) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  holidayDates: string[];
  setHolidayDates: (dates: string[]) => void;
}

export default function StepSelectVenue({
  theaters,
  selectedTheaterIds,
  setSelectedTheaterIds,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  holidayDates,
  setHolidayDates,
}: Props) {
  // Group theaters by city
  const theatersByCity = useMemo(() => {
    const map: Record<string, Theater[]> = {};
    for (const t of theaters) {
      const city = t.cityName || 'Khác';
      if (!map[city]) map[city] = [];
      map[city].push(t);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [theaters]);

  const toggleTheater = (id: number) => {
    setSelectedTheaterIds(
      selectedTheaterIds.includes(id)
        ? selectedTheaterIds.filter((x) => x !== id)
        : [...selectedTheaterIds, id]
    );
  };

  const selectAll = () => {
    setSelectedTheaterIds(theaters.filter(t => t.active).map((t) => t.id));
  };

  const deselectAll = () => {
    setSelectedTheaterIds([]);
  };

  const selectCity = (city: string) => {
    const cityTheaters = theatersByCity.find(([c]) => c === city)?.[1] || [];
    const cityIds = cityTheaters.filter((t) => t.active).map((t) => t.id);
    const newIds = [...new Set([...selectedTheaterIds, ...cityIds])];
    setSelectedTheaterIds(newIds);
  };

  // Summary calculation
  const dateSummary = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return null;
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    let weekdays = 0, weekends = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      if (dow === 0 || dow === 6) weekends++;
      else weekdays++;
    }
    return { days, weekdays, weekends, holidays: holidayDates.length };
  }, [startDate, endDate, holidayDates]);

  const toggleHoliday = (dateStr: string) => {
    setHolidayDates(
      holidayDates.includes(dateStr)
        ? holidayDates.filter((d) => d !== dateStr)
        : [...holidayDates, dateStr]
    );
  };

  // Generate date list for holiday picker
  const dateList = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return [];
    const dates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [startDate, endDate]);

  const DOW_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Theater Selection */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Chọn rạp chiếu</h2>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">
              Chọn tất cả
            </button>
            <span className="text-gray-300">|</span>
            <button onClick={deselectAll} className="text-xs text-red-600 hover:underline">
              Bỏ chọn tất cả
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          Đã chọn <span className="font-bold text-blue-600">{selectedTheaterIds.length}</span> rạp
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {theatersByCity.map(([city, cityTheaters]) => (
            <div key={city} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700 text-sm">{city}</h3>
                <button
                  onClick={() => selectCity(city)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Chọn tất cả {city}
                </button>
              </div>
              <div className="space-y-1">
                {cityTheaters.map((theater) => (
                  <label
                    key={theater.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedTheaterIds.includes(theater.id)
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    } ${!theater.active ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTheaterIds.includes(theater.id)}
                      onChange={() => toggleTheater(theater.id)}
                      disabled={!theater.active}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{theater.name}</div>
                      <div className="text-xs text-gray-500 truncate">{theater.address}</div>
                    </div>
                    <span className="text-xs text-gray-400">{theater.totalRooms} phòng</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {theatersByCity.length === 0 && (
            <div className="text-center text-gray-400 py-8">Không có rạp nào</div>
          )}
        </div>
      </div>

      {/* Right: Date Configuration */}
      <div className="space-y-6">
        {/* Date Range */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Khoảng thời gian</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {dateSummary && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <div className="font-medium text-blue-800">
                Tổng: {dateSummary.days} ngày
              </div>
              <div className="text-blue-600 mt-1 flex gap-4 flex-wrap">
                <span>{dateSummary.weekdays} ngày thường</span>
                <span>{dateSummary.weekends} cuối tuần</span>
                {dateSummary.holidays > 0 && (
                  <span className="text-red-600">{dateSummary.holidays} ngày lễ</span>
                )}
              </div>
            </div>
          )}

          {dateSummary && dateSummary.days > 30 && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              ⚠ Khoảng thời gian tối đa là 30 ngày
            </div>
          )}
        </div>

        {/* Holiday Picker */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Đánh dấu ngày lễ</h2>
          <p className="text-xs text-gray-500 mb-4">
            Nhấn vào ngày để đánh dấu là ngày lễ. Ngày lễ sẽ dùng template riêng (nếu có).
          </p>

          {dateList.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {dateList.map((dateStr) => {
                const d = new Date(dateStr);
                const dow = d.getDay();
                const isWeekend = dow === 0 || dow === 6;
                const isHoliday = holidayDates.includes(dateStr);
                return (
                  <button
                    key={dateStr}
                    onClick={() => toggleHoliday(dateStr)}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors border ${
                      isHoliday
                        ? 'bg-red-100 border-red-300 text-red-700'
                        : isWeekend
                          ? 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                    title={isHoliday ? 'Bỏ đánh dấu ngày lễ' : 'Đánh dấu ngày lễ'}
                  >
                    <div>{DOW_LABELS[dow]}</div>
                    <div>{d.getDate()}/{d.getMonth() + 1}</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-400 text-center py-4">
              Chọn khoảng thời gian trước để xem lịch
            </div>
          )}
        </div>

        {/* Quick Summary Card */}
        {selectedTheaterIds.length > 0 && dateSummary && (
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <h3 className="font-bold text-lg mb-2">Tóm tắt cấu hình</h3>
            <div className="space-y-1 text-sm text-blue-100">
              <div>🏢 {selectedTheaterIds.length} rạp chiếu</div>
              <div>📅 {dateSummary.days} ngày ({startDate} → {endDate})</div>
              <div>
                📊 {dateSummary.weekdays} ngày thường, {dateSummary.weekends} cuối tuần
                {dateSummary.holidays > 0 && `, ${dateSummary.holidays} ngày lễ`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
