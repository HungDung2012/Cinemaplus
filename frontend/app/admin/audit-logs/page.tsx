'use client';

import { useState, useEffect } from 'react';
import { auditLogService, AuditLog } from '@/services/auditLogService';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await auditLogService.getAll(page);
            if (response && response.data) {
                setLogs(response.data.content);
                setTotalPages(response.data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-zinc-900">Nhật Ký Hoạt Động (Audit Logs)</h1>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-3 font-medium text-zinc-500">Thời gian</th>
                                <th className="px-6 py-3 font-medium text-zinc-500">Người dùng</th>
                                <th className="px-6 py-3 font-medium text-zinc-500">Hành động</th>
                                <th className="px-6 py-3 font-medium text-zinc-500">Chi tiết</th>
                                <th className="px-6 py-3 font-medium text-zinc-500">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center">Đang tải...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center">Chưa có nhật ký nào</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-zinc-50">
                                        <td className="px-6 py-4 text-sm text-zinc-600">
                                            {new Date(log.timestamp).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-zinc-900">{log.username || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                                                {log.action}
                                            </span>
                                            {log.entityName && <span className="text-xs text-zinc-500 ml-2">({log.entityName})</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-600 max-w-xs truncate" title={log.details}>
                                            {log.details || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500">{log.ipAddress || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-zinc-200 flex justify-between items-center">
                    <span className="text-sm text-zinc-500">Trang {page + 1} / {totalPages || 1}</span>
                    <div className="space-x-2">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 border rounded hover:bg-zinc-50 disabled:opacity-50"
                        >
                            Trước
                        </button>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 border rounded hover:bg-zinc-50 disabled:opacity-50"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
