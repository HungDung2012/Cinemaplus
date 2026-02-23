'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import {
  adminBatchScheduleService,
  adminShowtimeService,
  BatchScheduleRequest,
  BatchPreviewResponse,
  BatchScheduleResponse,
  ConflictInfo,
} from '@/services/adminService';
import { Movie, Theater, Room } from '@/types';
import { useToast } from '@/components/ui/Toast';

// ======================== Template helpers ========================
interface ScheduleTemplate {
  name: string;
  timeSlots: string[];
  adsDuration: number;
  cleaningDuration: number;
  basePrice: string;
}

const TEMPLATES_KEY = 'cinema_schedule_templates';
const readTemplates = (): ScheduleTemplate[] => {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]'); } catch { return []; }
};
const persistTemplate = (t: ScheduleTemplate) => {
  const rest = readTemplates().filter(x => x.name !== t.name);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify([t, ...rest]));
};
const removeTemplate = (name: string) => {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(readTemplates().filter(x => x.name !== name)));
};

// ======================== Types ========================
type Step = 0 | 1 | 2 | 3;
const STEP_LABELS: Record<Step, string> = { 0: 'Phim & Rạp', 1: 'Chọn Phòng', 2: 'Lịch & Giá', 3: 'Xem Trước' };

export interface QuickScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  theaters: Theater[];
  movies: Movie[];
  onSuccess: () => void;
  initialTheaterId?: number;
}

