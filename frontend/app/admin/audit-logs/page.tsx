'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarRange,
  Eye,
  Filter,
  History,
  RefreshCcw,
  ShieldCheck,
  UserRound,
  Waypoints,
} from 'lucide-react';

import AuditLogDiffModal from '@/components/admin/AuditLogDiffModal';
import { cn, formatDateTime } from '@/lib/utils';
import {
  auditLogService,
  type AuditLog,
  type AuditLogFilterOptions,
  type AuditLogFilters,
} from '@/services/auditLogService';

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  UPDATE: 'border-amber-200 bg-amber-50 text-amber-700',
  DELETE: 'border-rose-200 bg-rose-50 text-rose-700',
  LOGIN: 'border-sky-200 bg-sky-50 text-sky-700',
  EXPORT: 'border-violet-200 bg-violet-50 text-violet-700',
};

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-rose-100 text-rose-700',
  MANAGER: 'bg-amber-100 text-amber-700',
  STAFF: 'bg-sky-100 text-sky-700',
  TECHNICIAN: 'bg-violet-100 text-violet-700',
};

function flattenJson(value: unknown, parentPath = ''): Map<string, unknown> {
  const rows = new Map<string, unknown>();

  if (Array.isArray(value)) {
    if (value.length === 0) {
      rows.set(parentPath || '(root)', []);
      return rows;
    }

    value.forEach((item, index) => {
      const nextPath = parentPath ? `${parentPath}[${index}]` : `[${index}]`;
      const nested = flattenJson(item, nextPath);
      nested.forEach((nestedValue, nestedPath) => rows.set(nestedPath, nestedValue));
    });

    return rows;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      rows.set(parentPath || '(root)', {});
      return rows;
    }

    entries.forEach(([key, nestedValue]) => {
      const nextPath = parentPath ? `${parentPath}.${key}` : key;
      const nested = flattenJson(nestedValue, nextPath);
      nested.forEach((valueAtPath, nestedPath) => rows.set(nestedPath, valueAtPath));
    });

    return rows;
  }

  rows.set(parentPath || '(root)', value);
  return rows;
}

function countChangedFields(log: AuditLog): number {
  const oldMap = flattenJson(log.oldValues ?? {});
  const newMap = flattenJson(log.newValues ?? {});
  const keys = new Set([...oldMap.keys(), ...newMap.keys()]);

  let changed = 0;
  keys.forEach((key) => {
    const oldValue = JSON.stringify(oldMap.get(key));
    const newValue = JSON.stringify(newMap.get(key));
    if (oldValue !== newValue) {
      changed += 1;
    }
  });

  return changed;
}

function toDateTimeLocal(value?: string) {
  if (!value) return '';
  return value.slice(0, 16);
}

