'use client';

import { useState, useMemo } from 'react';
import { Movie } from '@/types';
import {
  MovieSelection,
  ScheduleTemplate,
  DayType,
} from '@/services/autoScheduleService';
import TemplateManagerModal from './TemplateManagerModal';

const ROOM_TYPES = [
  { value: 'STANDARD_2D', label: '2D' },
  { value: 'STANDARD_3D', label: '3D' },
  { value: 'IMAX', label: 'IMAX' },
  { value: 'IMAX_3D', label: 'IMAX 3D' },
  { value: 'VIP_4DX', label: '4DX' },
];

const DAY_TYPE_LABELS: Record<DayType, string> = {
  WEEKDAY: 'Ngày thường',
  WEEKEND: 'Cuối tuần',
  HOLIDAY: 'Ngày lễ',
};

interface Props {
  movies: Movie[];
  movieSelections: MovieSelection[];
  setMovieSelections: (sel: MovieSelection[]) => void;
  templates: ScheduleTemplate[];
  templateId: number | null;
  setTemplateId: (id: number | null) => void;
  weekdayTemplateId: number | null;
  setWeekdayTemplateId: (id: number | null) => void;
  weekendTemplateId: number | null;
  setWeekendTemplateId: (id: number | null) => void;
  holidayTemplateId: number | null;
  setHolidayTemplateId: (id: number | null) => void;
  maxConcurrentScreenings: number;
  setMaxConcurrentScreenings: (n: number) => void;
  reloadTemplates: () => Promise<void>;
}

