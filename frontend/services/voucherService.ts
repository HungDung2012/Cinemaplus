import api from '@/lib/axios';

export interface Voucher {
    id?: number;
    voucherCode?: string;
    pinCode?: string;
    value: number;
    description?: string;
    status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
    minPurchaseAmount?: number;
    expiryDate?: string;
}

export const voucherService = {
    getAll: async (page: number = 0, size: number = 10) => {
        const response = await api.get('/admin/vouchers', { params: { page, size } });
        return response.data;
    },

    create: async (data: Voucher) => {
        const response = await api.post('/admin/vouchers', data);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await api.delete(`/admin/vouchers/${id}`);
        return response.data;
    }
};
