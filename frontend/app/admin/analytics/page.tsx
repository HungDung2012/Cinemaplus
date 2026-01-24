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
            <h1 className="text-2xl font-bold text-zinc-900">Thống Kê & Doanh Thu</h1>

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
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
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
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
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
