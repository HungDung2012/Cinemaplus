'use client';

import { useState } from 'react';
import { DateRangePreset } from '@/types';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  onChange: (range: DateRange) => void;
}

const PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: '7 ngày', value: '7d' },
  { label: '30 ngày', value: '30d' },
  { label: '90 ngày', value: '90d' },
  { label: '1 năm', value: '1y' },
  { label: 'Tùy chọn', value: 'custom' },
];

function presetToRange(preset: DateRangePreset): DateRange {
  const to = new Date();
  const from = new Date();
  if (preset === '7d') from.setDate(from.getDate() - 7);
  else if (preset === '30d') from.setDate(from.getDate() - 30);
  else if (preset === '90d') from.setDate(from.getDate() - 90);
  else if (preset === '1y') from.setFullYear(from.getFullYear() - 1);
  return { from, to };
}

function toInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function DateRangePicker({ onChange }: DateRangePickerProps) {
  const [active, setActive] = useState<DateRangePreset>('30d');
  const [custom, setCustom] = useState({ from: toInputValue(new Date(Date.now() - 30 * 86400000)), to: toInputValue(new Date()) });

  function select(preset: DateRangePreset) {
    setActive(preset);
    if (preset !== 'custom') {
      onChange(presetToRange(preset));
    }
  }

  function applyCustom() {
    onChange({ from: new Date(custom.from), to: new Date(custom.to + 'T23:59:59') });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg overflow-hidden border border-zinc-200 divide-x divide-zinc-200">
        {PRESETS.filter(p => p.value !== 'custom').map(p => (
          <button
            key={p.value}
            onClick={() => select(p.value)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              active === p.value ? 'bg-rose-600 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => select('custom')}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            active === 'custom' ? 'bg-rose-600 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          Tùy chọn
        </button>
      </div>

      {active === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={custom.from}
            max={custom.to}
            onChange={e => setCustom(prev => ({ ...prev, from: e.target.value }))}
            className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <span className="text-zinc-400 text-sm">→</span>
          <input
            type="date"
            value={custom.to}
            min={custom.from}
            max={toInputValue(new Date())}
            onChange={e => setCustom(prev => ({ ...prev, to: e.target.value }))}
            className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <button
            onClick={applyCustom}
            className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 transition-colors"
          >
            Áp dụng
          </button>
        </div>
      )}
    </div>
  );
}
