'use client';

import { useState, useEffect } from 'react';
import { voucherService, Voucher } from '@/services/voucherService';

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [formData, setFormData] = useState<Voucher>({
        value: 50000,
        minPurchaseAmount: 100000,
        status: 'ACTIVE',
        description: ''
    });

    useEffect(() => {
        fetchVouchers();
    }, [page]);

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const response = await voucherService.getAll(page);
            if (response && response.data) {
                setVouchers(response.data.content);
                setTotalPages(response.data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching vouchers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await voucherService.create(formData);
            setModalOpen(false);
            fetchVouchers();
            alert('Tạo voucher thành công!');
        } catch (error) {
            console.error('Error creating voucher:', error);
            alert('Lỗi khi tạo voucher');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa voucher này?')) return;
        try {
            await voucherService.delete(id);
            fetchVouchers();
        } catch (error) {
            console.error('Error deleting voucher:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-zinc-900">Quản lý Voucher</h1>
                <button
                    onClick={() => setModalOpen(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                    + Tạo Voucher Mới
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-zinc-500">Mã Voucher</th>
                            <th className="px-6 py-3 font-medium text-zinc-500">PIN</th>
                            <th className="px-6 py-3 font-medium text-zinc-500">Giá trị</th>
                            <th className="px-6 py-3 font-medium text-zinc-500">Đơn tối thiểu</th>
                            <th className="px-6 py-3 font-medium text-zinc-500">Trạng thái</th>
                            <th className="px-6 py-3 text-right font-medium text-zinc-500">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                        {vouchers.map((v) => (
                            <tr key={v.id} className="hover:bg-zinc-50">
                                <td className="px-6 py-4 font-mono font-bold text-zinc-900">{v.voucherCode}</td>
                                <td className="px-6 py-4 font-mono text-zinc-600">{v.pinCode}</td>
                                <td className="px-6 py-4 font-bold text-green-600">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.value)}
                                </td>
                                <td className="px-6 py-4 text-zinc-600">
                                    {v.minPurchaseAmount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.minPurchaseAmount) : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${v.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                            v.status === 'USED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {v.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(v.id!)} className="text-red-600 hover:underline">Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Pagination Controls could be added here similar to AuditLogs */}
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Tạo Voucher Mới</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Giá trị (VND)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    value={formData.value}
                                    onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Đơn tối thiểu (VND)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    value={formData.minPurchaseAmount}
                                    onChange={e => setFormData({ ...formData, minPurchaseAmount: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-zinc-100 rounded">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">Tạo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
