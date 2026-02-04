'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { adminBatchScheduleService, PreviewResponse, TimeSlotPreview, BatchScheduleRequest } from '@/services/adminService';

interface Movie {
  id: number;
  title: string;
  duration: number;
}

interface Theater {
  id: number;
  name: string;
}

interface Room {
  id: number;
  name: string;
  roomType: string;
  theaterId?: number;
  theater?: { id: number };
}

interface QuickScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  movies: Movie[];
  theaters: Theater[];
  rooms: Room[];
}

const ADS_DURATION = 20;
const CLEANING_DURATION = 15;

export default function QuickScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  movies,
  theaters,
  rooms
}: QuickScheduleModalProps) {
  // Form state
  const [formData, setFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    selectedTheaterIds: [] as number[],
    selectedRoomIds: [] as number[],
    movieId: '',
    basePrice: 60000,
    timeSlots: [] as string[],
    timeInput: '09:00',
    adsDuration: ADS_DURATION,
    cleaningDuration: CLEANING_DURATION,
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Derived data
  const selectedMovie = useMemo(
    () => movies.find(m => m.id.toString() === formData.movieId),
    [movies, formData.movieId]
  );

  const availableRooms = useMemo(() => {
    if (formData.selectedTheaterIds.length === 0) return rooms;
    return rooms.filter(r => {
      const theaterId = r.theaterId || r.theater?.id;
      return theaterId && formData.selectedTheaterIds.includes(theaterId);
    });
  }, [rooms, formData.selectedTheaterIds]);

  // Calculate preview locally for instant feedback
  const localPreview = useMemo(() => {
    if (!selectedMovie || formData.timeSlots.length === 0) return null;

    const previews: TimeSlotPreview[] = [];
    const sortedSlots = [...formData.timeSlots].sort();
    const intervals: { start: number; end: number }[] = [];

    for (const slot of sortedSlots) {
      const [h, m] = slot.split(':').map(Number);
      const startMinutes = h * 60 + m;
      const adsEndMinutes = startMinutes + formData.adsDuration;
      const featureEndMinutes = adsEndMinutes + selectedMovie.duration;
      const cleaningEndMinutes = featureEndMinutes + formData.cleaningDuration;

      // Check overlap with previous slots
      let hasOverlap = false;
      let overlapMsg = '';
      for (const interval of intervals) {
        if (startMinutes < interval.end && interval.start < cleaningEndMinutes) {
          hasOverlap = true;
          const overlapSlotH = Math.floor(interval.start / 60);
          const overlapSlotM = interval.start % 60;
          overlapMsg = `Trùng với suất ${overlapSlotH.toString().padStart(2, '0')}:${overlapSlotM.toString().padStart(2, '0')}`;
          break;
        }
      }

      intervals.push({ start: startMinutes, end: cleaningEndMinutes });

      previews.push({
        inputTime: slot,
        adsStart: slot,
        adsEnd: formatMinutesToTime(adsEndMinutes),
        featureStart: formatMinutesToTime(adsEndMinutes),
        featureEnd: formatMinutesToTime(featureEndMinutes),
        cleaningStart: formatMinutesToTime(featureEndMinutes),
        cleaningEnd: formatMinutesToTime(cleaningEndMinutes),
        totalDurationMinutes: cleaningEndMinutes - startMinutes,
        hasOverlapWithOther: hasOverlap,
        overlapMessage: overlapMsg || undefined,
      });
    }

    return {
      movieId: selectedMovie.id,
      movieTitle: selectedMovie.title,
      movieDuration: selectedMovie.duration,
      adsDuration: formData.adsDuration,
      cleaningDuration: formData.cleaningDuration,
      timeSlots: previews,
      hasInternalOverlaps: previews.some(p => p.hasOverlapWithOther),
      validationMessage: previews.some(p => p.hasOverlapWithOther)
        ? 'Một số khung giờ bị trùng lặp!'
        : 'OK',
    } as PreviewResponse;
  }, [selectedMovie, formData.timeSlots, formData.adsDuration, formData.cleaningDuration]);

  // Calculate total showtimes count
  const totalShowtimes = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days * formData.selectedRoomIds.length * formData.timeSlots.length;
  }, [formData.startDate, formData.endDate, formData.selectedRoomIds, formData.timeSlots]);

  // Auto-price based on room type
  useEffect(() => {
    if (formData.selectedRoomIds.length === 1) {
      const room = rooms.find(r => r.id === formData.selectedRoomIds[0]);
      if (room) {
        let price = 60000;
        if (room.roomType === 'VIP' || room.roomType === 'PREMIUM') price = 80000;
        if (room.roomType === 'IMAX' || room.roomType === 'IMAX_3D') price = 100000;
        if (room.roomType === 'VIP_4DX') price = 120000;
        setFormData(prev => ({ ...prev, basePrice: price }));
      }
    }
  }, [formData.selectedRoomIds, rooms]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        selectedTheaterIds: [],
        selectedRoomIds: [],
        movieId: '',
        basePrice: 60000,
        timeSlots: [],
        timeInput: '09:00',
        adsDuration: ADS_DURATION,
        cleaningDuration: CLEANING_DURATION,
      });
      setError(null);
      setValidationErrors([]);
    }
  }, [isOpen]);

  // Handlers
  const addTimeSlot = useCallback(() => {
    const time = formData.timeInput;
    if (time && !formData.timeSlots.includes(time)) {
      setFormData(prev => ({
        ...prev,
        timeSlots: [...prev.timeSlots, time].sort()
      }));
    }
  }, [formData.timeInput, formData.timeSlots]);

  const removeTimeSlot = useCallback((time: string) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter(t => t !== time)
    }));
  }, []);

  const toggleTheater = useCallback((theaterId: number) => {
    setFormData(prev => {
      const isSelected = prev.selectedTheaterIds.includes(theaterId);
      const newTheaterIds = isSelected
        ? prev.selectedTheaterIds.filter(id => id !== theaterId)
        : [...prev.selectedTheaterIds, theaterId];

      // Also filter out rooms from unselected theaters
      const validRoomIds = prev.selectedRoomIds.filter(roomId => {
        const room = rooms.find(r => r.id === roomId);
        const roomTheaterId = room?.theaterId || room?.theater?.id;
        return roomTheaterId && newTheaterIds.includes(roomTheaterId);
      });

      return {
        ...prev,
        selectedTheaterIds: newTheaterIds,
        selectedRoomIds: validRoomIds,
      };
    });
  }, [rooms]);

  const toggleRoom = useCallback((roomId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedRoomIds: prev.selectedRoomIds.includes(roomId)
        ? prev.selectedRoomIds.filter(id => id !== roomId)
        : [...prev.selectedRoomIds, roomId]
    }));
  }, []);

  const selectAllRooms = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      selectedRoomIds: availableRooms.map(r => r.id)
    }));
  }, [availableRooms]);

  const clearAllRooms = useCallback(() => {
    setFormData(prev => ({ ...prev, selectedRoomIds: [] }));
  }, []);

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!formData.movieId) errors.push('Vui lòng chọn phim');
    if (formData.selectedRoomIds.length === 0) errors.push('Vui lòng chọn ít nhất một phòng chiếu');
    if (formData.timeSlots.length === 0) errors.push('Vui lòng thêm ít nhất một khung giờ');
    if (!formData.startDate) errors.push('Vui lòng chọn ngày bắt đầu');
    if (!formData.endDate) errors.push('Vui lòng chọn ngày kết thúc');
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      errors.push('Ngày bắt đầu phải trước ngày kết thúc');
    }
    if (localPreview?.hasInternalOverlaps) {
      errors.push('Các khung giờ đang bị trùng lặp');
    }
    return errors;
  };

  // Handle save
  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      const request: BatchScheduleRequest = {
        movieId: Number(formData.movieId),
        roomIds: formData.selectedRoomIds,
        startDate: formData.startDate,
        endDate: formData.endDate,
        timeSlots: formData.timeSlots,
        basePrice: formData.basePrice,
        adsDuration: formData.adsDuration,
        cleaningDuration: formData.cleaningDuration,
      };

      const result = await adminBatchScheduleService.create(request);

      if (result.totalCreated > 0) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600">
          <div>
            <h3 className="text-xl font-bold text-white">🎬 Lập lịch nhanh</h3>
            <p className="text-sm text-white/80">Tạo hàng loạt suất chiếu tự động</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white rounded-full p-2 hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Error Display */}
          {(error || validationErrors.length > 0) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              {error && <p className="text-red-700 font-medium">{error}</p>}
              {validationErrors.length > 0 && (
                <ul className="list-disc list-inside text-red-600 text-sm">
                  {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Từ ngày *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Đến ngày *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Theaters & Rooms Multi-select */}
          <div className="grid grid-cols-2 gap-4">
            {/* Theaters */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Rạp chiếu *</label>
              <div className="border border-zinc-200 rounded-lg p-3 max-h-40 overflow-y-auto bg-zinc-50">
                {theaters.map(theater => (
                  <label key={theater.id} className="flex items-center gap-2 py-1 hover:bg-zinc-100 px-2 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedTheaterIds.includes(theater.id)}
                      onChange={() => toggleTheater(theater.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-zinc-700">{theater.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rooms */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-zinc-700">Phòng chiếu *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllRooms}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={clearAllRooms}
                    className="text-xs text-zinc-500 hover:text-zinc-700"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
              <div className="border border-zinc-200 rounded-lg p-3 max-h-40 overflow-y-auto bg-zinc-50">
                {availableRooms.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic">Chọn rạp để xem danh sách phòng</p>
                ) : (
                  availableRooms.map(room => (
                    <label key={room.id} className="flex items-center gap-2 py-1 hover:bg-zinc-100 px-2 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.selectedRoomIds.includes(room.id)}
                        onChange={() => toggleRoom(room.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-zinc-700">{room.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600">{room.roomType}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Movie & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Phim *</label>
              <select
                value={formData.movieId}
                onChange={e => setFormData({ ...formData, movieId: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Chọn phim...</option>
                {movies.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.duration} phút)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Giá vé cơ bản (VNĐ)</label>
              <input
                type="number"
                value={formData.basePrice}
                onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Time Slots Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Khung giờ chiếu *</label>
            <div className="flex gap-2 mb-3">
              <input
                type="time"
                value={formData.timeInput}
                onChange={e => setFormData({ ...formData, timeInput: e.target.value })}
                className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={addTimeSlot}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 transition-colors"
              >
                + Thêm giờ
              </button>

              {/* Quick add buttons */}
              <div className="flex gap-1 ml-2">
                {['09:00', '11:30', '14:00', '16:30', '19:00', '21:30'].map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      if (!formData.timeSlots.includes(time)) {
                        setFormData(prev => ({
                          ...prev,
                          timeSlots: [...prev.timeSlots, time].sort()
                        }));
                      }
                    }}
                    disabled={formData.timeSlots.includes(time)}
                    className="px-2 py-1 text-xs bg-zinc-100 text-zinc-600 rounded hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots tags */}
            <div className="border border-zinc-200 rounded-lg p-3 min-h-[60px] flex flex-wrap gap-2 bg-zinc-50">
              {formData.timeSlots.length === 0 && (
                <span className="text-zinc-400 text-sm italic">Chưa có khung giờ nào</span>
              )}
              {formData.timeSlots.map(time => {
                const slotPreview = localPreview?.timeSlots.find((p: TimeSlotPreview) => p.inputTime === time);
                const hasOverlap = slotPreview?.hasOverlapWithOther;

                return (
                  <span
                    key={time}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                      hasOverlap
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {time}
                    {hasOverlap && (
                      <span className="text-xs" title={slotPreview?.overlapMessage}>⚠️</span>
                    )}
                    <button
                      onClick={() => removeTimeSlot(time)}
                      className="ml-1 hover:text-red-600 rounded-full"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Real-time Preview */}
          {localPreview && localPreview.timeSlots.length > 0 && (
            <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-xl p-4 border border-zinc-200">
              <h4 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2">
                <span className="text-lg">📋</span> Preview lịch chiếu
              </h4>

              {localPreview.hasInternalOverlaps && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm font-medium">⚠️ Các khung giờ bị trùng lặp! Vui lòng điều chỉnh.</p>
                </div>
              )}

              <div className="space-y-3">
                {localPreview.timeSlots.map((slot: TimeSlotPreview, index: number) => (
                  <div
                    key={index}
                    className={`rounded-lg overflow-hidden border ${
                      slot.hasOverlapWithOther ? 'border-red-300' : 'border-zinc-200'
                    }`}
                  >
                    <div className="flex text-xs">
                      {/* ADS Block - Yellow */}
                      <div
                        className="bg-amber-400 text-amber-900 px-3 py-2 flex flex-col justify-center"
                        style={{ width: `${(formData.adsDuration / slot.totalDurationMinutes) * 100}%`, minWidth: '80px' }}
                      >
                        <div className="font-semibold">ADS</div>
                        <div>{slot.adsStart} - {slot.adsEnd}</div>
                        <div className="opacity-75">{formData.adsDuration}p</div>
                      </div>

                      {/* Feature Block - Blue */}
                      <div
                        className="bg-blue-500 text-white px-3 py-2 flex flex-col justify-center flex-1"
                      >
                        <div className="font-semibold truncate">{localPreview.movieTitle}</div>
                        <div>{slot.featureStart} - {slot.featureEnd}</div>
                        <div className="opacity-75">{localPreview.movieDuration}p</div>
                      </div>

                      {/* Cleaning Block - Grey */}
                      <div
                        className="bg-zinc-400 text-white px-3 py-2 flex flex-col justify-center"
                        style={{ width: `${(formData.cleaningDuration / slot.totalDurationMinutes) * 100}%`, minWidth: '80px' }}
                      >
                        <div className="font-semibold">CLN</div>
                        <div>{slot.cleaningStart} - {slot.cleaningEnd}</div>
                        <div className="opacity-75">{formData.cleaningDuration}p</div>
                      </div>
                    </div>

                    {slot.hasOverlapWithOther && (
                      <div className="bg-red-50 px-3 py-1 text-red-600 text-xs">
                        ⚠️ {slot.overlapMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 text-xs text-zinc-500 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-amber-400 rounded"></span> Quảng cáo ({formData.adsDuration}p)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded"></span> Phim chính ({localPreview.movieDuration}p)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-zinc-400 rounded"></span> Dọn dẹp ({formData.cleaningDuration}p)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-between items-center">
          <div className="text-sm text-zinc-600">
            {totalShowtimes > 0 ? (
              <span>
                Sẽ tạo <span className="font-bold text-indigo-600">{totalShowtimes}</span> suất chiếu
                {formData.startDate !== formData.endDate && (
                  <span className="text-zinc-500">
                    {' '}({formData.timeSlots.length} giờ × {formData.selectedRoomIds.length} phòng × {
                      Math.floor((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                    } ngày)
                  </span>
                )}
              </span>
            ) : (
              <span className="text-zinc-400">Chưa có suất chiếu nào</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-medium transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              disabled={loading || totalShowtimes === 0 || localPreview?.hasInternalOverlaps}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-colors"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              )}
              {loading ? 'Đang tạo...' : 'Tạo lịch chiếu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function
function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
