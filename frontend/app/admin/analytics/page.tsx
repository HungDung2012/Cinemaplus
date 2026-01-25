'use client';

import { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analyticsService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

export default function AnalyticsPage() {
    const [overall, setOverall] = useState<any>(null);
    const [moviesData, setMoviesData] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, moviesRes, revenueRes] = await Promise.all([
                analyticsService.getOverallStats(),
                analyticsService.getRevenueByMovie(),
                analyticsService.getRevenueByDate(30)
            ]);

            setOverall(statsRes.data);
            setMoviesData(moviesRes.data || []);
            setRevenueData(revenueRes.data || []);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    if (loading) return <div className="p-8 text-center">Đang tải dữ liệu thống kê...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-zinc-900">Thống Kê & Doanh Thu</h1>
                <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/admin/reports/revenue?days=30`}
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    download
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Xuất Báo Cáo (CSV)
                </a>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
                    <p className="text-zinc-500 font-medium">Tổng Doanh Thu</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        {formatCurrency(overall?.totalRevenue || 0)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
                    <p className="text-zinc-500 font-medium">Tổng Vé Đã Bán</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                        {overall?.totalBookings || 0}
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
                    <h2 className="text-lg font-bold mb-4">Xu Hướng Doanh Thu (30 Ngày)</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleDateString('vi-VN')} />
                                <YAxis fontSize={12} tickFormatter={(val) => `${val / 1000000}M`} />
                                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" name="Doanh Thu" stroke="#e11d48" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Movies */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
                    <h2 className="text-lg font-bold mb-4">Top Phim Doanh Thu Cao</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={moviesData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" fontSize={12} tickFormatter={(val) => `${val / 1000000}M`} />
                                <YAxis dataKey="movieTitle" type="category" width={120} fontSize={12} />
                                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                                <Legend />
                                <Bar dataKey="revenue" name="Doanh Thu" fill="#2563eb" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
