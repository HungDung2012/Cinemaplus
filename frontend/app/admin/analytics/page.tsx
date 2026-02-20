'use client';

import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '@/services/analyticsService';
import {
  AnalyticsOverview, RevenueByDate, RevenueByTheater, RevenueByRoomType,
  RevenueByGenre, RevenueByMovie, DayOfWeekStat, HourlyStat, MonthlyStat,
  BookingStatusStat, TopCustomer, UserGrowthStat, SeatTypeStat, TopFood, FoodCategoryStat,
} from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import DateRangePicker from '@/components/admin/analytics/DateRangePicker';
import KPICard from '@/components/admin/analytics/KPICard';

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#be123c', '#1d4ed8'];
const DAY_NAMES = ['', 'CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTH_NAMES = ['', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

function fmt(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
}
function fmtM(v: number) { return `${(v / 1_000_000).toFixed(1)}M`; }
function fmtShort(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${v}`;
}

type Tab = 'overview' | 'revenue' | 'movies' | 'showtime' | 'customers' | 'food';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'revenue', label: 'Doanh thu' },
  { id: 'movies', label: 'Phim' },
  { id: 'showtime', label: 'Suất chiếu' },
  { id: 'customers', label: 'Khách hàng' },
  { id: 'food', label: 'F&B' },
];

// ─── Export dropdown ─────────────────────────────────────────────────────────
function ExportMenu({ from, to }: { from: Date; to: Date }) {
  const [open, setOpen] = useState(false);
  const reports = [
    { label: 'Báo cáo Doanh thu', type: 'revenue' as const },
    { label: 'Báo cáo Phim', type: 'movies' as const },
    { label: 'Báo cáo Rạp', type: 'theaters' as const },
    { label: 'Top Khách hàng', type: 'customers' as const },
    { label: 'Báo cáo F&B', type: 'food' as const },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Xuất báo cáo ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-20">
          {reports.map(r => (
            <a
              key={r.type}
              href={analyticsService.buildReportUrl(r.type, from, to)}
              download
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {r.label} (.csv)
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const defaultFrom = new Date(Date.now() - 30 * 86400000);
  const defaultTo = new Date();

  const [tab, setTab] = useState<Tab>('overview');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({ from: defaultFrom, to: defaultTo });
  const [loading, setLoading] = useState(false);

  // Data states
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trend, setTrend] = useState<RevenueByDate[]>([]);
  const [theaters, setTheaters] = useState<RevenueByTheater[]>([]);
  const [roomTypes, setRoomTypes] = useState<RevenueByRoomType[]>([]);
  const [genres, setGenres] = useState<RevenueByGenre[]>([]);
  const [monthly, setMonthly] = useState<MonthlyStat[]>([]);
  const [topMovies, setTopMovies] = useState<RevenueByMovie[]>([]);
  const [seatTypes, setSeatTypes] = useState<SeatTypeStat[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeekStat[]>([]);
  const [hourly, setHourly] = useState<HourlyStat[]>([]);
  const [bookingStatus, setBookingStatus] = useState<BookingStatusStat[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthStat[]>([]);
  const [topFoods, setTopFoods] = useState<TopFood[]>([]);
  const [foodCategories, setFoodCategories] = useState<FoodCategoryStat[]>([]);

  const fetchAll = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    try {
      const [
        ov, tr, th, rt, gn, mo, mv, st, dow, hr, bs, tc, ug, tf, fc,
      ] = await Promise.all([
        analyticsService.getOverview(from, to),
        analyticsService.getRevenueTrend(from, to),
        analyticsService.getRevenueByTheater(from, to),
        analyticsService.getRevenueByRoomType(from, to),
        analyticsService.getRevenueByGenre(from, to),
        analyticsService.getRevenueByMonth(),
        analyticsService.getTopMovies(10, from, to),
        analyticsService.getRevenueBySeatType(from, to),
        analyticsService.getRevenueByDayOfWeek(from, to),
        analyticsService.getRevenueByHour(from, to),
        analyticsService.getBookingStatusBreakdown(from, to),
        analyticsService.getTopCustomers(20, from, to),
        analyticsService.getCustomerGrowth(from, to),
        analyticsService.getTopFoods(10, from, to),
        analyticsService.getFoodByCategory(from, to),
      ]);
      setOverview(ov);
      setTrend(tr);
      setTheaters(th);
      setRoomTypes(rt);
      setGenres(gn);
      setMonthly(mo);
      setTopMovies(mv);
      setSeatTypes(st);
      setDayOfWeek(dow);
      setHourly(hr);
      setBookingStatus(bs);
      setTopCustomers(tc);
      setUserGrowth(ug);
      setTopFoods(tf);
      setFoodCategories(fc);
    } catch (e) {
      console.error('Analytics error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(dateRange.from, dateRange.to);
  }, []);

  function handleDateChange(range: { from: Date; to: Date }) {
    setDateRange(range);
    fetchAll(range.from, range.to);
  }

  // ─── Tab content ───────────────────────────────────────────────────────────

  const tabOverview = () => (
    <div className="space-y-6">
      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label="Doanh thu" color="green"
          value={fmt(overview?.revenue ?? 0)}
          prevValue={fmt(overview?.revenuePrevPeriod ?? 0)}
          changePercent={overview?.revenueChangePercent}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KPICard
          label="Số đơn đặt vé" color="blue"
          value={(overview?.bookingCount ?? 0).toLocaleString('vi-VN')}
          prevValue={(overview?.bookingCountPrevPeriod ?? 0).toLocaleString('vi-VN')}
          changePercent={overview?.bookingCountChangePercent}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>}
        />
        <KPICard
          label="Vé đã bán" color="violet"
          value={(overview?.ticketCount ?? 0).toLocaleString('vi-VN')}
          prevValue={(overview?.ticketCountPrevPeriod ?? 0).toLocaleString('vi-VN')}
          changePercent={overview?.ticketCountChangePercent}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
        />
        <KPICard
          label="Giá trị đơn trung bình" color="yellow"
          value={fmt(overview?.avgOrderValue ?? 0)}
          prevValue={fmt(overview?.avgOrderValuePrevPeriod ?? 0)}
          changePercent={overview?.avgOrderValueChangePercent}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
        />
        <KPICard
          label="Doanh thu F&B" color="rose"
          value={fmt(overview?.foodRevenue ?? 0)}
          prevValue={fmt(overview?.foodRevenuePrevPeriod ?? 0)}
          changePercent={overview?.foodRevenueChangePercent}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />
        <KPICard
          label="Khách hàng mới" color="cyan"
          value={(overview?.newUsers ?? 0).toLocaleString('vi-VN')}
          prevValue={(overview?.newUsersPrevPeriod ?? 0).toLocaleString('vi-VN')}
          changePercent={overview?.newUsersChangePercent}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
        />
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-800 mb-4">Xu hướng doanh thu theo ngày</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" fontSize={11} tickFormatter={v => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} />
              <YAxis fontSize={11} tickFormatter={fmtM} />
              <Tooltip formatter={(v: any) => [fmt(v), 'Doanh thu']} labelFormatter={v => new Date(v).toLocaleDateString('vi-VN')} />
              <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#e11d48" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const tabRevenue = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Theater */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">Doanh thu theo rạp</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={theaters} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis type="number" fontSize={11} tickFormatter={fmtM} />
                <YAxis dataKey="theaterName" type="category" width={130} fontSize={11} />
                <Tooltip formatter={(v: any) => [fmt(v), 'Doanh thu']} />
                <Bar dataKey="revenue" name="Doanh thu" fill="#e11d48" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Room Type */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">Doanh thu theo loại phòng</h2>
          <div className="h-72 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roomTypes} dataKey="revenue" nameKey="roomType" cx="50%" cy="50%" outerRadius={90} label={(props: any) => `${props.roomType}: ${((props.percent ?? 0) * 100).toFixed(0)}%`}>
                  {roomTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Genre */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">Doanh thu theo thể loại phim</h2>
          <div className="h-72 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genres} dataKey="revenue" nameKey="genre" cx="50%" cy="50%" outerRadius={90} label={(props: any) => `${props.genre ?? 'Khác'}: ${((props.percent ?? 0) * 100).toFixed(0)}%`}>
                  {genres.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">Doanh thu theo tháng ({new Date().getFullYear()})</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="month" fontSize={11} tickFormatter={m => MONTH_NAMES[Number(m)] ?? m} />
                <YAxis fontSize={11} tickFormatter={fmtM} />
                <Tooltip formatter={(v: any) => [fmt(v), 'Doanh thu']} labelFormatter={m => `Tháng ${m}`} />
                <Bar dataKey="revenue" name="Doanh thu" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const tabMovies = () => (
    <div className="space-y-6">
      {/* Top Movies */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-800 mb-4">Top 10 phim doanh thu cao nhất</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topMovies} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis type="number" fontSize={11} tickFormatter={fmtM} />
              <YAxis dataKey="movieTitle" type="category" width={150} fontSize={11} />
              <Tooltip formatter={(v: any) => [fmt(v), '']} />
              <Legend />
              <Bar dataKey="revenue" name="Doanh thu" fill="#e11d48" radius={[0, 4, 4, 0]} />
              <Bar dataKey="ticketCount" name="Vé bán" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seat Type */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-800 mb-4">Doanh thu theo loại ghế</h2>
        <div className="h-72 flex items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={seatTypes} dataKey="revenue" nameKey="seatTypeName" cx="50%" cy="50%" outerRadius={100}
                label={(props: any) => `${props.seatTypeName}: ${((props.percent ?? 0) * 100).toFixed(0)}%`}>
                {seatTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => fmt(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Movies Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-800">Chi tiết hiệu suất phim</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Tên phim</th>
                <th className="px-4 py-3 text-right">Doanh thu</th>
                <th className="px-4 py-3 text-right">Số đơn</th>
                <th className="px-4 py-3 text-right">Số vé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {topMovies.map((m, i) => (
                <tr key={m.movieId} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-zinc-400 font-medium">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-zinc-800">{m.movieTitle}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">{fmt(m.revenue)}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">{m.bookingCount.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">{m.ticketCount.toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const tabShowtime = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of week */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-800 mb-1">Doanh thu theo thứ trong tuần</h2>
          <p className="text-xs text-zinc-400 mb-4">Phân tích suất chiếu nào đông khách nhất</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeek.map(d => ({ ...d, dayLabel: DAY_NAMES[d.dayOfWeek] ?? d.dayOfWeek }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="dayLabel" fontSize={12} />
                <YAxis fontSize={11} tickFormatter={fmtM} />
                <Tooltip formatter={(v: any) => [fmt(v), '']} />
                <Legend />
                <Bar dataKey="revenue" name="Doanh thu" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bookingCount" name="Số đơn" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-800 mb-1">Doanh thu theo khung giờ chiếu</h2>
          <p className="text-xs text-zinc-400 mb-4">Giờ vàng thu hút khán giả</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly.map(h => ({ ...h, hourLabel: `${h.hour}:00` }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="hourLabel" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={fmtM} />
                <Tooltip formatter={(v: any) => [fmt(v), '']} />
                <Legend />
                <Bar dataKey="revenue" name="Doanh thu" fill="#0891b2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bookingCount" name="Số đơn" fill="#a5f3fc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const tabCustomers = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking status */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">Tỷ lệ trạng thái đặt vé</h2>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bookingStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  label={(props: any) => `${props.status}: ${((props.percent ?? 0) * 100).toFixed(0)}%`}>
                  {bookingStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User growth */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">Khách hàng mới đăng ký</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="date" fontSize={11} tickFormatter={v => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} />
                <YAxis fontSize={11} />
                <Tooltip labelFormatter={v => new Date(v).toLocaleDateString('vi-VN')} />
                <Area type="monotone" dataKey="newUsers" name="KH mới" stroke="#2563eb" strokeWidth={2} fill="url(#ugGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top customers table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">Top khách hàng theo chi tiêu</h2>
          <span className="text-xs text-zinc-400">Top {topCustomers.length} trong kỳ</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Họ tên</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-right">Tổng chi tiêu</th>
                <th className="px-4 py-3 text-right">Số đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {topCustomers.map((c, i) => (
                <tr key={c.userId} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-zinc-400 font-medium">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-zinc-800">{c.fullName}</td>
                  <td className="px-4 py-3 text-zinc-500">{c.email}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">{fmt(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">{c.bookingCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const tabFood = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top foods */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">Top 10 sản phẩm bán chạy nhất</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topFoods} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis type="number" fontSize={11} tickFormatter={fmtShort} />
                <YAxis dataKey="foodName" type="category" width={130} fontSize={11} />
                <Tooltip formatter={(v: any, name: any) => [name === 'totalRevenue' ? fmt(v) : v, name === 'totalRevenue' ? 'Doanh thu' : 'Số lượng']} />
                <Legend />
                <Bar dataKey="totalRevenue" name="Doanh thu" fill="#e11d48" radius={[0, 4, 4, 0]} />
                <Bar dataKey="totalQuantity" name="Số lượng" fill="#fb923c" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By category */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">Doanh thu F&B theo danh mục</h2>
          <div className="h-80 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={foodCategories} dataKey="totalRevenue" nameKey="category" cx="50%" cy="50%" outerRadius={100}
                  label={(props: any) => `${props.category}: ${((props.percent ?? 0) * 100).toFixed(0)}%`}>
                  {foodCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* F&B detail table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-800">Chi tiết sản phẩm F&B</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Tên sản phẩm</th>
                <th className="px-4 py-3 text-left">Danh mục</th>
                <th className="px-4 py-3 text-right">SL bán</th>
                <th className="px-4 py-3 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {topFoods.map((f, i) => (
                <tr key={f.foodId} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-zinc-800">{f.foodName}</td>
                  <td className="px-4 py-3 text-zinc-500">{f.category}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">{f.totalQuantity.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">{fmt(f.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Thống Kê & Báo Cáo</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Phân tích toàn diện hoạt động kinh doanh rạp chiếu phim</p>
        </div>
        <ExportMenu from={dateRange.from} to={dateRange.to} />
      </div>

      {/* Date Range Picker */}
      <div className="bg-white rounded-xl border border-zinc-200 px-5 py-3 shadow-sm">
        <DateRangePicker onChange={handleDateChange} />
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600" />
        </div>
      )}

      {/* Tab content */}
      {!loading && (
        <>
          {tab === 'overview' && tabOverview()}
          {tab === 'revenue' && tabRevenue()}
          {tab === 'movies' && tabMovies()}
          {tab === 'showtime' && tabShowtime()}
          {tab === 'customers' && tabCustomers()}
          {tab === 'food' && tabFood()}
        </>
      )}
    </div>
  );
}
