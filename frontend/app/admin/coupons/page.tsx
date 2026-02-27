'use client';

import { useState, useEffect } from 'react';
import { adminCouponService } from '@/services/adminService';
import { formatCurrency, formatDate } from '@/lib/utils'; // Correct import

interface Coupon {
    id: number;
    couponCode: string;
    pinCode: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    maxDiscountAmount: number;
    minPurchaseAmount: number;
    description: string;
    status: string;
    usageLimit: number;
    usageCount: number;
    startDate: string;
    expiryDate: string;
}

export default function CouponsManagementPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; coupon: Coupon | null }>({
        open: false,
        coupon: null,
    });
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 20;

    const [formData, setFormData] = useState({
        couponCode: '',
        pinCode: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        maxDiscountAmount: '',
        minPurchaseAmount: '',
        description: '',
        usageLimit: '',
        startDate: '',
        expiryDate: '',
        status: 'ACTIVE',
    });

    useEffect(() => {
        fetchCoupons();
    }, [currentPage]);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const response = await adminCouponService.getAllPaged({
                page: currentPage,
                size: pageSize,
                search: searchTerm || undefined,
            });
            setCoupons(response?.content || []);
            setTotalPages(response?.totalPages || 0);
            setTotalElements(response?.totalElements || 0);
        } catch (error) {
            console.error('Error fetching coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(0);
        fetchCoupons();
    };

    const openCreateModal = () => {
        setEditingCoupon(null);
        setFormData({
            couponCode: '',
            pinCode: '',
            discountType: 'PERCENTAGE',
            discountValue: '',
            maxDiscountAmount: '',
            minPurchaseAmount: '',
            description: '',
            usageLimit: '',
            startDate: '',
            expiryDate: '',
            status: 'ACTIVE',
        });
        setModalOpen(true);
    };

    const openEditModal = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            couponCode: coupon.couponCode,
            pinCode: coupon.pinCode,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue.toString(),
            maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
            minPurchaseAmount: coupon.minPurchaseAmount?.toString() || '',
            description: coupon.description || '',
            usageLimit: coupon.usageLimit?.toString() || '',
            startDate: coupon.startDate ? coupon.startDate.split('T')[0] : '',
            expiryDate: coupon.expiryDate ? coupon.expiryDate.split('T')[0] : '',
            status: coupon.status,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = {
                ...formData,
                discountValue: parseFloat(formData.discountValue) || 0,
                maxDiscountAmount: parseFloat(formData.maxDiscountAmount) || null,
                minPurchaseAmount: parseFloat(formData.minPurchaseAmount) || null,
                usageLimit: parseInt(formData.usageLimit) || null,
                startDate: formData.startDate ? `${formData.startDate}T00:00:00` : null,
                expiryDate: formData.expiryDate ? `${formData.expiryDate}T23:59:59` : null,
            };

            if (editingCoupon) {
                await adminCouponService.update(editingCoupon.id, data);
            } else {
                await adminCouponService.create(data);
            }

            await fetchCoupons();
            setModalOpen(false);
        } catch (error: any) {
            console.error('Error saving coupon:', error);
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.coupon) return;

        try {
            await adminCouponService.delete(deleteModal.coupon.id);
            await fetchCoupons();
            setDeleteModal({ open: false, coupon: null });
        } catch (error: any) {
            console.error('Error deleting coupon:', error);
            alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa coupon');
        }
    };

    // Filtering is handled server-side via getAllPaged

    const getStatusInfo = (coupon: Coupon) => {
        const now = new Date();
        const start = coupon.startDate ? new Date(coupon.startDate) : null;
        const expiry = coupon.expiryDate ? new Date(coupon.expiryDate) : null;

        if (coupon.status !== 'ACTIVE') return { label: 'Không hoạt động', color: 'bg-zinc-100 text-zinc-700' };
        if (start && start > now) return { label: 'Chưa bắt đầu', color: 'bg-yellow-100 text-yellow-700' };
        if (expiry && expiry < now) return { label: 'Hết hạn', color: 'bg-red-100 text-red-700' };
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return { label: 'Hết lượt', color: 'bg-red-100 text-red-700' };

        return { label: 'Đang hoạt động', color: 'bg-green-100 text-green-700' };
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Quản lý Coupon</h1>
                    <p className="text-zinc-500 mt-1">Quản lý mã giảm giá và chương trình khuyến mãi</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm Coupon
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 mb-6">
                <div className="relative max-w-md">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã hoặc mô tả..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Coupons Table */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Mã Coupon</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Loại giảm giá</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Giá trị giảm</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Giới hạn</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Thời gian</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Trạng thái</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-700">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {coupons.map((coupon) => {
                                const status = getStatusInfo(coupon);
                                return (
                                    <tr key={coupon.id} className="hover:bg-zinc-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-mono font-medium text-red-600">{coupon.couponCode}</div>
                                                <div className="text-xs text-zinc-500">{coupon.description}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-700">
                                            {coupon.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-zinc-900">
                                            {coupon.discountType === 'PERCENTAGE'
                                                ? `${coupon.discountValue}%`
                                                : formatCurrency(coupon.discountValue)
                                            }
                                            {coupon.maxDiscountAmount && (
                                                <div className="text-xs text-zinc-500">Tối đa: {formatCurrency(coupon.maxDiscountAmount)}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600">
                                            <div>{coupon.usageLimit ? `${coupon.usageCount}/${coupon.usageLimit}` : 'Không giới hạn'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-zinc-500">
                                            <div>Từ: {coupon.startDate ? formatDate(coupon.startDate) : '---'}</div>
                                            <div>Đến: {coupon.expiryDate ? formatDate(coupon.expiryDate) : '---'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(coupon)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ open: true, coupon })}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {coupons.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-zinc-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <p className="text-zinc-500">Không tìm thấy coupon nào</p>
                    </div>
                )}
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200">
                        <p className="text-sm text-zinc-500">
                            Hiển thị {coupons.length > 0 ? currentPage * pageSize + 1 : 0} đến {Math.min((currentPage + 1) * pageSize, totalElements)} trong số {totalElements} kết quả
                        </p>
                        <div className="flex gap-2">
                            {(() => {
                                const pages = [];
                                const siblingCount = 3;
                                const startPage = Math.max(0, currentPage - siblingCount);
                                const endPage = Math.min(totalPages - 1, currentPage + siblingCount);
                                if (startPage > 0) {
                                    pages.push(<button key="first" onClick={() => setCurrentPage(0)} className="px-3 py-1 border border-zinc-200 rounded hover:bg-zinc-50">1</button>);
                                    if (startPage > 1) pages.push(<span key="ellipsis-start" className="px-2 self-end">...</span>);
                                }
                                for (let i = startPage; i <= endPage; i++) {
                                    pages.push(
                                        <button key={i} onClick={() => setCurrentPage(i)}
                                            className={`px-3 py-1 border rounded transition-colors ${
                                                currentPage === i ? 'bg-red-600 text-white border-red-600' : 'border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
                                            }`}>{i + 1}</button>
                                    );
                                }
                                if (endPage < totalPages - 1) {
                                    if (endPage < totalPages - 2) pages.push(<span key="ellipsis-end" className="px-2 self-end">...</span>);
                                    pages.push(<button key="last" onClick={() => setCurrentPage(totalPages - 1)} className="px-3 py-1 border border-zinc-200 rounded hover:bg-zinc-50">{totalPages}</button>);
                                }
                                return pages;
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-zinc-900 mb-4">
                            {editingCoupon ? 'Chỉnh sửa Coupon' : 'Thêm Coupon mới'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Mã Coupon <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.couponCode}
                                        onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                                        required
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                                        placeholder="CPN123"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Mã PIN <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.pinCode}
                                        onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                                        placeholder="1234"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Loại giảm giá <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="PERCENTAGE">Phần trăm (%)</option>
                                        <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Giá trị giảm <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                        required
                                        min="0"
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Giảm tối đa (Nếu là %)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.maxDiscountAmount}
                                        onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                                        min="0"
                                        disabled={formData.discountType !== 'PERCENTAGE'}
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-zinc-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Đơn hàng tối thiểu
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.minPurchaseAmount}
                                        onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                                        min="0"
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    Mô tả
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Giới hạn sử dụng (Lượt)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                        min="0"
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Không giới hạn"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Ngày bắt đầu
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Ngày hết hạn
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    Trạng thái
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="ACTIVE">Hoạt động</option>
                                    <option value="INACTIVE">Ngừng hoạt động</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving && (
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    )}
                                    {editingCoupon ? 'Cập nhật' : 'Tạo mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-zinc-900 mb-2">Xác nhận xóa</h3>
                        <p className="text-zinc-600 mb-6">
                            Bạn có chắc chắn muốn xóa coupon <span className="font-medium">{deleteModal.coupon?.couponCode}</span>?
                            Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteModal({ open: false, coupon: null })}
                                className="px-4 py-2 text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
