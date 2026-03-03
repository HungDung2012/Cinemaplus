'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ScheduleTemplate,
  ScheduleTemplateRequest,
  ScheduleTemplateSlot,
  DayType,
  autoScheduleService,
} from '@/services/autoScheduleService';

const DAY_TYPES: { value: DayType; label: string }[] = [
  { value: 'WEEKDAY', label: 'Ngày thường' },
  { value: 'WEEKEND', label: 'Cuối tuần' },
  { value: 'HOLIDAY', label: 'Ngày lễ' },
];

const PRESET_SLOTS: Record<string, { startTime: string; label: string }[]> = {
  standard: [
    { startTime: '08:00', label: 'Sáng sớm' },
    { startTime: '10:30', label: 'Sáng' },
    { startTime: '13:00', label: 'Trưa' },
    { startTime: '15:30', label: 'Chiều' },
    { startTime: '18:00', label: 'Tối sớm' },
    { startTime: '20:30', label: 'Tối' },
    { startTime: '23:00', label: 'Suất khuya' },
  ],
  compact: [
    { startTime: '09:00', label: 'Sáng' },
    { startTime: '11:30', label: 'Trưa' },
    { startTime: '14:00', label: 'Chiều' },
    { startTime: '16:30', label: 'Xế chiều' },
    { startTime: '19:00', label: 'Tối' },
    { startTime: '21:30', label: 'Khuya' },
  ],
  weekend: [
    { startTime: '08:00', label: 'Sáng sớm' },
    { startTime: '10:00', label: 'Sáng' },
    { startTime: '12:00', label: 'Trưa' },
    { startTime: '14:00', label: 'Chiều sớm' },
    { startTime: '16:00', label: 'Chiều' },
    { startTime: '18:00', label: 'Tối sớm' },
    { startTime: '20:00', label: 'Tối' },
    { startTime: '22:00', label: 'Khuya sớm' },
    { startTime: '23:30', label: 'Suất khuya' },
  ],
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  templates: ScheduleTemplate[];
  onReload: () => Promise<void>;
}

type EditMode = 'list' | 'create' | 'edit';

interface FormData {
  name: string;
  dayType: DayType;
  cleaningMinutes: number;
  bufferMinutes: number;
  adsMinutes: number;
  active: boolean;
  slots: { startTime: string; label: string; priority: number }[];
}

const emptyForm: FormData = {
  name: '',
  dayType: 'WEEKDAY',
  cleaningMinutes: 15,
  bufferMinutes: 10,
  adsMinutes: 20,
  active: true,
  slots: [],
};

