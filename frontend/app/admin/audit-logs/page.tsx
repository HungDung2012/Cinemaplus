'use client';

import { useState, useEffect, useCallback } from 'react';
import { auditLogService, AuditLog, AuditLogFilters, AuditLogFilterOptions } from '@/services/auditLogService';

const ACTION_COLORS: Record<string, string> = {
    CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
    DELETE: 'bg-red-50 text-red-700 border-red-200',
    BATCH_CREATE: 'bg-purple-50 text-purple-700 border-purple-200',
    BATCH_UPDATE: 'bg-purple-50 text-purple-700 border-purple-200',
    BATCH_DELETE: 'bg-purple-50 text-purple-700 border-purple-200',
};
const DEFAULT_ACTION_COLOR = 'bg-zinc-50 text-zinc-700 border-zinc-200';

const ROLE_BADGES: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-800',
    MANAGER: 'bg-amber-100 text-amber-800',
    STAFF: 'bg-sky-100 text-sky-800',
    TECHNICIAN: 'bg-violet-100 text-violet-800',
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    // Filters
    const [filters, setFilters] = useState<AuditLogFilters>({});
    const [filterOptions, setFilterOptions] = useState<AuditLogFilterOptions>({
        actions: [], entityNames: [], usernames: [],
    });
    const [showFilters, setShowFilters] = useState(false);

    // Load filter options once
    useEffect(() => {
        auditLogService.getFilterOptions().then(res => {
            if (res) setFilterOptions(res);
        }).catch(() => {});
    }, []);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await auditLogService.getAll(page, 20, filters);
            if (response?.data) {
                setLogs(response.data.content);
                setTotalPages(response.data.totalPages);
                setTotalElements(response.data.totalElements);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const applyFilter = (key: keyof AuditLogFilters, value: string) => {
        setPage(0);
        setFilters(prev => ({ ...prev, [key]: value || undefined }));
    };

    const clearFilters = () => {
        setPage(0);
        setFilters({});
    };

    const hasActiveFilters = Object.values(filters).some(v => v);

    const formatJson = (json: string | null | undefined) => {
        if (!json) return null;
        try {
            return JSON.stringify(JSON.parse(json), null, 2);
        } catch {
            return json;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Nhật Ký Hoạt Động</h1>
                    <p className="text-sm text-zinc-500 mt-1">Theo dõi mọi thao tác của nhân viên trong hệ thống</p>
                </div>
                <button
                    onClick={() => setShowFilters(f => !f)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
                        showFilters || hasActiveFilters
                            ? 'bg-orange-50 border-orange-300 text-orange-700'
                            : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Bộ lọc {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Người dùng</label>
                            <select
                                value={filters.username || ''}
                                onChange={e => applyFilter('username', e.target.value)}
                                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="">Tất cả</option>
                                {filterOptions.usernames.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Hành động</label>
                            <select
                                value={filters.action || ''}
                                onChange={e => applyFilter('action', e.target.value)}
                                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="">Tất cả</option>
                                {filterOptions.actions.map(a => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Đối tượng</label>
                            <select
                                value={filters.entityName || ''}
                                onChange={e => applyFilter('entityName', e.target.value)}
                                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="">Tất cả</option>
                                {filterOptions.entityNames.map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Vai trò</label>
                            <select
                                value={filters.userRole || ''}
                                onChange={e => applyFilter('userRole', e.target.value)}
                                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="">Tất cả</option>
                                <option value="ADMIN">Admin</option>
                                <option value="MANAGER">Manager</option>
                                <option value="STAFF">Staff</option>
                                <option value="TECHNICIAN">Technician</option>
                            </select>
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <div className="mt-4 flex justify-end">
                            <button onClick={clearFilters} className="text-sm text-orange-600 hover:text-orange-800 font-medium">
                                Xóa tất cả bộ lọc
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Thời gian</th>
                                <th className="px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Người dùng</th>
                                <th className="px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Vai trò</th>
                                <th className="px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Hành động</th>
                                <th className="px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Đối tượng</th>
                                <th className="px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Chi tiết</th>
                                <th className="px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">IP</th>
                                <th className="px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <div className="inline-flex items-center gap-2 text-zinc-500">
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Đang tải...
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-zinc-400">
                                        Chưa có nhật ký nào {hasActiveFilters && '(thử xóa bộ lọc)'}
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const actionColor = ACTION_COLORS[log.action] || DEFAULT_ACTION_COLOR;
                                    const roleBadge = log.userRole ? ROLE_BADGES[log.userRole] : null;
                                    const hasChanges = log.oldValue || log.newValue;
                                    const isExpanded = expandedRow === log.id;

                                    return (
                                        <tr key={log.id} className="group hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-5 py-3 text-sm text-zinc-600 whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="px-5 py-3 font-medium text-zinc-900 text-sm">{log.username || 'N/A'}</td>
                                            <td className="px-5 py-3">
                                                {roleBadge ? (
                                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${roleBadge}`}>
                                                        {log.userRole}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-zinc-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${actionColor}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-zinc-700">
                                                {log.entityName || '-'}
                                                {log.entityId && <span className="text-zinc-400 ml-1">#{log.entityId}</span>}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-zinc-600 max-w-[200px] truncate" title={log.details || ''}>
                                                {log.details || '-'}
                                            </td>
                                            <td className="px-5 py-3 text-xs text-zinc-400 font-mono">{log.ipAddress || '-'}</td>
                                            <td className="px-5 py-3">
                                                {hasChanges && (
                                                    <button
                                                        onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                                                        className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition"
                                                        title="Xem thay đổi chi tiết"
                                                    >
                                                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Expanded Change Details */}
                {expandedRow && logs.find(l => l.id === expandedRow) && (() => {
                    const log = logs.find(l => l.id === expandedRow)!;
                    return (
                        <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4">
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Chi tiết thay đổi</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {log.oldValue && (
                                    <div>
                                        <p className="text-xs font-medium text-red-600 mb-1">Giá trị cũ</p>
                                        <pre className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs overflow-auto max-h-64 text-red-900">
                                            {formatJson(log.oldValue)}
                                        </pre>
                                    </div>
                                )}
                                {log.newValue && (
                                    <div>
                                        <p className="text-xs font-medium text-emerald-600 mb-1">Giá trị mới</p>
                                        <pre className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs overflow-auto max-h-64 text-emerald-900">
                                            {formatJson(log.newValue)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Pagination */}
                <div className="px-5 py-3 border-t border-zinc-200 flex justify-between items-center bg-zinc-50/50">
                    <span className="text-sm text-zinc-500">
                        Trang {page + 1} / {totalPages || 1} &middot; {totalElements} bản ghi
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(0)}
                            className="px-2.5 py-1.5 border rounded-lg text-xs hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                            title="Trang đầu"
                        >
                            &#171;
                        </button>
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1.5 border rounded-lg text-xs hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            Trước
                        </button>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1.5 border rounded-lg text-xs hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            Sau
                        </button>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(totalPages - 1)}
                            className="px-2.5 py-1.5 border rounded-lg text-xs hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                            title="Trang cuối"
                        >
                            &#187;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
