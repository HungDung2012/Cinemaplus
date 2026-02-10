import api from '@/lib/axios';
import { PriceHeader, PriceLine, Surcharge, SeatType } from '@/types';

// SeatType interface is now in @/types/index.ts (wait, check if it is there)
// Checking types/index.ts, SeatType is defined as 'STANDARD' | 'VIP' ... string union type.
// But we need the Entity interface for the admin page management.
// Let's redefine it here or in types/index.ts if missing.
// In types/index.ts: export interface Seat { ... seatType: SeatType ... }
// But we need the SeatType configuration object (with color, multiplier, etc).
// It was defined locally in previous pricingService.ts.
// Let's define it here again if it's not in types/index.ts.

export interface SeatTypeConfig {
    id?: number;
    code: string;
    name: string;
    priceMultiplier: number;
    extraFee: number;
    seatColor: string;
    active: boolean;
}

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
    getAllSeatTypes: async () => {
        const response = await api.get('/admin/pricing/seat-types');
        return response.data?.data || [];
    },

    createSeatType: async (data: SeatTypeConfig) => {
        const response = await api.post('/admin/pricing/seat-types', data);
        return response.data?.data;
    },

    deleteSeatType: async (id: number) => {
        const response = await api.delete(`/admin/pricing/seat-types/${id}`);
        return response.data;
    }
};