export default function TemplateManagerModal({ isOpen, onClose, templates, onReload }: Props) {
  const [mode, setMode] = useState<EditMode>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode('list');
      setEditingId(null);
      setForm({ ...emptyForm });
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = () => {
    setMode('create');
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
  };

  const handleEdit = (t: ScheduleTemplate) => {
    setMode('edit');
    setEditingId(t.id);
    setForm({
      name: t.name,
      dayType: t.dayType,
      cleaningMinutes: t.cleaningMinutes,
      bufferMinutes: t.bufferMinutes,
      adsMinutes: t.adsMinutes,
      active: t.active,
      slots: t.slots.map((s) => ({
        startTime: s.startTime,
        label: s.label || '',
        priority: s.priority,
      })),
    });
    setError('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xoá template này?')) return;
    setDeleting(id);
    try {
      await autoScheduleService.deleteTemplate(id);
      await onReload();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xoá thất bại');
    } finally {
      setDeleting(null);
    }
  };

  const addSlot = () => {
    setForm((f) => ({
      ...f,
      slots: [...f.slots, { startTime: '', label: '', priority: 0 }],
    }));
  };

  const removeSlot = (idx: number) => {
    setForm((f) => ({
      ...f,
      slots: f.slots.filter((_, i) => i !== idx),
    }));
  };

  const updateSlot = (idx: number, field: string, value: string | number) => {
    setForm((f) => ({
      ...f,
      slots: f.slots.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  };

  const applyPreset = (key: string) => {
    const preset = PRESET_SLOTS[key];
    if (!preset) return;
    setForm((f) => ({
      ...f,
      slots: preset.map((p) => ({ ...p, priority: 0 })),
    }));
  };

  const sortSlots = () => {
    setForm((f) => ({
      ...f,
      slots: [...f.slots].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Tên template không được để trống');
      return;
    }
    if (form.slots.length === 0) {
      setError('Cần ít nhất 1 khung giờ');
      return;
    }
    if (form.slots.some((s) => !s.startTime)) {
      setError('Tất cả khung giờ cần có thời gian bắt đầu');
      return;
    }

    setSaving(true);
    try {
      const request: ScheduleTemplateRequest = {
        name: form.name.trim(),
        dayType: form.dayType,
        cleaningMinutes: form.cleaningMinutes,
        bufferMinutes: form.bufferMinutes,
        adsMinutes: form.adsMinutes,
        active: form.active,
        slots: form.slots.map((s) => ({
          startTime: s.startTime,
          label: s.label || undefined,
          priority: s.priority,
        })),
      };

      if (mode === 'create') {
        await autoScheduleService.createTemplate(request);
      } else if (editingId) {
        await autoScheduleService.updateTemplate(editingId, request);
      }

      await onReload();
      setMode('list');
      setEditingId(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            {mode !== 'list' && (
              <button
                onClick={() => { setMode('list'); setError(''); }}
                className="p-1 rounded hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'list' ? 'Quản lý Template' : mode === 'create' ? 'Tạo Template mới' : 'Sửa Template'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'list' && (
            <div className="space-y-3">
              <button
                onClick={handleCreate}
                className="w-full py-3 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
              >
                + Tạo Template mới
              </button>

              {templates.length === 0 && (
                <div className="text-center py-8 text-gray-400">Chưa có template nào</div>
              )}

              {templates.map((t) => (
                <div
                  key={t.id}
                  className="border rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{t.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          t.dayType === 'WEEKDAY' ? 'bg-gray-100 text-gray-700' :
                          t.dayType === 'WEEKEND' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {DAY_TYPES.find((d) => d.value === t.dayType)?.label}
                        </span>
                        {!t.active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                            Tắt
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        <span>🧹 {t.cleaningMinutes}ph dọn</span>
                        <span>⏸ {t.bufferMinutes}ph buffer</span>
                        <span>📺 {t.adsMinutes}ph QC</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.slots
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((s, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono"
                            >
                              {s.startTime}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-3">
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                        title="Sửa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deleting === t.id}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
                        title="Xoá"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(mode === 'create' || mode === 'edit') && (
            <div className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
              )}

              {/* Name + Day type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên template</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                    placeholder="VD: Lịch ngày thường"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại ngày</label>
                  <select
                    value={form.dayType}
                    onChange={(e) => setForm((f) => ({ ...f, dayType: e.target.value as DayType }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                  >
                    {DAY_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Durations */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🧹 Dọn dẹp (phút)</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={form.cleaningMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, cleaningMinutes: parseInt(e.target.value) || 0 }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">⏸ Buffer (phút)</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={form.bufferMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, bufferMinutes: parseInt(e.target.value) || 0 }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">📺 Quảng cáo (phút)</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={form.adsMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, adsMinutes: parseInt(e.target.value) || 0 }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Kích hoạt</span>
              </label>

              {/* Slots section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Khung giờ ({form.slots.length})
                  </label>
                  <div className="flex gap-2">
                    <div className="relative group">
                      <button className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-100">
                        Áp dụng mẫu ▾
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white shadow-xl border rounded-lg py-1 z-10 hidden group-hover:block min-w-[160px]">
                        <button
                          onClick={() => applyPreset('standard')}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          Chuẩn (7 khung)
                        </button>
                        <button
                          onClick={() => applyPreset('compact')}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          Gọn (6 khung)
                        </button>
                        <button
                          onClick={() => applyPreset('weekend')}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          Cuối tuần (9 khung)
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={sortSlots}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200"
                    >
                      Sắp xếp
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {form.slots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <span className="text-xs text-gray-400 w-5 text-center">{idx + 1}</span>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateSlot(idx, 'startTime', e.target.value)}
                        className="border rounded px-2 py-1 text-sm font-mono w-28 focus:ring-2 focus:ring-blue-300 outline-none"
                      />
                      <input
                        type="text"
                        value={slot.label}
                        onChange={(e) => updateSlot(idx, 'label', e.target.value)}
                        placeholder="Nhãn (tuỳ chọn)"
                        className="border rounded px-2 py-1 text-sm flex-1 focus:ring-2 focus:ring-blue-300 outline-none"
                      />
                      <select
                        value={slot.priority}
                        onChange={(e) => updateSlot(idx, 'priority', parseInt(e.target.value))}
                        className="border rounded px-2 py-1 text-sm w-20 focus:ring-2 focus:ring-blue-300 outline-none"
                        title="Ưu tiên"
                      >
                        {[0, 1, 2, 3, 4, 5].map((p) => (
                          <option key={p} value={p}>{p === 0 ? 'Bình thường' : `P${p}`}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeSlot(idx)}
                        className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addSlot}
                  className="mt-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  + Thêm khung giờ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer (form mode only) */}
        {(mode === 'create' || mode === 'edit') && (
          <div className="flex justify-end gap-3 p-5 border-t">
            <button
              onClick={() => { setMode('list'); setError(''); }}
              className="px-5 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
            >
              Huỷ
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : mode === 'create' ? 'Tạo' : 'Cập nhật'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