// ======================== Component ========================
export default function QuickScheduleModal({
  isOpen, onClose, theaters, movies, onSuccess, initialTheaterId,
}: QuickScheduleModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(0);

  // Step 0
  const [movieId, setMovieId] = useState<number>(0);
  const [theaterId, setTheaterId] = useState<number>(initialTheaterId ?? 0);

  // Step 1 — rooms
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  /** Indexes of rooms considered "suggested" (returned by the API sorted by priority) */
  const suggestedCount = Math.ceil(rooms.length / 2);

  // Step 2 — schedule params
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [slotInput, setSlotInput] = useState('');
  const [basePrice, setBasePrice] = useState('90000');
  const [adsDuration, setAdsDuration] = useState(15);
  const [cleaningDuration, setCleaningDuration] = useState(15);

  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');

  // Step 3 — preview & result
  const [preview, setPreview] = useState<BatchPreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [result, setResult] = useState<BatchScheduleResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [showAllConflicts, setShowAllConflicts] = useState(false);

  // ── Reset when closed ──
  useEffect(() => {
    if (!isOpen) {
      setStep(0); setMovieId(0); setTheaterId(initialTheaterId ?? 0);
      setRooms([]); setSelectedRoomIds([]);
      setTimeSlots([]); setPreview(null); setResult(null); setShowAllConflicts(false);
    } else {
      setTemplates(readTemplates());
    }
  }, [isOpen, initialTheaterId]);

  // ── Load rooms when movie + theater change ──
  useEffect(() => {
    if (!movieId || !theaterId) { setRooms([]); setSelectedRoomIds([]); return; }
    setLoadingRooms(true);
    adminShowtimeService.getRoomSuggestions(movieId, theaterId)
      .then(r => { setRooms(r ?? []); setSelectedRoomIds([]); })
      .catch(() => toast('Không thể tải danh sách phòng', 'error'))
      .finally(() => setLoadingRooms(false));
  }, [movieId, theaterId]);

  // ── Template helpers ──
  const applyTemplate = (t: ScheduleTemplate) => {
    setTimeSlots(t.timeSlots);
    setAdsDuration(t.adsDuration);
    setCleaningDuration(t.cleaningDuration);
    setBasePrice(t.basePrice);
    toast(`Đã tải template "${t.name}"`, 'success');
  };
  const handleSaveTemplate = () => {
    if (!templateName.trim()) { toast('Nhập tên template', 'error'); return; }
    if (timeSlots.length === 0) { toast('Cần có ít nhất một khung giờ', 'error'); return; }
    const t: ScheduleTemplate = { name: templateName.trim(), timeSlots, adsDuration, cleaningDuration, basePrice };
    persistTemplate(t);
    setTemplates(readTemplates());
    setTemplateName('');
    toast(`Đã lưu template "${t.name}"`, 'success');
  };
  const handleDeleteTemplate = (name: string) => {
    removeTemplate(name);
    setTemplates(readTemplates());
  };

  // ── Time slot helpers ──
  const addSlot = () => {
    if (!slotInput) return;
    if (timeSlots.includes(slotInput)) { toast('Khung giờ đã tồn tại', 'error'); return; }
    setTimeSlots(prev => [...prev, slotInput].sort());
    setSlotInput('');
  };
  const removeSlot = (s: string) => setTimeSlots(prev => prev.filter(x => x !== s));

  // ── Preview ──
  const handlePreview = useCallback(async () => {
    setLoadingPreview(true); setPreview(null); setResult(null); setShowAllConflicts(false);
    try {
      const req: BatchScheduleRequest = {
        movieId, roomIds: selectedRoomIds, startDate, endDate,
        timeSlots, basePrice: Number(basePrice), adsDuration, cleaningDuration,
      };
      const data = await adminBatchScheduleService.preview(req);
      setPreview(data);
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Lỗi khi tải preview', 'error');
    } finally {
      setLoadingPreview(false);
    }
  }, [movieId, selectedRoomIds, startDate, endDate, timeSlots, basePrice, adsDuration, cleaningDuration]);

  // ── Create ──
  const handleCreate = async () => {
    setCreating(true);
    try {
      const req: BatchScheduleRequest = {
        movieId, roomIds: selectedRoomIds, startDate, endDate,
        timeSlots, basePrice: Number(basePrice), adsDuration, cleaningDuration,
      };
      const data = await adminBatchScheduleService.create(req);
      setResult(data);
      if (data.totalCreated > 0) onSuccess();
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Lỗi khi tạo lịch', 'error');
    } finally {
      setCreating(false);
    }
  };

  // ── Step validation ──
  const canAdvanceStep0 = movieId > 0 && theaterId > 0;
  const canAdvanceStep1 = selectedRoomIds.length > 0;
  const canAdvanceStep2 = startDate && endDate && timeSlots.length > 0 && Number(basePrice) > 0
    && new Date(startDate) <= new Date(endDate);

  if (!isOpen) return null;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Tạo lịch chiếu tự động
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step progress */}
        <div className="flex px-6 pt-4 gap-2">
          {([0, 1, 2, 3] as Step[]).map(s => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${step === s ? 'bg-blue-600 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                {step > s ? '✓' : s + 1}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${step === s ? 'text-blue-600' : 'text-zinc-400'}`}>
                {STEP_LABELS[s]}
              </span>
            </div>
          ))}
          <div className="absolute" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ────────── STEP 0: Movie + Theater ────────── */}
          {step === 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Phim <span className="text-red-500">*</span></label>
                <select
                  value={movieId}
                  onChange={e => setMovieId(Number(e.target.value))}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>— Chọn phim —</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.duration} phút{m.rating ? ` · ⭐ ${m.rating}` : ''})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Rạp <span className="text-red-500">*</span></label>
                <select
                  value={theaterId}
                  onChange={e => setTheaterId(Number(e.target.value))}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>— Chọn rạp —</option>
                  {theaters.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* ────────── STEP 1: Room selection ────────── */}
          {step === 1 && (
            <>
              <p className="text-sm text-zinc-500">
                Chọn các phòng chiếu. Phòng được đánh dấu <span className="text-blue-600 font-medium">Đề xuất</span> phù hợp nhất với
                rating phim.
              </p>
              {loadingRooms ? (
                <div className="flex justify-center py-8">
                  <svg className="w-7 h-7 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              ) : rooms.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-6">Không tìm thấy phòng chiếu</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {rooms.map((room, idx) => {
                    const isSuggested = idx < suggestedCount;
                    const isSelected = selectedRoomIds.includes(room.id);
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setSelectedRoomIds(prev =>
                          isSelected ? prev.filter(id => id !== room.id) : [...prev, room.id]
                        )}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all
                          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:border-blue-300 bg-white'}`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center
                          ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-zinc-400'}`}>
                          {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-zinc-800">{room.name}</span>
                            {isSuggested && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">⭐ Đề xuất</span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {room.roomType.replace(/_/g, ' ')} · {room.totalSeats} ghế
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedRoomIds.length > 0 && (
                <p className="text-xs text-blue-600 font-medium">
                  Đã chọn {selectedRoomIds.length}/{rooms.length} phòng
                </p>
              )}
            </>
          )}

          {/* ────────── STEP 2: Schedule params ────────── */}
          {step === 2 && (
            <>
              {/* Templates */}
              {templates.length > 0 && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                  <p className="text-xs font-medium text-zinc-600 mb-2">Template đã lưu:</p>
                  <div className="flex flex-wrap gap-2">
                    {templates.map(t => (
                      <div key={t.name} className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg px-2 py-1">
                        <button type="button" onClick={() => applyTemplate(t)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium">{t.name}</button>
                        <button type="button" onClick={() => handleDeleteTemplate(t.name)}
                          className="text-zinc-300 hover:text-red-400 ml-1">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Từ ngày</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Đến ngày</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Time slots */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Khung giờ chiếu</label>
                <div className="flex gap-2 mb-2">
                  <input type="time" value={slotInput} onChange={e => setSlotInput(e.target.value)}
                    className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={addSlot}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 whitespace-nowrap">
                    + Thêm
                  </button>
                </div>
                {timeSlots.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">Chưa có khung giờ nào</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map(s => (
                      <span key={s} className="flex items-center gap-1 bg-zinc-100 text-zinc-700 text-xs px-2.5 py-1 rounded-full">
                        {s}
                        <button type="button" onClick={() => removeSlot(s)} className="text-zinc-400 hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Buffer + Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Quảng cáo (phút)</label>
                  <input type="number" min={0} max={60} value={adsDuration}
                    onChange={e => setAdsDuration(Number(e.target.value))}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Dọn phòng (phút)</label>
                  <input type="number" min={0} max={60} value={cleaningDuration}
                    onChange={e => setCleaningDuration(Number(e.target.value))}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Giá vé (VNĐ)</label>
                  <input type="number" min={0} value={basePrice}
                    onChange={e => setBasePrice(e.target.value)}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Save template */}
              <div className="border-t border-zinc-100 pt-3">
                <label className="block text-xs font-medium text-zinc-600 mb-1">Lưu cấu hình này thành template</label>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="Tên template..." value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
                    className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={handleSaveTemplate}
                    className="px-4 py-2 bg-zinc-700 text-white text-sm rounded-lg hover:bg-zinc-900 whitespace-nowrap">
                    Lưu
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ────────── STEP 3: Preview & Result ────────── */}
          {step === 3 && (
            <>
              {/* Result banner */}
              {result && (
                <div className={`p-4 rounded-xl border flex items-start gap-3
                  ${result.totalSkipped === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${result.totalSkipped === 0 ? 'text-green-600' : 'text-yellow-600'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={result.totalSkipped === 0
                        ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                        : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} />
                  </svg>
                  <div>
                    <p className="font-semibold text-sm text-zinc-800">{result.message}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Đã tạo {result.totalCreated} suất · Bỏ qua {result.totalSkipped} suất trùng lịch
                    </p>
                  </div>
                </div>
              )}

              {/* Preview stats (before creating) */}
              {!result && (
                <>
                  {loadingPreview ? (
                    <div className="flex flex-col items-center gap-3 py-10">
                      <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <p className="text-sm text-zinc-500">Đang tính toán lịch chiếu...</p>
                    </div>
                  ) : preview ? (
                    <>
                      {/* Stats cards */}
                      <div className="grid grid-cols-3 gap-3">
                        <StatCard label="Tổng suất sẽ tạo" value={preview.totalToCreate} color="blue" />
                        <StatCard label="Suất bị trùng" value={preview.totalConflicts} color={preview.totalConflicts > 0 ? 'yellow' : 'green'} />
                        <StatCard label="Thời lượng mỗi slot" value={`${preview.slotDurationMinutes} phút`} color="zinc" />
                      </div>

                      {/* Movie info */}
                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm">
                        <span className="font-medium text-zinc-700">{preview.movieTitle}</span>
                        <span className="text-zinc-400 mx-2">·</span>
                        <span className="text-zinc-500">{preview.movieDuration} phút phim + {adsDuration}' QC + {cleaningDuration}' dọn</span>
                      </div>

                      {/* Conflicts */}
                      {preview.totalConflicts > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-yellow-700">
                              ⚠ {preview.totalConflicts} suất bị trùng (sẽ tự động bỏ qua khi tạo)
                            </p>
                            <button type="button" onClick={() => setShowAllConflicts(v => !v)}
                              className="text-xs text-blue-600 hover:underline">
                              {showAllConflicts ? 'Thu gọn' : 'Xem tất cả'}
                            </button>
                          </div>
                          <div className="rounded-xl border border-yellow-200 overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-yellow-50">
                                <tr>
                                  <th className="text-left px-3 py-2 text-zinc-600">Phòng</th>
                                  <th className="text-left px-3 py-2 text-zinc-600">Ngày</th>
                                  <th className="text-left px-3 py-2 text-zinc-600">Giờ</th>
                                  <th className="text-left px-3 py-2 text-zinc-600">Trùng với</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-yellow-100">
                                {(showAllConflicts ? preview.conflicts : preview.conflicts.slice(0, 5)).map((c, i) => (
                                  <tr key={i} className="bg-white">
                                    <td className="px-3 py-1.5 text-zinc-700 font-medium">{c.roomName}</td>
                                    <td className="px-3 py-1.5 text-zinc-500">{c.date}</td>
                                    <td className="px-3 py-1.5 text-zinc-700">{String(c.slotTime).slice(0, 5)}</td>
                                    <td className="px-3 py-1.5 text-zinc-500 truncate max-w-[160px]">{c.conflictWith}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {!showAllConflicts && preview.totalConflicts > 5 && (
                              <p className="text-center text-xs text-zinc-400 py-2 bg-yellow-50 border-t border-yellow-100">
                                + {preview.totalConflicts - 5} xung đột khác
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {preview.totalToCreate === 0 && (
                        <div className="text-center py-4 text-sm text-zinc-500">
                          Tất cả khung giờ đều bị trùng lịch. Không có suất nào được tạo.
                        </div>
                      )}
                    </>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-6 py-4 flex items-center justify-between gap-3">
          <div>
            {step > 0 && !result && (
              <button onClick={() => setStep(s => (s - 1) as Step)}
                className="px-4 py-2 border border-zinc-200 text-zinc-600 text-sm rounded-lg hover:bg-zinc-50 transition-colors">
                ← Quay lại
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {result ? (
              <button onClick={onClose}
                className="px-5 py-2 bg-zinc-800 text-white text-sm rounded-lg hover:bg-zinc-900 transition-colors">
                Đóng
              </button>
            ) : step < 2 ? (
              <button
                onClick={() => setStep(s => (s + 1) as Step)}
                disabled={step === 0 ? !canAdvanceStep0 : step === 1 ? !canAdvanceStep1 : false}
                className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Tiếp theo →
              </button>
            ) : step === 2 ? (
              <button
                onClick={() => { setStep(3); handlePreview(); }}
                disabled={!canAdvanceStep2}
                className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Xem trước →
              </button>
            ) : (
              // Step 3
              !preview?.totalToCreate || preview.totalToCreate === 0 ? null : (
                <button
                  onClick={handleCreate}
                  disabled={creating || !!result}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {creating ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>Đang tạo...</>
                  ) : (
                    <>✓ Tạo {preview?.totalToCreate} suất chiếu</>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat card helper ──
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green: 'bg-green-50 text-green-700',
    zinc: 'bg-zinc-100 text-zinc-700',
  };
  return (
    <div className={`rounded-xl p-3 ${colors[color] ?? colors.zinc}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs opacity-75 mt-0.5">{label}</p>
    </div>
  );
}
