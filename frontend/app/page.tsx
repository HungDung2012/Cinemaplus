'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Movie } from '@/types';
import { movieService } from '@/services/movieService';
import { MovieCard } from '@/components';

export default function HomePage() {
  const [nowShowingMovies, setNowShowingMovies] = useState<Movie[]>([]);
  const [comingSoonMovies, setComingSoonMovies] = useState<Movie[]>([]);
  const [endedMovies, setEndedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const [nowShowing, comingSoon, ended] = await Promise.all([
        movieService.getNowShowingMovies(),
        movieService.getComingSoonMovies(),
        movieService.getEndedMovies(),
      ]);
      setNowShowingMovies(nowShowing);
      setComingSoonMovies(comingSoon);
      setEndedMovies(ended);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 z-10"></div>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
          }}
        ></div>
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Trải nghiệm điện ảnh
            <span className="text-red-500 block">đỉnh cao</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl">
            Đặt vé xem phim trực tuyến nhanh chóng, tiện lợi. Tận hưởng những bộ phim bom tấn với âm thanh và hình ảnh sống động.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/movies"
              className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Đặt vé ngay
            </Link>
            <Link
              href="/movies?tab=coming-soon"
              className="bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Phim sắp chiếu
            </Link>
          </div>
        </div>
      </section>

      {/* Now Showing Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Phim đang chiếu
            </h2>
            <Link
              href="/movies?tab=now-showing"
              className="text-red-500 hover:text-red-600 font-medium flex items-center"
            >
              Xem tất cả
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 aspect-[2/3] rounded-lg mb-4"></div>
                  <div className="bg-gray-300 h-4 rounded mb-2"></div>
                  <div className="bg-gray-300 h-3 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : nowShowingMovies.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Chưa có phim đang chiếu</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {nowShowingMovies.slice(0, 5).map((movie) => (
                <MovieCard key={movie.id} movie={movie} showBookingButton={true} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-12 md:py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Phim sắp chiếu
            </h2>
            <Link
              href="/movies?tab=coming-soon"
              className="text-red-500 hover:text-red-600 font-medium flex items-center"
            >
              Xem tất cả
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 aspect-[2/3] rounded-lg mb-4"></div>
                  <div className="bg-gray-300 h-4 rounded mb-2"></div>
                  <div className="bg-gray-300 h-3 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : comingSoonMovies.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Chưa có phim sắp chiếu</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {comingSoonMovies.slice(0, 5).map((movie) => (
                <MovieCard key={movie.id} movie={movie} showBookingButton={false} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Ended Movies Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Phim đã chiếu
            </h2>
            <Link
              href="/movies?tab=all"
              className="text-red-500 hover:text-red-600 font-medium flex items-center"
            >
              Xem tất cả
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 aspect-[2/3] rounded-lg mb-4"></div>
                  <div className="bg-gray-300 h-4 rounded mb-2"></div>
                  <div className="bg-gray-300 h-3 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : endedMovies.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Chưa có phim đã chiếu</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {endedMovies.slice(0, 5).map((movie) => (
                <MovieCard key={movie.id} movie={movie} showBookingButton={false} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            Tại sao chọn CinemaPlus?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Đặt vé nhanh chóng</h3>
              <p className="text-gray-600">
                Chỉ với vài bước đơn giản, bạn đã có thể đặt vé xem phim yêu thích
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Thanh toán an toàn</h3>
              <p className="text-gray-600">
                Hỗ trợ nhiều phương thức thanh toán với bảo mật tuyệt đối
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Nhiều ưu đãi</h3>
              <p className="text-gray-600">
                Tích điểm và nhận nhiều khuyến mãi hấp dẫn khi đặt vé
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