export default function StepConfigureSchedule({
  movies,
  movieSelections,
  setMovieSelections,
  templates,
  templateId,
  setTemplateId,
  weekdayTemplateId,
  setWeekdayTemplateId,
  weekendTemplateId,
  setWeekendTemplateId,
  holidayTemplateId,
  setHolidayTemplateId,
  maxConcurrentScreenings,
  setMaxConcurrentScreenings,
  reloadTemplates,
}: Props) {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [useAdvancedTemplates, setUseAdvancedTemplates] = useState(false);

  const selectedMovieIds = useMemo(
    () => new Set(movieSelections.map((s) => s.movieId)),
    [movieSelections]
  );

  const toggleMovie = (movieId: number) => {
    if (selectedMovieIds.has(movieId)) {
      setMovieSelections(movieSelections.filter((s) => s.movieId !== movieId));
    } else {
      setMovieSelections([
        ...movieSelections,
        { movieId, priority: 3, preferredRoomTypes: [], excludeRoomIds: [] },
      ]);
    }
  };

  const selectAllMovies = () => {
    const all: MovieSelection[] = movies.map((m) => ({
      movieId: m.id,
      priority: 3,
      preferredRoomTypes: [],
      excludeRoomIds: [],
    }));
    setMovieSelections(all);
  };

  const updateMovieSelection = (movieId: number, updates: Partial<MovieSelection>) => {
    setMovieSelections(
      movieSelections.map((s) => (s.movieId === movieId ? { ...s, ...updates } : s))
    );
  };

  // Selected template preview
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Movie Selection */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Chọn phim</h2>
          <div className="flex gap-2">
            <button
              onClick={selectAllMovies}
              className="text-xs text-blue-600 hover:underline"
            >
              Chọn tất cả
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => setMovieSelections([])}
              className="text-xs text-red-600 hover:underline"
            >
              Bỏ chọn
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-3">
          Đã chọn <span className="font-bold text-blue-600">{movieSelections.length}</span> phim
          ({movies.length} đang chiếu)
        </div>

        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-2">
          {movies.map((movie) => {
            const isSelected = selectedMovieIds.has(movie.id);
            const selection = movieSelections.find((s) => s.movieId === movie.id);

            return (
              <div
                key={movie.id}
                className={`border rounded-lg transition-colors ${
                  isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {/* Movie header row */}
                <label className="flex items-center gap-3 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleMovie(movie.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  {movie.posterUrl && (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-10 h-14 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{movie.title}</div>
                    <div className="text-xs text-gray-500">
                      {movie.duration} phút • {movie.genre || 'N/A'} • ⭐ {movie.rating || 'N/A'}
                    </div>
                  </div>
                </label>

                {/* Expanded config when selected */}
                {isSelected && selection && (
                  <div className="px-3 pb-3 border-t border-blue-200 pt-2 space-y-2">
                    {/* Priority */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-16">Ưu tiên:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((p) => (
                          <button
                            key={p}
                            onClick={() => updateMovieSelection(movie.id, { priority: p })}
                            className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                              selection.priority === p
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {selection.priority <= 2 ? 'Thấp' : selection.priority === 3 ? 'Trung bình' : 'Cao'}
                      </span>
                    </div>

                    {/* Room type preference */}
                    <div className="flex items-start gap-3">
                      <span className="text-xs text-gray-600 w-16 pt-1">Loại phòng:</span>
                      <div className="flex flex-wrap gap-1">
                        {ROOM_TYPES.map((rt) => {
                          const isChosen = selection.preferredRoomTypes?.includes(rt.value);
                          return (
                            <button
                              key={rt.value}
                              onClick={() => {
                                const current = selection.preferredRoomTypes || [];
                                const updated = isChosen
                                  ? current.filter((v) => v !== rt.value)
                                  : [...current, rt.value];
                                updateMovieSelection(movie.id, { preferredRoomTypes: updated });
                              }}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                isChosen
                                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                                  : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                              }`}
                            >
                              {rt.label}
                            </button>
                          );
                        })}
                        <span className="text-xs text-gray-400 self-center ml-1">
                          {(!selection.preferredRoomTypes || selection.preferredRoomTypes.length === 0) && '(Tất cả)'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {movies.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              Không có phim đang chiếu
            </div>
          )}
        </div>
      </div>

      {/* Right: Template & Config */}
      <div className="space-y-6">
        {/* Template Selection */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Template giờ chiếu</h2>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Quản lý Template
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Chưa có template nào.</p>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                Tạo template đầu tiên →
              </button>
            </div>
          ) : (
            <>
              {/* Simple mode: one template for all */}
              {!useAdvancedTemplates && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template chung
                  </label>
                  <select
                    value={templateId ?? ''}
                    onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn template --</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({DAY_TYPE_LABELS[t.dayType]}) — {t.slots.length} khung giờ
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Advanced mode: template per day type */}
              {useAdvancedTemplates && (
                <div className="space-y-3">
                  {[
                    { label: 'Ngày thường', value: weekdayTemplateId, setter: setWeekdayTemplateId, dayType: 'WEEKDAY' as DayType },
                    { label: 'Cuối tuần', value: weekendTemplateId, setter: setWeekendTemplateId, dayType: 'WEEKEND' as DayType },
                    { label: 'Ngày lễ', value: holidayTemplateId, setter: setHolidayTemplateId, dayType: 'HOLIDAY' as DayType },
                  ].map(({ label, value, setter, dayType }) => (
                    <div key={dayType}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <select
                        value={value ?? ''}
                        onChange={(e) => setter(e.target.value ? Number(e.target.value) : null)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Không đặt --</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({DAY_TYPE_LABELS[t.dayType]}) — {t.slots.length} khung giờ
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  setUseAdvancedTemplates(!useAdvancedTemplates);
                  if (!useAdvancedTemplates) {
                    // Switching to advanced: copy main template to weekday
                    if (templateId) setWeekdayTemplateId(templateId);
                  } else {
                    // Switching to simple: clear overrides
                    setWeekdayTemplateId(null);
                    setWeekendTemplateId(null);
                    setHolidayTemplateId(null);
                  }
                }}
                className="mt-3 text-xs text-gray-500 hover:text-blue-600 hover:underline"
              >
                {useAdvancedTemplates ? '← Quay lại chế độ đơn giản' : 'Cấu hình nâng cao theo loại ngày →'}
              </button>

              {/* Template Preview */}
              {selectedTemplate && !useAdvancedTemplates && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Preview: {selectedTemplate.name}
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTemplate.slots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="bg-white border rounded px-3 py-1.5 text-sm"
                      >
                        <span className="font-mono font-medium text-blue-600">{slot.startTime}</span>
                        {slot.label && (
                          <span className="text-xs text-gray-400 ml-1">({slot.label})</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>📺 Quảng cáo: {selectedTemplate.adsMinutes} phút</div>
                    <div>🧹 Dọn phòng: {selectedTemplate.cleaningMinutes} phút</div>
                    <div>⏳ Buffer: {selectedTemplate.bufferMinutes} phút</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* DCP / Concurrent Screening Config */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Cấu hình nâng cao</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số phòng chiếu đồng thời tối đa (mỗi phim)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Giới hạn DCP/Key: Cùng một phim chỉ được chiếu đồng thời tối đa N phòng
            </p>
            <input
              type="number"
              min={1}
              max={20}
              value={maxConcurrentScreenings}
              onChange={(e) => setMaxConcurrentScreenings(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Summary */}
        {movieSelections.length > 0 && (templateId || weekdayTemplateId || weekendTemplateId || holidayTemplateId) && (
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
            <h3 className="font-bold text-lg mb-2">Sẵn sàng xem trước</h3>
            <div className="space-y-1 text-sm text-green-100">
              <div>🎬 {movieSelections.length} phim đã chọn</div>
              <div>📋 Template: {useAdvancedTemplates ? 'Theo loại ngày' : selectedTemplate?.name || 'Chưa chọn'}</div>
              <div>🔒 Max đồng thời: {maxConcurrentScreenings} phòng/phim</div>
            </div>
            <p className="text-xs text-green-200 mt-3">Nhấn "Tiếp theo" để xem bản preview lịch chiếu</p>
          </div>
        )}
      </div>

      {/* Template Manager Modal */}
      {showTemplateModal && (
        <TemplateManagerModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          templates={templates}
          onReload={reloadTemplates}
        />
      )}
    </div>
  );
}
