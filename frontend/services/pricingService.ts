import api from '@/lib/axios';

export interface TicketPrice {
    id?: number;
    roomType: 'STANDARD_2D' | 'STANDARD_3D' | 'IMAX' | 'IMAX_3D' | 'VIP_4DX';
    dayType: 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY';
    price: number;
    description?: string;
}

export interface SeatType {
    id?: number;
    code: string;
    name: string;
    priceMultiplier: number; // 1.0, 1.2, etc.
    extraFee: number;      // 0, 10000, etc.
    seatColor: string;
    active: boolean;
}

export const pricingService = {
    // Ticket Prices
    getAllTicketPrices: async () => {
        const response = await api.get('/admin/ticket-prices');
        return response.data?.data || [];
    },

    createTicketPrice: async (data: TicketPrice) => {
        const response = await api.post('/admin/ticket-prices', data);
        return response.data?.data;
    },

    // Seat Types
    getAllSeatTypes: async () => {
        const response = await api.get('/admin/seat-types');
        return response.data?.data || [];
    },

    createSeatType: async (data: SeatType) => {
        const response = await api.post('/admin/seat-types', data);
        return response.data?.data;
    }
};

