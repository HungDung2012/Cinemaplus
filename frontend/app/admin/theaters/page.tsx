'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminTheaterService } from '@/services/adminService';

interface Theater {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  totalRooms?: number;
  imageUrl?: string;
  createdAt?: string;
}

export default function TheatersManagementPage() {
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; theater: Theater | null }>({
    open: false,
    theater: null,
  });

  useEffect(() => {
    fetchTheaters();
  }, []);

  const fetchTheaters = async () => {
    try {
      const response = await adminTheaterService.getAll();
      setTheaters(response);
    } catch (error) {
      console.error('Error fetching theaters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.theater) return;

    try {
      await adminTheaterService.delete(deleteModal.theater.id);
      setTheaters(theaters.filter(t => t.id !== deleteModal.theater?.id));
      setDeleteModal({ open: false, theater: null });
    } catch (error: any) {
      console.error('Error deleting theater:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa rạp');
    }
  };

  const filteredTheaters = theaters.filter(theater =>
    theater.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theater.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theater.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý rạp chiếu</h1>
          <p className="text-zinc-500 mt-1">Quản lý danh sách các rạp chiếu phim</p>
        </div>
        <Link
          href="/admin/theaters/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm rạp mới
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm rạp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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

      {/* Theaters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTheaters.map((theater) => (
          <div
            key={theater.id}
            className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="h-40 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              {theater.imageUrl ? (
                <img src={theater.imageUrl} alt={theater.name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-16 h-16 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-zinc-900 mb-2">{theater.name}</h3>
              <div className="space-y-2 text-sm text-zinc-600">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="line-clamp-2">{theater.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{theater.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{theater.email || 'Chưa cập nhật'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100">
                <Link
                  href={`/admin/theaters/${theater.id}/edit`}
                  className="flex-1 px-3 py-2 text-center text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Chỉnh sửa
                </Link>
                <Link
                  href={`/admin/theaters/${theater.id}/rooms`}
                  className="flex-1 px-3 py-2 text-center text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Phòng chiếu
                </Link>
                <button
                  onClick={() => setDeleteModal({ open: true, theater })}
                  className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTheaters.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
          <svg className="w-16 h-16 text-zinc-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-zinc-500">Không tìm thấy rạp chiếu nào</p>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Xác nhận xóa</h3>
            <p className="text-zinc-600 mb-6">
              Bạn có chắc chắn muốn xóa rạp <span className="font-medium">{deleteModal.theater?.name}</span>?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ open: false, theater: null })}
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
