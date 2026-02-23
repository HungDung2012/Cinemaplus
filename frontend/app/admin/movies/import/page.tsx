'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { tmdbService } from '@/services/adminService';

// ======================== Types ========================
interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  original_title: string;
}

interface TmdbListResponse {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbMovie[];
}

type TabKey = 'now_playing' | 'upcoming' | 'popular' | 'search';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'now_playing', label: 'Đang chiếu' },
  { key: 'upcoming', label: 'Sắp chiếu' },
  { key: 'popular', label: 'Phổ biến' },
  { key: 'search', label: 'Tìm kiếm' },
];

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

// ======================== Component ========================
export default function TmdbImportPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('now_playing');
  const [movies, setMovies] = useState<TmdbMovie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);

  // ---- Fetch movies ----
  const fetchMovies = useCallback(async (tab: TabKey, p: number, query?: string) => {
    setLoading(true);
    setError('');
    try {
      let data: TmdbListResponse | null = null;
      if (tab === 'now_playing') data = await tmdbService.getNowPlaying(p);
      else if (tab === 'upcoming') data = await tmdbService.getUpcoming(p);
      else if (tab === 'popular') data = await tmdbService.getPopular(p);
      else if (tab === 'search' && query) data = await tmdbService.search(query, p);

      if (data) {
        setMovies(data.results ?? []);
        setTotalPages(data.total_pages ?? 1);
        setTotalResults(data.total_results ?? 0);
      } else if (tab === 'search' && !query) {
        setMovies([]);
        setTotalPages(1);
        setTotalResults(0);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Không thể tải danh sách phim từ TMDB.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on tab / page change
  useEffect(() => {
    if (activeTab !== 'search') {
      fetchMovies(activeTab, page);
    }
  }, [activeTab, page, fetchMovies]);

  // When tab changes, reset page & selection
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setPage(1);
    setSelected(new Set());
    setImportResults(null);
    if (tab !== 'search') setMovies([]);
  };

  // ---- Search ----
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
    setSelected(new Set());
    setImportResults(null);
    fetchMovies('search', 1, searchInput);
  };

  // Re-fetch search on page change
  useEffect(() => {
    if (activeTab === 'search' && searchQuery) {
      fetchMovies('search', page, searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ---- Selection ----
  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === movies.length && movies.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(movies.map(m => m.id)));
    }
  };

  // ---- Import ----
  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    setImportResults(null);

    let success = 0;
    let failed = 0;

    // Import one by one to handle partial errors gracefully
    for (const tmdbId of Array.from(selected)) {
      try {
        await tmdbService.importById(tmdbId);
        success++;
      } catch {
        failed++;
      }
    }

    setImportResults({ success, failed });
    setImporting(false);
    setSelected(new Set());
  };

  // ---- Helpers ----
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const ratingColor = (v: number) => {
    if (v >= 7) return 'text-green-600';
    if (v >= 5) return 'text-yellow-600';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
            <Link href="/admin/movies" className="hover:text-zinc-600 transition-colors">
              Quản lý Phim
            </Link>
            <span>/</span>
            <span className="text-zinc-700 font-medium">Import từ TMDB</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            Import phim từ TMDB
          </h1>
          {totalResults > 0 && !loading && (
            <p className="text-zinc-500 mt-1 text-sm">
              {totalResults.toLocaleString()} phim · Trang {page}/{totalPages}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium shadow"
            >
              {importing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Đang import...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import {selected.size} phim
                </>
              )}
            </button>
          )}
          <Link
            href="/admin/movies"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại
          </Link>
        </div>
      </div>

      {/* Import result banner */}
      {importResults && (
        <div className={`mb-4 p-4 rounded-lg border flex items-center gap-3 ${importResults.failed === 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={importResults.failed === 0 ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z'} />
          </svg>
          <span>
            Import hoàn tất: <strong>{importResults.success} phim thành công</strong>
            {importResults.failed > 0 && <>, <strong>{importResults.failed} thất bại</strong> (có thể đã tồn tại hoặc lỗi mạng)</>}.
          </span>
          <button onClick={() => setImportResults(null)} className="ml-auto text-inherit opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-zinc-200 p-1 w-fit shadow-sm">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search form (only on search tab) */}
      {activeTab === 'search' && (
        <form onSubmit={handleSearch} className="bg-white rounded-xl border border-zinc-200 p-4 mb-6 shadow-sm flex gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm phim theo tên..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Tìm kiếm
          </button>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Toolbar: select all + count */}
      {movies.length > 0 && (
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
            <input
              type="checkbox"
              checked={selected.size === movies.length && movies.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            {selected.size === movies.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả trang này'}
          </label>
          {selected.size > 0 && (
            <span className="text-sm text-blue-600 font-medium">Đã chọn {selected.size} phim</span>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <svg className="w-10 h-10 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-zinc-500">Đang tải dữ liệu từ TMDB...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && movies.length === 0 && activeTab !== 'search' && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <svg className="w-16 h-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <p className="text-lg font-medium">Không có phim nào</p>
        </div>
      )}
      {!loading && movies.length === 0 && activeTab === 'search' && searchQuery && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <svg className="w-16 h-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-lg font-medium">Không tìm thấy phim nào</p>
          <p className="text-sm">Thử tìm với từ khóa khác</p>
        </div>
      )}
      {!loading && movies.length === 0 && activeTab === 'search' && !searchQuery && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <svg className="w-16 h-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-lg font-medium">Nhập từ khóa để tìm phim</p>
        </div>
      )}

      {/* Movie grid */}
      {!loading && movies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.map(movie => {
            const isSelected = selected.has(movie.id);
            return (
              <div
                key={movie.id}
                onClick={() => toggleSelect(movie.id)}
                className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-150 group bg-white shadow-sm hover:shadow-md
                  ${isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-zinc-200 hover:border-blue-300'}`}
              >
                {/* Checkbox overlay */}
                <div className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                  ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white/80 border-zinc-400 group-hover:border-blue-400'}`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Rating badge */}
                {movie.vote_average > 0 && (
                  <div className="absolute top-2 right-2 z-10 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className={ratingColor(movie.vote_average)}>{movie.vote_average.toFixed(1)}</span>
                  </div>
                )}

                {/* Poster */}
                <div className="aspect-[2/3] bg-zinc-100 relative">
                  {movie.poster_path ? (
                    <Image
                      src={`${POSTER_BASE}${movie.poster_path}`}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-300">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs mt-1">No poster</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs font-semibold text-zinc-900 line-clamp-2 leading-snug" title={movie.title}>
                    {movie.title}
                  </p>
                  {movie.original_title !== movie.title && (
                    <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5" title={movie.original_title}>
                      {movie.original_title}
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-500 mt-1">{formatDate(movie.release_date)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
          >
            ← Trước
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (page <= 4) {
              pageNum = i + 1;
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = page - 3 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                  page === pageNum
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
          >
            Tiếp →
          </button>
        </div>
      )}
    </div>
  );
}
