import api from '@/lib/axios';

export interface PriceConfig {
    id?: number;
    roomType: 'STANDARD_2D' | 'STANDARD_3D' | 'IMAX' | 'IMAX_3D' | 'VIP_4DX';
    dayType: 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY';
    seatType: 'STANDARD' | 'VIP' | 'COUPLE' | 'DISABLED';
    basePrice: number;
    active: boolean;
}

export const pricingService = {
    getAll: async () => {
        const response = await api.get('/admin/prices');
        return response.data;
    },

    createOrUpdate: async (config: PriceConfig) => {
        const response = await api.post('/admin/prices', config);
        return response.data;
    }
};
