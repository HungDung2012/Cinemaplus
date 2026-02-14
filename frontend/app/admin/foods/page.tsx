'use client';

import { useState, useEffect } from 'react';
import { adminFoodService } from '@/services/adminService';

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  active: boolean;
}

const CATEGORIES = [
  { value: 'POPCORN', label: 'Bắp rang' },
  { value: 'DRINK', label: 'Nước uống' },
  { value: 'COMBO', label: 'Combo' },
  { value: 'SNACK', label: 'Đồ ăn nhẹ' },
  { value: 'OTHER', label: 'Khác' },
];

export default function FoodsManagementPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; food: Food | null }>({
    open: false,
    food: null,
  });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'POPCORN',
    status: 'AVAILABLE', // AVAILABLE, OUT_OF_STOCK, HIDDEN
  });

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const response = await adminFoodService.getAll();
      setFoods(response);
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingFood(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      category: 'POPCORN',
      status: 'AVAILABLE',
    });
    setModalOpen(true);
  };

  const openEditModal = (food: Food) => {
    setEditingFood(food);

    let status = 'HIDDEN';
    if (food.active) {
      status = food.isAvailable ? 'AVAILABLE' : 'OUT_OF_STOCK';
    }

    setFormData({
      name: food.name || '',
      description: food.description || '',
      price: food.price?.toString() || '',
      imageUrl: food.imageUrl || '',
      category: food.category || 'POPCORN',
      status: status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl,
        category: formData.category,
        size: 'LARGE', // Default size if not managed
        active: formData.status !== 'HIDDEN',
        isAvailable: formData.status === 'AVAILABLE',
      };

      if (editingFood) {
        await adminFoodService.update(editingFood.id, payload);
      } else {
        await adminFoodService.create(payload);
      }

      await fetchFoods();
      setModalOpen(false);
    } catch (error: any) {
      console.error('Error saving food:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.food) return;

    try {
      await adminFoodService.delete(deleteModal.food.id);
      setFoods(foods.filter(f => f.id !== deleteModal.food?.id));
      setDeleteModal({ open: false, food: null });
    } catch (error: any) {
      console.error('Error deleting food:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const filteredFoods = foods.filter(food => {
    if (categoryFilter && food.category !== categoryFilter) return false;
    if (searchTerm && !food.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
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
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý đồ ăn & nước</h1>
          <p className="text-zinc-500 mt-1">Quản lý menu bắp nước và combo</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm sản phẩm
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
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
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tất cả danh mục</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <button
            onClick={() => { setSearchTerm(''); setCategoryFilter(''); }}
            className="px-4 py-2 text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Foods Table */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Hình ảnh</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Tên món</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Danh mục</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Giá</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Trạng thái</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredFoods.map((food) => (
                <tr key={food.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4 w-24">
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden">
                      {food.imageUrl ? (
                        <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{food.name}</div>
                    <div className="text-sm text-zinc-500 line-clamp-1">{food.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-zinc-100 rounded text-xs font-medium text-zinc-700">
                      {getCategoryLabel(food.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-red-600">
                    {formatPrice(food.price)}
                  </td>
                  <td className="px-6 py-4">
                    {!food.active ? (
                      <span className="px-2 py-1 bg-zinc-100 text-zinc-500 rounded-full text-xs font-medium border border-zinc-200">
                        Đang ẩn
                      </span>
                    ) : food.isAvailable ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Còn hàng
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        Hết hàng
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(food)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, food })}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFoods.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-zinc-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-zinc-500">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">
              {editingFood ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Bắp rang bơ lớn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Mô tả sản phẩm..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Giá (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="50000"
                />
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
                {formData.imageUrl && (
                  <img src={formData.imageUrl} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-lg" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Danh mục
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
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
                  <option value="AVAILABLE">Đang bán (Còn hàng)</option>
                  <option value="OUT_OF_STOCK">Hết hàng (Hiển thị nhưng không bán)</option>
                  <option value="HIDDEN">Ẩn (Không hiển thị)</option>
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
                  {editingFood ? 'Cập nhật' : 'Tạo mới'}
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
              Bạn có chắc chắn muốn xóa sản phẩm <span className="font-medium">{deleteModal.food?.name}</span>?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ open: false, food: null })}
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
