'use client';

import { useState, useEffect } from 'react';
import { adminPromotionService } from '@/services/adminService';

interface Promotion {
  id: number;
  title: string;
  description: string;
  code: string;
  discountType: string;
  discountValue: number;
  minPurchase: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  imageUrl: string;
  usageLimit: number;
  usageCount: number;
  active: boolean;
}

const DISCOUNT_TYPES = [
  { value: 'PERCENTAGE', label: 'Phần trăm (%)' },
  { value: 'FIXED', label: 'Số tiền cố định (VNĐ)' },
];

export default function PromotionsManagementPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; promotion: Promotion | null }>({
    open: false,
    promotion: null,
  });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minPurchase: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    imageUrl: '',
    usageLimit: '',
    active: true,
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await adminPromotionService.getAll();
      setPromotions(response);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPromotion(null);
    setFormData({
      title: '',
      description: '',
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minPurchase: '',
      maxDiscount: '',
      startDate: '',
      endDate: '',
      imageUrl: '',
      usageLimit: '',
      active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      title: promotion.title || '',
      description: promotion.description || '',
      code: promotion.code || '',
      discountType: promotion.discountType || 'PERCENTAGE',
      discountValue: promotion.discountValue?.toString() || '',
      minPurchase: promotion.minPurchase?.toString() || '',
      maxDiscount: promotion.maxDiscount?.toString() || '',
      startDate: promotion.startDate ? promotion.startDate.split('T')[0] : '',
      endDate: promotion.endDate ? promotion.endDate.split('T')[0] : '',
      imageUrl: promotion.imageUrl || '',
      usageLimit: promotion.usageLimit?.toString() || '',
      active: promotion.active !== false,
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
        minPurchase: parseFloat(formData.minPurchase) || 0,
        maxDiscount: parseFloat(formData.maxDiscount) || 0,
        usageLimit: parseInt(formData.usageLimit) || 0,
      };

      if (editingPromotion) {
        await adminPromotionService.update(editingPromotion.id, data);
      } else {
        await adminPromotionService.create(data);
      }

      await fetchPromotions();
      setModalOpen(false);
    } catch (error: any) {
      console.error('Error saving promotion:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.promotion) return;

    try {
      await adminPromotionService.delete(deleteModal.promotion.id);
      setPromotions(promotions.filter(p => p.id !== deleteModal.promotion?.id));
      setDeleteModal({ open: false, promotion: null });
    } catch (error: any) {
      console.error('Error deleting promotion:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa khuyến mãi');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);
    
    if (!promotion.active) return { label: 'Tắt', color: 'bg-zinc-100 text-zinc-700' };
    if (now < start) return { label: 'Sắp diễn ra', color: 'bg-blue-100 text-blue-700' };
    if (now > end) return { label: 'Hết hạn', color: 'bg-red-100 text-red-700' };
    return { label: 'Đang hoạt động', color: 'bg-green-100 text-green-700' };
  };

  const filteredPromotions = promotions.filter(promotion => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !promotion.title?.toLowerCase().includes(search) &&
        !promotion.code?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    return true;
  });

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
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý khuyến mãi</h1>
          <p className="text-zinc-500 mt-1">Quản lý mã giảm giá và chương trình khuyến mãi</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm khuyến mãi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-zinc-900">{promotions.length}</div>
          <div className="text-sm text-zinc-500">Tổng khuyến mãi</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-green-600">
            {promotions.filter(p => {
              const now = new Date();
              return p.active && new Date(p.startDate) <= now && new Date(p.endDate) >= now;
            }).length}
          </div>
          <div className="text-sm text-zinc-500">Đang hoạt động</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-blue-600">
            {promotions.filter(p => new Date(p.startDate) > new Date()).length}
          </div>
          <div className="text-sm text-zinc-500">Sắp diễn ra</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-red-600">
            {promotions.filter(p => new Date(p.endDate) < new Date()).length}
          </div>
          <div className="text-sm text-zinc-500">Đã hết hạn</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Promotions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Khuyến mãi</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Mã</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Giảm giá</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Thời gian</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Đã dùng</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Trạng thái</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredPromotions.map((promotion) => {
                const status = getPromotionStatus(promotion);
                
                return (
                  <tr key={promotion.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {promotion.imageUrl && (
                          <img
                            src={promotion.imageUrl}
                            alt=""
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium text-zinc-900">{promotion.title}</div>
                          <div className="text-sm text-zinc-500 line-clamp-1">{promotion.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                        {promotion.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900">
                        {promotion.discountType === 'PERCENTAGE' 
                          ? `${promotion.discountValue}%`
                          : formatPrice(promotion.discountValue)
                        }
                      </div>
                      {promotion.maxDiscount > 0 && (
                        <div className="text-sm text-zinc-500">
                          Tối đa: {formatPrice(promotion.maxDiscount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-900">{formatDate(promotion.startDate)}</div>
                      <div className="text-sm text-zinc-500">đến {formatDate(promotion.endDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-900">
                        {promotion.usageCount || 0}
                        {promotion.usageLimit > 0 && ` / ${promotion.usageLimit}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(promotion)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, promotion })}
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

        {filteredPromotions.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-zinc-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className="text-zinc-500">Không tìm thấy khuyến mãi nào</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">
              {editingPromotion ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Giảm 20% cuối tuần"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Mã khuyến mãi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                    placeholder="WEEKEND20"
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
                    Loại giảm giá
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {DISCOUNT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
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
                    placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '50000'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    min="0"
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="100000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Đơn tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    min="0"
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="100000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Giới hạn sử dụng
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    min="0"
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0 = không giới hạn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  URL Hình ảnh
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <label htmlFor="active" className="text-sm text-zinc-700">
                  Kích hoạt khuyến mãi
                </label>
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
                  {editingPromotion ? 'Cập nhật' : 'Tạo mới'}
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
              Bạn có chắc chắn muốn xóa khuyến mãi <span className="font-medium">{deleteModal.promotion?.title}</span>?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ open: false, promotion: null })}
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
