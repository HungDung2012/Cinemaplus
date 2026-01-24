import api from '@/lib/axios';

export interface AuditLog {
    id: number;
    action: string;
    entityName?: string;
    username?: string;
    ipAddress?: string;
    details?: string;
    timestamp: string;
}

export const auditLogService = {
    getAll: async (page: number = 0, size: number = 20) => {
        const response = await api.get('/admin/audit-logs', { params: { page, size } });
        return response.data;
    }
};
