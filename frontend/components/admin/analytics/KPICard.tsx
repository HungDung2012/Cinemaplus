'use client';

interface KPICardProps {
  label: string;
  value: string;
  prevValue?: string;
  changePercent?: number;
  icon: React.ReactNode;
  color?: 'green' | 'blue' | 'violet' | 'yellow' | 'rose' | 'cyan';
  subtitle?: string;
}

const COLOR_MAP = {
  green: { bg: 'bg-green-50', text: 'text-green-600', badge: 'text-green-700 bg-green-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'text-blue-700 bg-blue-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', badge: 'text-violet-700 bg-violet-100' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', badge: 'text-yellow-700 bg-yellow-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', badge: 'text-rose-700 bg-rose-100' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', badge: 'text-cyan-700 bg-cyan-100' },
};

export default function KPICard({ label, value, prevValue, changePercent, icon, color = 'blue', subtitle }: KPICardProps) {
  const c = COLOR_MAP[color];
  const isPositive = (changePercent ?? 0) >= 0;
  const showChange = changePercent !== undefined;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-500 truncate">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${c.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
          <span className={c.text}>{icon}</span>
        </div>
      </div>

      {showChange && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-medium ${
              isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
            }`}
          >
            {isPositive ? '▲' : '▼'} {Math.abs(changePercent ?? 0).toFixed(1)}%
          </span>
          {prevValue && <span className="text-zinc-400">kỳ trước: {prevValue}</span>}
        </div>
      )}
    </div>
  );
}
