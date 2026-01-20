'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminMovieService } from '@/services/adminService';

const GENRES = [
  'Hành động', 'Phiêu lưu', 'Hoạt hình', 'Hài', 'Tội phạm', 'Tài liệu',
  'Chính kịch', 'Gia đình', 'Giả tưởng', 'Lịch sử', 'Kinh dị', 'Âm nhạc',
  'Bí ẩn', 'Lãng mạn', 'Khoa học viễn tưởng', 'Chiến tranh', 'Tâm lý'
];

const STATUS_OPTIONS = [
  { value: 'NOW_SHOWING', label: 'Đang chiếu' },
  { value: 'COMING_SOON', label: 'Sắp chiếu' },
  { value: 'ENDED', label: 'Đã kết thúc' },
];

export default function CreateMoviePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    originalTitle: '',
    description: '',
    duration: '',
    releaseDate: '',
    endDate: '',
    posterUrl: '',
    backdropUrl: '',
    trailerUrl: '',
    genre: '',
    director: '',
    cast: '',
    language: 'Tiếng Việt',
    country: 'Việt Nam',
    ageRating: 'P',
    status: 'COMING_SOON',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminMovieService.create({
        ...formData,
        duration: parseInt(formData.duration) || 0,
      });
      router.push('/admin/movies');
    } catch (error: any) {
      console.error('Error creating movie:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo phim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/movies"
          className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Thêm phim mới</h1>
          <p className="text-zinc-500 mt-1">Điền thông tin để thêm phim mới vào hệ thống</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Tên phim <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Nhập tên phim"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Tên gốc
              </label>
              <input
                type="text"
                name="originalTitle"
                value={formData.originalTitle}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Nhập tên gốc (nếu có)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="Nhập mô tả phim"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Thời lượng (phút) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Thể loại
                </label>
                <select
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Chọn thể loại</option>
                  {GENRES.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Ngày khởi chiếu
                </label>
                <input
                  type="date"
                  name="releaseDate"
                  value={formData.releaseDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Trạng thái
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                URL Poster
              </label>
              <input
                type="url"
                name="posterUrl"
                value={formData.posterUrl}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="https://..."
              />
              {formData.posterUrl && (
                <img src={formData.posterUrl} alt="Preview" className="mt-2 w-32 h-48 object-cover rounded-lg" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                URL Backdrop
              </label>
              <input
                type="url"
                name="backdropUrl"
                value={formData.backdropUrl}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                URL Trailer (YouTube)
              </label>
              <input
                type="url"
                name="trailerUrl"
                value={formData.trailerUrl}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="https://youtube.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Đạo diễn
              </label>
              <input
                type="text"
                name="director"
                value={formData.director}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Tên đạo diễn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Diễn viên
              </label>
              <input
                type="text"
                name="cast"
                value={formData.cast}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Diễn viên 1, Diễn viên 2, ..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Ngôn ngữ
                </label>
                <input
                  type="text"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Quốc gia
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Phân loại độ tuổi
              </label>
              <select
                name="ageRating"
                value={formData.ageRating}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="P">P - Phổ biến</option>
                <option value="C13">C13 - Cấm khán giả dưới 13 tuổi</option>
                <option value="C16">C16 - Cấm khán giả dưới 16 tuổi</option>
                <option value="C18">C18 - Cấm khán giả dưới 18 tuổi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-zinc-200">
          <Link
            href="/admin/movies"
            className="px-6 py-2 text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            )}
            Tạo phim
          </button>
        </div>
      </form>
    </div>
  );
}
