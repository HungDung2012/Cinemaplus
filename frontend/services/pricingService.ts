import api from '@/lib/axios';
import { PriceHeader, PriceLine, Surcharge, SeatTypeConfig } from '@/types';

export const pricingService = {
    // Price Headers (Rate Cards)
    getAllPriceHeaders: async () => {
        const response = await api.get('/admin/pricing/headers');
        return response.data?.data || [];
    },

    createPriceHeader: async (data: PriceHeader) => {
        const response = await api.post('/admin/pricing/headers', data);
        return response.data?.data;
    },

    // Price Lines
    getPriceLinesByHeader: async (headerId: number) => {
        const response = await api.get(`/admin/pricing/headers/${headerId}/lines`);
        return response.data?.data || [];
    },

    createPriceLine: async (headerId: number, data: PriceLine) => {
        const response = await api.post(`/admin/pricing/headers/${headerId}/lines`, data);
        return response.data?.data;
    },

    deletePriceLine: async (lineId: number) => {
        const response = await api.delete(`/admin/pricing/lines/${lineId}`);
        return response.data;
    },

    // Surcharges
    getAllSurcharges: async () => {
        const response = await api.get('/admin/pricing/surcharges');
        return response.data?.data || [];
    },

    createSurcharge: async (data: Surcharge) => {
        const response = await api.post('/admin/pricing/surcharges', data);
        return response.data?.data;
    },

    deleteSurcharge: async (id: number) => {
        const response = await api.delete(`/admin/pricing/surcharges/${id}`);
        return response.data;
    },

    // Seat Types (Config)
    getAllSeatTypes: async (): Promise<SeatTypeConfig[]> => {
        const response = await api.get('/admin/pricing/seat-types');
        // Map Surcharge[] to SeatTypeConfig[]
        return response.data?.data?.map((s: Surcharge) => ({
            id: s.id,
            code: s.code || s.targetId,
            name: s.name,
            priceMultiplier: 1, // Deprecated, default to 1
            extraFee: s.amount,
            seatColor: s.color || '#000000',
            active: s.active
        })) || [];
    },

    createSeatType: async (data: SeatTypeConfig): Promise<SeatTypeConfig | null> => {
        // Map SeatTypeConfig to SurchargeRequest
        const payload = {
            name: data.name,
            code: data.code,
            type: 'SEAT_TYPE',
            targetId: data.code,
            amount: data.extraFee,
            color: data.seatColor,
            active: data.active
        };
        const response = await api.post('/admin/pricing/surcharges', payload);
        // Return mapped config
        const s = response.data?.data;
        if (!s) return null;
        return {
            id: s.id,
            code: s.code || s.targetId,
            name: s.name,
            priceMultiplier: 1,
            extraFee: s.amount,
            seatColor: s.color || '#000000',
            active: s.active
        };
    },

    deleteSeatType: async (id: number) => {
        // Seat Types are Surcharges now
        const response = await api.delete(`/admin/pricing/surcharges/${id}`);
        return response.data;
    }
};

