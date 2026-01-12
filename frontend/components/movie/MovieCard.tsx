'use client';

import Link from 'next/link';
import { Movie } from '@/types';

interface MovieCardProps {
  movie: Movie;
  showBookingButton?: boolean;
}

export default function MovieCard({ movie, showBookingButton = true }: MovieCardProps) {
  const statusBadge = {
    NOW_SHOWING: { text: 'Đang chiếu', color: 'bg-green-500' },
    COMING_SOON: { text: 'Sắp chiếu', color: 'bg-yellow-500' },
    ENDED: { text: 'Đã kết thúc', color: 'bg-gray-500' },
  };

  const isNowShowing = movie.status === 'NOW_SHOWING';

  return (
    <div className="group relative">
      <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          )}
          
          {/* Status Badge */}
          <span className={`absolute top-2 right-2 ${statusBadge[movie.status]?.color || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded`}>
            {statusBadge[movie.status]?.text || 'Không xác định'}
          </span>

          {/* Age Rating */}
          {movie.ageRating && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
              {movie.ageRating}
            </span>
          )}

          {/* Hover Overlay with Buttons */}
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
            {/* Nút Đặt vé - Chỉ hiện khi phim đang chiếu */}
            {isNowShowing && showBookingButton && (
              <Link
                href={`/dat-ve?movieId=${movie.id}`}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-semibold text-center transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Đặt vé
              </Link>
            )}
            
            {/* Nút Xem chi tiết - Hiện cho tất cả phim */}
            <Link
              href={`/movies/${movie.id}`}
              className={`w-full ${isNowShowing ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2.5 rounded-lg font-semibold text-center transition-colors flex items-center justify-center gap-2`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Xem chi tiết
            </Link>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-500 transition-colors">
            {movie.title}
          </h3>
          
          <div className="flex items-center text-sm text-gray-600 space-x-4">
            {movie.duration && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {movie.duration} phút
              </span>
            )}
            
            {movie.rating !== undefined && movie.rating > 0 && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {movie.rating.toFixed(1)}
              </span>
            )}
          </div>

          {movie.genre && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-1">{movie.genre}</p>
          )}
        </div>
      </div>
    </div>
  );
}
