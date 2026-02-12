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

    deletePriceHeader: async (headerId: number) => {
        const response = await api.delete(`/admin/pricing/headers/${headerId}`);
        return response.data;
    },

    // Price Lines
    getPriceLinesByHeader: async (headerId: number) => {
        const response = await api.get(`/admin/pricing/headers/${headerId}/lines`);
        return response.data?.data || [];
    },

    createPriceLine: async (headerId: number, line: PriceLine) => {
        const response = await api.post(`/admin/pricing/headers/${headerId}/lines`, line);
        return response.data.data;
    },

    updatePriceLinesBatch: async (headerId: number, lines: PriceLine[]) => {
        const response = await api.post(`/admin/pricing/headers/${headerId}/lines/batch`, lines);
        return response.data.data;
    },

    deletePriceLine: async (lineId: number) => {
        const response = await api.delete(`/admin/pricing/lines/${lineId}`);
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
        const payload = {
            name: data.name,
            type: 'SEAT_TYPE',
            targetId: data.code, // Use code as targetId
            amount: data.extraFee,
            active: data.active,
            color: data.seatColor,
            code: data.code
        };

        let response;
        if (data.id) {
            response = await api.put(`/admin/pricing/seat-types/${data.id}`, payload);
        } else {
            response = await api.post('/admin/pricing/seat-types', payload);
        }

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
        const response = await api.delete(`/admin/pricing/seat-types/${id}`);
        return response.data;
    }
};

