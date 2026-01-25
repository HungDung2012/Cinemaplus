'use client';

import { useState, useEffect } from 'react';
import { adminReviewService } from '@/services/adminService';

interface Review {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  movieId: number;
  movieTitle: string;
  moviePoster: string;
  rating: number;
  content: string;
  createdAt: string;
}

export default function ReviewsManagementPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; review: Review | null }>({
    open: false,
    review: null,
  });
  const [detailModal, setDetailModal] = useState<{ open: boolean; review: Review | null }>({
    open: false,
    review: null,
  });
  const [filters, setFilters] = useState({
    searchTerm: '',
    rating: '',
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await adminReviewService.getAll();
      setReviews(response);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.review) return;

    try {
      await adminReviewService.delete(deleteModal.review.id);
      setReviews(reviews.filter(r => r.id !== deleteModal.review?.id));
      setDeleteModal({ open: false, review: null });
    } catch (error: any) {
      console.error('Error deleting review:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa đánh giá');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        ))}
      </div>
    );
  };

  const filteredReviews = reviews.filter(review => {
    if (filters.rating && review.rating !== parseInt(filters.rating)) return false;
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      if (
        !review.userName?.toLowerCase().includes(search) &&
        !review.movieTitle?.toLowerCase().includes(search) &&
        !review.content?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    return true;
  });

  // Calculate stats
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Quản lý đánh giá</h1>
        <p className="text-zinc-500 mt-1">Xem và quản lý đánh giá của người dùng về phim</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-zinc-900">{reviews.length}</div>
          <div className="text-sm text-zinc-500">Tổng đánh giá</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-yellow-500 flex items-center gap-1">
            {avgRating}
            <svg className="w-5 h-5 fill-yellow-400" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div className="text-sm text-zinc-500">Điểm trung bình</div>
        </div>
        {[5, 4, 3].map(star => (
          <div key={star} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
            <div className="text-2xl font-bold text-zinc-900">
              {reviews.filter(r => r.rating === star).length}
            </div>
            <div className="text-sm text-zinc-500 flex items-center gap-1">
              {star} <svg className="w-3 h-3 fill-yellow-400" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
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
            value={filters.rating}
            onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
            className="px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tất cả đánh giá</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
          <button
            onClick={() => setFilters({ searchTerm: '', rating: '' })}
            className="px-4 py-2 text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Người dùng</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Phim</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Đánh giá</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Nội dung</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Ngày tạo</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredReviews.map((review) => (
                <tr key={review.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-medium">
                        {review.userAvatar ? (
                          <img src={review.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          review.userName?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-zinc-900">{review.userName}</div>
                        {/* Email not available in flat DTO, omitted */}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {review.moviePoster && (
                        <img
                          src={review.moviePoster}
                          alt=""
                          className="w-10 h-14 rounded object-cover"
                        />
                      )}
                      <span className="font-medium text-zinc-900">{review.movieTitle}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {renderStars(review.rating)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-zinc-600 line-clamp-2 max-w-xs">{review.content}</p>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {formatDate(review.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDetailModal({ open: true, review })}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, review })}
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

        {filteredReviews.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-zinc-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-zinc-500">Không tìm thấy đánh giá nào</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal.open && detailModal.review && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900">Chi tiết đánh giá</h3>
              <button
                onClick={() => setDetailModal({ open: false, review: null })}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-medium">
                  {detailModal.review.userAvatar ? (
                    <img src={detailModal.review.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    detailModal.review.userName?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <div className="font-medium text-zinc-900">{detailModal.review.userName}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                {detailModal.review.moviePoster && (
                  <img
                    src={detailModal.review.moviePoster}
                    alt=""
                    className="w-14 h-20 rounded object-cover"
                  />
                )}
                <div>
                  <div className="font-medium text-zinc-900">{detailModal.review.movieTitle}</div>
                  <div className="mt-1">{renderStars(detailModal.review.rating)}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-zinc-500 mb-1">Nội dung đánh giá</div>
                <p className="text-zinc-700 whitespace-pre-wrap">{detailModal.review.content}</p>
              </div>

              <div className="text-sm text-zinc-500">
                Đăng lúc: {formatDate(detailModal.review.createdAt)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Xác nhận xóa</h3>
            <p className="text-zinc-600 mb-6">
              Bạn có chắc chắn muốn xóa đánh giá này của <span className="font-medium">{deleteModal.review?.userName}</span>?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ open: false, review: null })}
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
