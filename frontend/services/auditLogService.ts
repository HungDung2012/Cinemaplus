import api from '@/lib/axios';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT';

export interface AuditLog {
  id: number;
  action: AuditAction;
  entityName: string;
  entityId?: string | null;
  userId?: number | null;
  username?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilters {
  userId?: number;
  username?: string;
  action?: AuditAction | '';
  entityName?: string;
  userRole?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AuditLogFilterOptions {
  actions: string[];
  entityNames: string[];
  usernames: string[];
  roles: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export const auditLogService = {
  getLogs: async (
    page: number = 0,
    size: number = 20,
    filters?: AuditLogFilters,
  ) => {
    const params: Record<string, string | number> = { page, size };

    if (filters) {
      if (filters.userId) params.userId = filters.userId;
      if (filters.username) params.username = filters.username;
      if (filters.action) params.action = filters.action;
      if (filters.entityName) params.entityName = filters.entityName;
      if (filters.userRole) params.userRole = filters.userRole;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
    }

    const response = await api.get('/admin/audit-logs', { params });
    return response.data as { data: PageResponse<AuditLog> };
  },

  getById: async (id: number) => {
    const response = await api.get(`/admin/audit-logs/${id}`);
    return response.data as { data: AuditLog };
  },

  getFilterOptions: async (): Promise<AuditLogFilterOptions> => {
    const response = await api.get('/admin/audit-logs/filters');
    return response.data?.data;
  },
};
