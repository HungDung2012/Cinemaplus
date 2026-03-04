import api from '@/lib/axios';

export interface AuditLog {
    id: number;
    action: string;
    entityName?: string;
    entityId?: string;
    userId?: number;
    username?: string;
    userRole?: string;
    ipAddress?: string;
    details?: string;
    oldValue?: string;
    newValue?: string;
    timestamp: string;
}

export interface AuditLogFilters {
    username?: string;
    action?: string;
    entityName?: string;
    userRole?: string;
    fromDate?: string;
    toDate?: string;
}

export interface AuditLogFilterOptions {
    actions: string[];
    entityNames: string[];
    usernames: string[];
}

export const auditLogService = {
    getAll: async (page: number = 0, size: number = 20, filters?: AuditLogFilters) => {
        const params: any = { page, size };
        if (filters) {
            if (filters.username) params.username = filters.username;
            if (filters.action) params.action = filters.action;
            if (filters.entityName) params.entityName = filters.entityName;
            if (filters.userRole) params.userRole = filters.userRole;
            if (filters.fromDate) params.fromDate = filters.fromDate;
            if (filters.toDate) params.toDate = filters.toDate;
        }
        const response = await api.get('/admin/audit-logs', { params });
        return response.data;
    },

    getFilterOptions: async (): Promise<AuditLogFilterOptions> => {
        const response = await api.get('/admin/audit-logs/filters');
        return response.data?.data;
    },
};
