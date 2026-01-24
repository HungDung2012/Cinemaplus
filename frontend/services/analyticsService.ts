import api from '@/lib/axios';

export const analyticsService = {
    getOverallStats: async () => {
        const response = await api.get('/admin/analytics/overall');
        return response.data;
    },

    getRevenueByMovie: async () => {
        const response = await api.get('/admin/analytics/movies');
        return response.data;
    },

    getRevenueByDate: async (days: number = 30) => {
        const response = await api.get('/admin/analytics/revenue', { params: { days } });
        return response.data;
    }
};
