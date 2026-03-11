'use client';

import Link from 'next/link';
import { Movie } from '@/types';
import { PlayCircle, Clock, Star, Info, Ticket } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  showBookingButton?: boolean;
}

export default function MovieCard({ movie, showBookingButton = true }: MovieCardProps) {
  const statusBadge = {
    NOW_SHOWING: { text: 'Đang chiếu', color: 'bg-green-500 shadow-green-500/30' },
    COMING_SOON: { text: 'Sắp chiếu', color: 'bg-yellow-500 shadow-yellow-500/30' },
    ENDED: { text: 'Đã kết thúc', color: 'bg-gray-500 shadow-gray-500/30' },
  };

  const isNowShowing = movie.status === 'NOW_SHOWING';

  return (
    <div className="group relative h-full flex flex-col">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 ring-1 ring-gray-900/5 hover:shadow-xl hover:-translate-y-1 hover:ring-gray-900/10 transition-all duration-300 flex flex-col h-full">
        {/* Poster Container */}
        <div className="relative aspect-[2/3] overflow-hidden bg-gray-100">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          )}

          {/* Gradient Overlay for bottom text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

          {/* Status Badge */}
          <span className={`absolute top-3 right-3 ${statusBadge[movie.status]?.color || 'bg-gray-500'} text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg z-20`}>
            {statusBadge[movie.status]?.text || 'Không xác định'}
          </span>

          {/* Age Rating */}
          {movie.ageRating && (
            <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-sm text-white text-[11px] font-black px-2 py-1 rounded-lg border border-white/20 shadow-lg z-20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              {movie.ageRating}
            </div>
          )}

          {/* Hover Action Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-5 z-30">
            {/* Nút Đặt vé */}
            {isNowShowing && showBookingButton && (
              <Link
                href={`/dat-ve?movieId=${movie.id}`}
                className="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-xl font-bold text-center transition-all transform translate-y-4 group-hover:translate-y-0 flex items-center justify-center gap-2 shadow-xl shadow-red-500/20 active:scale-95"
              >
                <Ticket className="w-4 h-4" />
                Mua Vé Ngay
              </Link>
            )}

            {/* Nút Xem chi tiết */}
            <Link
              href={`/movies/${movie.id}`}
              className={`w-full ${isNowShowing ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30' : 'bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-500/20'} px-4 py-3 rounded-xl font-bold text-center transition-all transform translate-y-4 group-hover:translate-y-0 flex items-center justify-center gap-2 active:scale-95`}
              style={{ transitionDelay: '50ms' }}
            >
              {isNowShowing ? <Info className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              {isNowShowing ? 'Chi tiết phim' : 'Xem thông tin'}
            </Link>
          </div>
        </div>

        {/* Info Area - Using flex-grow to push all content evenly */}
        <div className="p-5 flex flex-col flex-grow bg-white">
          {/* Title Area - Fixed Min Height for uniform card alignment */}
          <div className="min-h-[56px] mb-3 flex items-start">
            <h3 className="font-bold text-gray-900 text-[16px] leading-tight line-clamp-2 group-hover:text-red-600 transition-colors w-full">
              {movie.title}
            </h3>
          </div>

          <div className="space-y-3 mt-auto">
            {/* Metadata metrics */}
            <div className="flex items-center gap-4 text-[13px] text-gray-500 font-medium">
              {movie.duration && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-md border border-gray-100">
                  <Clock className="w-3.5 h-3.5" />
                  {movie.duration}p
                </span>
              )}

              {movie.rating !== undefined && movie.rating > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-md border border-amber-100/50 text-amber-700">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {movie.rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Genere tags styling */}
            {movie.genre && (
              <p className="text-[12px] text-gray-400 font-medium line-clamp-1 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                {movie.genre}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
