'use client';

import { useState, useMemo } from 'react';
import {
  AutoSchedulePreviewResponse,
  TheaterSchedulePreview,
  DateSchedulePreview,
  SlotPreview,
  ConflictDetail,
} from '@/services/autoScheduleService';

const DAY_TYPE_LABELS: Record<string, string> = {
  WEEKDAY: 'Ngày thường',
  WEEKEND: 'Cuối tuần',
  HOLIDAY: 'Ngày lễ',
};

const DAY_TYPE_COLORS: Record<string, string> = {
  WEEKDAY: 'bg-gray-100 text-gray-700',
  WEEKEND: 'bg-orange-100 text-orange-700',
  HOLIDAY: 'bg-red-100 text-red-700',
};

interface Props {
  previewData: AutoSchedulePreviewResponse | null;
  isExecuting: boolean;
  onExecute: () => void;
}

export default function StepPreviewConfirm({ previewData, isExecuting, onExecute }: Props) {
  const [expandedTheaters, setExpandedTheaters] = useState<Set<number>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [showConflicts, setShowConflicts] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [viewMode, setViewMode] = useState<'grouped' | 'timeline'>('grouped');

  if (!previewData) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>Quay lại bước trước và nhấn &quot;Tiếp theo&quot; để xem preview</p>
      </div>
    );
  }

  const toggleTheater = (theaterId: number) => {
    setExpandedTheaters((prev) => {
      const next = new Set(prev);
      next.has(theaterId) ? next.delete(theaterId) : next.add(theaterId);
      return next;
    });
  };

  const toggleDate = (key: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const theaters = new Set(previewData.byTheater.map((t) => t.theaterId));
    const dates = new Set<string>();
    previewData.byTheater.forEach((t) =>
      t.byDate.forEach((d) => dates.add(`${t.theaterId}_${d.date}`))
    );
    setExpandedTheaters(theaters);
    setExpandedDates(dates);
  };

  const collapseAll = () => {
    setExpandedTheaters(new Set());
    setExpandedDates(new Set());
  };

  // Color palette for movies
  const movieColors = useMemo(() => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-300',
      'bg-green-100 text-green-800 border-green-300',
      'bg-purple-100 text-purple-800 border-purple-300',
      'bg-yellow-100 text-yellow-800 border-yellow-300',
      'bg-pink-100 text-pink-800 border-pink-300',
      'bg-indigo-100 text-indigo-800 border-indigo-300',
      'bg-teal-100 text-teal-800 border-teal-300',
      'bg-orange-100 text-orange-800 border-orange-300',
      'bg-cyan-100 text-cyan-800 border-cyan-300',
      'bg-rose-100 text-rose-800 border-rose-300',
    ];
    const map: Record<number, string> = {};
    let idx = 0;
    previewData.byTheater.forEach((t) =>
      t.byDate.forEach((d) =>
        d.slots.forEach((s) => {
          if (!(s.movieId in map)) {
            map[s.movieId] = colors[idx % colors.length];
            idx++;
          }
        })
      )
    );
    return map;
  }, [previewData]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Tổng suất chiếu"
          value={previewData.totalShowtimes}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <SummaryCard
          label="Rạp chiếu"
          value={previewData.byTheater.length}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <SummaryCard
          label="Xung đột bỏ qua"
          value={previewData.totalConflictsSkipped}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <SummaryCard
          label="Cảnh báo"
          value={previewData.totalWarnings}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
      </div>

      {/* Conflicts & Warnings */}
      {previewData.conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <button
            onClick={() => setShowConflicts(!showConflicts)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-bold text-red-800">
              ⚠ {previewData.conflicts.length} xung đột đã bỏ qua
            </h3>
            <svg
              className={`w-5 h-5 text-red-600 transition-transform ${showConflicts ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showConflicts && (
            <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
              {previewData.conflicts.map((c, i) => (
                <div key={i} className="text-sm text-red-700 bg-white rounded px-3 py-2 border border-red-100">
                  <span className="font-medium">{c.theaterName}</span> — {c.roomName} — {c.date} {c.slotTime}
                  <br />
                  <span className="text-xs text-red-500">{c.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {previewData.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <button
            onClick={() => setShowWarnings(!showWarnings)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-bold text-amber-800">
              💡 {previewData.warnings.length} cảnh báo
            </h3>
            <svg
              className={`w-5 h-5 text-amber-600 transition-transform ${showWarnings ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showWarnings && (
            <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
              {previewData.warnings.map((w, i) => (
                <div key={i} className="text-sm text-amber-700 bg-white rounded px-3 py-1.5 border border-amber-100">
                  {w}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Preview */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Lịch chiếu dự kiến</h2>
          <div className="flex gap-2">
            <button onClick={expandAll} className="text-xs text-blue-600 hover:underline">
              Mở rộng tất cả
            </button>
            <span className="text-gray-300">|</span>
            <button onClick={collapseAll} className="text-xs text-gray-500 hover:underline">
              Thu gọn
            </button>
          </div>
        </div>

        <div className="divide-y">
          {previewData.byTheater.map((theater) => (
            <div key={theater.theaterId}>
              {/* Theater header */}
              <button
                onClick={() => toggleTheater(theater.theaterId)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedTheaters.has(theater.theaterId) ? 'rotate-90' : ''
                    }`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-bold text-gray-900">{theater.theaterName}</span>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {theater.showtimeCount} suất chiếu
                </span>
              </button>

              {/* Expanded: dates */}
              {expandedTheaters.has(theater.theaterId) && (
                <div className="pl-6 pr-4 pb-3">
                  {theater.byDate.map((dateP) => {
                    const dateKey = `${theater.theaterId}_${dateP.date}`;
                    return (
                      <div key={dateP.date} className="border-l-2 border-gray-200 ml-2 mb-2">
                        <button
                          onClick={() => toggleDate(dateKey)}
                          className="w-full flex items-center justify-between pl-4 py-2 hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <svg
                              className={`w-3 h-3 text-gray-400 transition-transform ${
                                expandedDates.has(dateKey) ? 'rotate-90' : ''
                              }`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="font-medium text-gray-800 text-sm">
                              {formatDate(dateP.date)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${DAY_TYPE_COLORS[dateP.dayType] || ''}`}>
                              {DAY_TYPE_LABELS[dateP.dayType] || dateP.dayType}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{dateP.showtimeCount} suất</span>
                        </button>

                        {expandedDates.has(dateKey) && (
                          <div className="pl-8 pr-2 pb-2">
                            {/* Timeline mini view */}
                            <div className="space-y-1">
                              {groupSlotsByRoom(dateP.slots).map(([roomName, roomSlots]) => (
                                <div key={roomName} className="flex items-start gap-2">
                                  <span className="text-xs text-gray-500 w-20 flex-shrink-0 pt-1 text-right">
                                    {roomName}
                                  </span>
                                  <div className="flex flex-wrap gap-1 flex-1">
                                    {roomSlots.map((slot, idx) => (
                                      <div
                                        key={idx}
                                        className={`px-2 py-1 rounded text-xs border ${movieColors[slot.movieId] || 'bg-gray-100 text-gray-700'}`}
                                        title={`${slot.movieTitle} (${slot.movieDuration}ph)\n${slot.startTime} - ${slot.endTime}`}
                                      >
                                        <span className="font-mono">{slot.startTime}</span>
                                        <span className="mx-1">·</span>
                                        <span className="truncate max-w-[120px] inline-block align-bottom">
                                          {slot.movieTitle}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {previewData.byTheater.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              Không có suất chiếu nào được tạo. Kiểm tra lại cấu hình.
            </div>
          )}
        </div>
      </div>

      {/* Final confirmation */}
      {previewData.totalShowtimes > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-green-800 mb-2">
            Sẵn sàng tạo {previewData.totalShowtimes} suất chiếu
          </h3>
          <p className="text-sm text-green-600 mb-4">
            Sau khi xác nhận, các suất chiếu sẽ được lưu vào hệ thống. Hành động này sẽ được ghi vào nhật ký.
          </p>
          <button
            onClick={onExecute}
            disabled={isExecuting}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold text-lg
              hover:bg-green-700 disabled:opacity-50 transition-colors shadow-lg"
          >
            {isExecuting ? 'Đang lưu...' : '✓ Xác nhận & Lưu tất cả'}
          </button>
        </div>
      )}
    </div>
  );
}

// ===================== Helpers =====================

function SummaryCard({
  label,
  value,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-xl p-4`}>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function groupSlotsByRoom(slots: SlotPreview[]): [string, SlotPreview[]][] {
  const map: Record<string, SlotPreview[]> = {};
  for (const slot of slots) {
    const key = slot.roomName;
    if (!map[key]) map[key] = [];
    map[key].push(slot);
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}
