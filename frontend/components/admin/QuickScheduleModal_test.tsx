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
  const [showPreview, setShowPreview] = useState(false);

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [slotInput, setSlotInput] = useState('');
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
      setShowPreview(false); setMovieId(0); setTheaterId(initialTheaterId ?? 0);
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
    toast(`Đã tải template "${t.name}"`, 'success');
  };
  const handleSaveTemplate = () => {
    if (!templateName.trim()) { toast('Nhập tên template', 'error'); return; }
    if (timeSlots.length === 0) { toast('Cần có ít nhất một khung giờ', 'error'); return; }
    const t: ScheduleTemplate = { name: templateName.trim(), timeSlots, adsDuration, cleaningDuration };
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
    setShowPreview(true); setLoadingPreview(true); setPreview(null); setResult(null); setShowAllConflicts(false);
    try {
      const req: BatchScheduleRequest = {
        movieId, roomIds: selectedRoomIds, startDate, endDate,
        timeSlots, basePrice: 0, adsDuration, cleaningDuration,
      };
      const data = await adminBatchScheduleService.preview(req);
      setPreview(data);
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Lỗi khi tải preview', 'error');
    } finally {
      setLoadingPreview(false);
    }
  }, [movieId, selectedRoomIds, startDate, endDate, timeSlots, adsDuration, cleaningDuration]);

  // ── Create ──
  const handleCreate = async () => {
    setCreating(true);
    try {
      const req: BatchScheduleRequest = {
        movieId, roomIds: selectedRoomIds, startDate, endDate,
        timeSlots, basePrice: 0, adsDuration, cleaningDuration,
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
  const canPreview = movieId > 0 && theaterId > 0 && selectedRoomIds.length > 0 && startDate && endDate && timeSlots.length > 0
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {!showPreview && !result && (
             <div>test</div>
            )}

            {/* ────────── Preview & Result ────────── */}
            {(showPreview || result) && (
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
              {showPreview && !result && (
                <button onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-600 text-sm rounded-lg hover:bg-zinc-50 transition-colors">
                  ← Chỉnh sửa
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {result ? (
                <button onClick={onClose}
                  className="px-5 py-2 bg-zinc-800 text-white text-sm rounded-lg hover:bg-zinc-900 transition-colors">
                  Hoàn tất
                </button>
              ) : !showPreview ? (
                <button
                  onClick={handlePreview}
                  disabled={!canPreview}
                  className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Xem trước →
                </button>
              ) : (
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
                      </svg>Đang lưu...</>
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
