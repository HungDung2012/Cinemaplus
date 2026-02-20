import api from '@/lib/axios';
import {
  AnalyticsOverview,
  RevenueByDate,
  RevenueByTheater,
  RevenueByRoomType,
  RevenueByGenre,
  RevenueByMovie,
  DayOfWeekStat,
  HourlyStat,
  MonthlyStat,
  BookingStatusStat,
  TopCustomer,
  UserGrowthStat,
  SeatTypeStat,
  TopFood,
  FoodCategoryStat,
} from '@/types';

// Build ISO query params for date range
function dateParams(from?: Date | null, to?: Date | null) {
  const params: Record<string, string> = {};
  if (from) params.from = from.toISOString();
  if (to) params.to = to.toISOString();
  return params;
}

export const analyticsService = {
  // ─── Legacy (kept for backwards compat) ───────────────────────
  getOverallStats: async () => {
    const res = await api.get('/admin/analytics/overall');
    return res.data;
  },

  getRevenueByMovie: async (limit = 10) => {
    const res = await api.get('/admin/analytics/movies', { params: { limit } });
    return res.data;
  },

  getRevenueByDate: async (days = 30) => {
    const res = await api.get('/admin/analytics/revenue', { params: { days } });
    return res.data;
  },

  // ─── Advanced Analytics ────────────────────────────────────────

  /** KPI Overview with period comparison */
  getOverview: async (from?: Date | null, to?: Date | null): Promise<AnalyticsOverview> => {
    const res = await api.get('/admin/analytics/overview', { params: dateParams(from, to) });
    return res.data?.data;
  },

  /** Revenue trend by date */
  getRevenueTrend: async (from?: Date | null, to?: Date | null): Promise<RevenueByDate[]> => {
    const res = await api.get('/admin/analytics/revenue/trend', { params: dateParams(from, to) });
    return res.data?.data ?? [];
  },

  /** Revenue per theater */
  getRevenueByTheater: async (from?: Date | null, to?: Date | null): Promise<RevenueByTheater[]> => {
    const res = await api.get('/admin/analytics/theaters', { params: dateParams(from, to) });
    return res.data?.data ?? [];
  },

  /** Revenue by room type */
  getRevenueByRoomType: async (from?: Date | null, to?: Date | null): Promise<RevenueByRoomType[]> => {
    const res = await api.get('/admin/analytics/room-types', { params: dateParams(from, to) });
    return res.data?.data ?? [];
  },

  /** Peak day-of-week */
  getRevenueByDayOfWeek: async (from?: Date | null, to?: Date | null): Promise<DayOfWeekStat[]> => {
    const res = await api.get('/admin/analytics/day-of-week', { params: dateParams(from, to) });
    return res.data?.data ?? [];
  },

  /** Peak showtime hour */
  getRevenueByHour: async (from?: Date | null, to?: Date | null): Promise<HourlyStat[]> => {
    const res = await api.get('/admin/analytics/hourly', { params: dateParams(from, to) });
    return res.data?.data ?? [];
  },

  /** Monthly breakdown for a year */
  getRevenueByMonth: async (year?: number): Promise<MonthlyStat[]> => {
    const res = await api.get('/admin/analytics/monthly', { params: year ? { year } : {} });
    return res.data?.data ?? [];
  },

  /** Revenue by genre */
  getRevenueByGenre: async (from?: Date | null, to?: Date | null): Promise<RevenueByGenre[]> => {
    const res = await api.get('/admin/analytics/genres', { params: dateParams(from, to) });
    return res.data?.data ?? [];
  },

  /** Top N movies by revenue */
  getTopMovies: async (limit = 10, from?: Date | null, to?: Date | null): Promise<RevenueByMovie[]> => {
    const res = await api.get('/admin/analytics/movies/top', { params: { limit, ...dateParams(from, to) } });
    return res.data?.data ?? [];
  },

  /** Booking status breakdown */
  getBookingStatusBreakdown: async (from?: Date | null, to?: Date | null): Promise<BookingStatusStat[]> => {
    const res = await api.get('/admin/analytics/booking-status', { params: dateParams(from, to) });
    return res.data?.data ?? [];
  },

  /** Top customers by spending */
  getTopCustomers: async (limit = 20, from?: Date | null, to?: Date | null): Promise<TopCustomer[]> => {
    const res = await api.get('/admin/analytics/customers/top', { params: { limit, ...dateParams(from, to) } });
    return res.data?.data ?? [];
  },

  /** New user registration trend */
  getCustomerGrowth: async (from?: Date | null, to?: Date | null): Promise<UserGrowthStat[]> => {
    const res = await api.get('/admin/analytics/customers/growth', { params: dateParams(from, to) });
    return res.data?.data ?? [];
  },

  /** Revenue by seat type */
  getRevenueBySeatType: async (from?: Date | null, to?: Date | null): Promise<SeatTypeStat[]> => {
    const res = await api.get('/admin/analytics/seat-types', { params: dateParams(from, to) });
    return res.data?.data ?? [];
  },

  /** Top selling F&B items */
  getTopFoods: async (limit = 10, from?: Date | null, to?: Date | null): Promise<TopFood[]> => {
    const res = await api.get('/admin/analytics/food/top', { params: { limit, ...dateParams(from, to) } });
    return res.data?.data ?? [];
  },

  /** F&B revenue by category */
  getFoodByCategory: async (from?: Date | null, to?: Date | null): Promise<FoodCategoryStat[]> => {
    const res = await api.get('/admin/analytics/food/categories', { params: dateParams(from, to) });
    return res.data?.data ?? [];
  },

  // ─── Report downloads ────────────────────────────────────────
  buildReportUrl: (type: 'revenue' | 'movies' | 'theaters' | 'customers' | 'food',
    from?: Date | null, to?: Date | null): string => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const params = new URLSearchParams();
    if (from) params.set('from', from.toISOString());
    if (to) params.set('to', to.toISOString());
    const qs = params.toString();
    return `${base}/api/admin/reports/${type}${qs ? '?' + qs : ''}`;
  },
};

