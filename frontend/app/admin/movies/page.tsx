'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminMovieService } from '@/services/adminService';

interface Movie {
  id: number;
  title: string;
  originalTitle: string;
  posterUrl: string;
  duration: number;
  releaseDate: string;
  status: string;
  genre: string;
  rating: number;
}

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortField, setSortField] = useState('releaseDate');
  const [sortDir, setSortDir] = useState('desc');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    fetchMovies();
  }, [currentPage, statusFilter, sortField, sortDir]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        size: pageSize,
        search: searchTerm,
        status: statusFilter || undefined,
        sortBy: sortField,
        sortDir: sortDir
      };
      const response = await adminMovieService.getAll(params);
      // Response structure from service update: { content, pageNumber, totalPages, ... }
      if (response && response.content) {
        setMovies(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      } else {
        setMovies([]);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0); // Reset to first page on new search
    fetchMovies();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminMovieService.delete(deleteId);
      // Refresh list
      fetchMovies();
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting movie:', error);
      alert('Không thể xóa phim này. Có thể đang có suất chiếu liên quan.');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'NOW_SHOWING': 'bg-green-100 text-green-800',
      'COMING_SOON': 'bg-blue-100 text-blue-800',
      'ENDED': 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      'NOW_SHOWING': 'Đang chiếu',
      'COMING_SOON': 'Sắp chiếu',
      'ENDED': 'Đã kết thúc',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const SortIcon = ({ field }: { field: string }) => {
    const isActive = sortField === field;
    return (
      <span className={`ml-1 inline-block transition-transform duration-200 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
        {isActive && sortDir === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý Phim</h1>
          <p className="text-zinc-500 mt-1">Tổng cộng {totalElements} phim</p>
        </div>
        <Link
          href="/admin/movies/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm phim mới
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm phim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(0);
            }}
            className="px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="NOW_SHOWING">Đang chiếu</option>
            <option value="COMING_SOON">Sắp chiếu</option>
            <option value="ENDED">Đã kết thúc</option>
          </select>

          <button
            type="submit"
            className="px-6 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-zinc-300 border-t-zinc-800 rounded-full"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50">
                  <tr>
                    <th
                      onClick={() => handleSort('title')}
                      className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${sortField === 'title' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100'
                        }`}
                    >
                      Phim <SortIcon field="title" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Thể loại</th>
                    <th
                      onClick={() => handleSort('duration')}
                      className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${sortField === 'duration' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100'
                        }`}
                    >
                      Thời lượng <SortIcon field="duration" />
                    </th>
                    <th
                      onClick={() => handleSort('releaseDate')}
                      className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${sortField === 'releaseDate' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100'
                        }`}
                    >
                      Ngày chiếu <SortIcon field="releaseDate" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Trạng thái</th>
                    <th
                      onClick={() => handleSort('rating')}
                      className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${sortField === 'rating' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100'
                        }`}
                    >
                      Đánh giá <SortIcon field="rating" />
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {movies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                        Không tìm thấy phim nào
                      </td>
                    </tr>
                  ) : (
                    movies.map((movie) => (
                      <tr key={movie.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={movie.posterUrl || 'https://via.placeholder.com/48x72'}
                              alt={movie.title}
                              className="w-12 h-18 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium text-zinc-900 line-clamp-1">{movie.title}</p>
                              {movie.originalTitle && (
                                <p className="text-sm text-zinc-500 line-clamp-1">{movie.originalTitle}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-600">{movie.genre || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-600">{movie.duration} phút</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-600">
                            {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(movie.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm text-zinc-600">{movie.rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/movies/${movie.id}/edit`}
                              className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => {
                                setDeleteId(movie.id);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200">
                <p className="text-sm text-zinc-500">
                  Hiển thị {movies.length > 0 ? currentPage * pageSize + 1 : 0} đến {Math.min((currentPage + 1) * pageSize, totalElements)} trong số {totalElements} kết quả
                </p>
                <div className="flex gap-2">
                  {/* Page Numbers */}
                  {(() => {
                    const pages = [];
                    // Limit to 3 pages before and 3 pages after current
                    const siblingCount = 3;

                    let startPage = Math.max(0, currentPage - siblingCount);
                    let endPage = Math.min(totalPages - 1, currentPage + siblingCount);

                    // Always show first page
                    if (startPage > 0) {
                      pages.push(
                        <button key="first" onClick={() => setCurrentPage(0)} className="px-3 py-1 border border-zinc-200 rounded hover:bg-zinc-50">1</button>
                      );
                      if (startPage > 1) {
                        pages.push(<span key="ellipsis-start" className="px-2 self-end">...</span>);
                      }
                    }

                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`px-3 py-1 border rounded transition-colors ${currentPage === i
                            ? 'bg-red-600 text-white border-red-600'
                            : 'border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
                            }`}
                        >
                          {i + 1}
                        </button>
                      );
                    }

                    // Always show last page
                    if (endPage < totalPages - 1) {
                      if (endPage < totalPages - 2) {
                        pages.push(<span key="ellipsis-end" className="px-2 self-end">...</span>);
                      }
                      pages.push(
                        <button key="last" onClick={() => setCurrentPage(totalPages - 1)} className="px-3 py-1 border border-zinc-200 rounded hover:bg-zinc-50">{totalPages}</button>
                      );
                    }

                    return pages;
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Xác nhận xóa</h3>
            </div>
            <p className="text-zinc-600 mb-6">
              Bạn có chắc chắn muốn xóa phim này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
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