function formatAuditDate(value?: string | null) {
  return value ? formatDateTime(value) : '-';
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [filterOptions, setFilterOptions] = useState<AuditLogFilterOptions>({
    actions: [],
    entityNames: [],
    usernames: [],
    roles: [],
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  );

  const currentPageChangedFields = useMemo(
    () => logs.reduce((total, log) => total + countChangedFields(log), 0),
    [logs],
  );

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await auditLogService.getLogs(page, 20, filters);
      const payload = response?.data;

      if (payload) {
        setLogs(payload.content ?? []);
        setTotalPages(payload.totalPages ?? 0);
        setTotalElements(payload.totalElements ?? 0);
      }
    } catch (error) {
      console.error('Failed to load audit logs', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    auditLogService
      .getFilterOptions()
      .then((response) => setFilterOptions(response))
      .catch((error) => console.error('Failed to load audit filters', error));
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const updateFilter = <K extends keyof AuditLogFilters>(key: K, value: AuditLogFilters[K]) => {
    setPage(0);
    setFilters((current) => ({
      ...current,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setPage(0);
    setFilters({});
  };

  return (
    <>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-sm">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.4fr_0.9fr] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 shadow-sm">
                <History className="h-3.5 w-3.5" />
                Audit Trail
              </div>
              <h1 className="mt-4 text-3xl font-bold text-slate-900">Nhật ký hoạt động hệ thống</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Theo dõi đầy đủ 5W1H: ai thao tác, đã thay đổi gì, khi nào, từ đâu, lý do gì và diff trước/sau cho từng bản ghi.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Total Logs
                </div>
                <div className="mt-3 text-3xl font-bold text-slate-900">{totalElements}</div>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Filter className="h-3.5 w-3.5" />
                  Active Filters
                </div>
                <div className="mt-3 text-3xl font-bold text-slate-900">{activeFilterCount}</div>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Waypoints className="h-3.5 w-3.5" />
                  Changed Fields
                </div>
                <div className="mt-3 text-3xl font-bold text-slate-900">{currentPageChangedFields}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Bộ lọc nâng cao</h2>
              <p className="mt-1 text-sm text-slate-500">
                Lọc theo người thao tác, hành động, thực thể và khoảng thời gian.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={fetchLogs}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Làm mới
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 transition hover:bg-orange-100"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Người dùng</span>
              <select
                value={filters.username ?? ''}
                onChange={(event) => updateFilter('username', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:bg-white"
              >
                <option value="">Tất cả người dùng</option>
                {filterOptions.usernames.map((username) => (
                  <option key={username} value={username}>
                    {username}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vai trò</span>
              <select
                value={filters.userRole ?? ''}
                onChange={(event) => updateFilter('userRole', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:bg-white"
              >
                <option value="">Tất cả vai trò</option>
                {filterOptions.roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hành động</span>
              <select
                value={filters.action ?? ''}
                onChange={(event) => updateFilter('action', event.target.value as AuditLogFilters['action'])}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:bg-white"
              >
                <option value="">Tất cả hành động</option>
                {filterOptions.actions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Thực thể</span>
              <select
                value={filters.entityName ?? ''}
                onChange={(event) => updateFilter('entityName', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:bg-white"
              >
                <option value="">Tất cả thực thể</option>
                {filterOptions.entityNames.map((entityName) => (
                  <option key={entityName} value={entityName}>
                    {entityName}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <CalendarRange className="h-3.5 w-3.5" />
                Từ thời điểm
              </span>
              <input
                type="datetime-local"
                value={toDateTimeLocal(filters.fromDate)}
                onChange={(event) => updateFilter('fromDate', event.target.value || undefined)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:bg-white"
              />
            </label>

            <label className="space-y-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <CalendarRange className="h-3.5 w-3.5" />
                Đến thời điểm
              </span>
              <input
                type="datetime-local"
                value={toDateTimeLocal(filters.toDate)}
                onChange={(event) => updateFilter('toDate', event.target.value || undefined)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:bg-white"
              />
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4">Who</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">What</th>
                  <th className="px-6 py-4">Why</th>
                  <th className="px-6 py-4">Where</th>
                  <th className="px-6 py-4">Diff</th>
                  <th className="px-6 py-4 text-right">Chi tiết</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-5">
                        <div className="h-4 w-36 rounded-full bg-slate-100" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 w-40 rounded-full bg-slate-100" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-7 w-20 rounded-full bg-slate-100" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 w-32 rounded-full bg-slate-100" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 w-28 rounded-full bg-slate-100" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 w-48 rounded-full bg-slate-100" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 w-14 rounded-full bg-slate-100" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="ml-auto h-9 w-24 rounded-xl bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <History className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-slate-900">Không có bản ghi phù hợp</h3>
                        <p className="mt-2 text-sm text-slate-500">
                          Thử nới rộng bộ lọc hoặc làm mới để tải lại dữ liệu audit mới nhất.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const changedFields = countChangedFields(log);

                    return (
                      <tr key={log.id} className="transition hover:bg-slate-50/80">
                        <td className="px-6 py-5 align-top">
                          <div className="text-sm font-medium text-slate-900">{formatAuditDate(log.createdAt)}</div>
                          <div className="mt-1 text-xs text-slate-500">Log ID: #{log.id}</div>
                        </td>

                        <td className="px-6 py-5 align-top">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                              <UserRound className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">
                                {log.username || 'Anonymous'}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-slate-500">ID: {log.userId ?? '-'}</span>
                                {log.userRole ? (
                                  <span
                                    className={cn(
                                      'rounded-full px-2 py-1 text-[11px] font-semibold',
                                      ROLE_STYLES[log.userRole] || 'bg-slate-100 text-slate-600',
                                    )}
                                  >
                                    {log.userRole}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 align-top">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                              ACTION_STYLES[log.action] || 'border-slate-200 bg-slate-100 text-slate-700',
                            )}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="px-6 py-5 align-top">
                          <div className="text-sm font-semibold text-slate-900">{log.entityName}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            Entity ID: {log.entityId || 'N/A'}
                          </div>
                        </td>

                        <td className="px-6 py-5 align-top">
                          <div className="max-w-xs text-sm text-slate-700">
                            {log.reason || <span className="text-slate-400">Không có lý do</span>}
                          </div>
                        </td>

                        <td className="px-6 py-5 align-top">
                          <div className="text-sm font-medium text-slate-900">{log.ipAddress || '-'}</div>
                          <div className="mt-1 max-w-xs truncate text-xs text-slate-500" title={log.userAgent || ''}>
                            {log.userAgent || 'Unknown user agent'}
                          </div>
                        </td>

                        <td className="px-6 py-5 align-top">
                          <div className="text-sm font-semibold text-slate-900">{changedFields}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {log.oldValues || log.newValues ? 'Trường thay đổi' : 'Không có diff'}
                          </div>
                        </td>

                        <td className="px-6 py-5 align-top text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                          >
                            <Eye className="h-4 w-4" />
                            Xem diff
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500">
              Trang <span className="font-semibold text-slate-900">{page + 1}</span> /{' '}
              <span className="font-semibold text-slate-900">{Math.max(totalPages, 1)}</span>
              {' · '}
              Tổng <span className="font-semibold text-slate-900">{totalElements}</span> bản ghi
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Đầu
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                disabled={page === 0}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={page >= totalPages - 1 || totalPages === 0}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sau
              </button>
              <button
                type="button"
                onClick={() => setPage(Math.max(totalPages - 1, 0))}
                disabled={page >= totalPages - 1 || totalPages === 0}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cuối
              </button>
            </div>
          </div>
        </section>
      </div>

      <AuditLogDiffModal
        open={Boolean(selectedLog)}
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </>
  );
}
