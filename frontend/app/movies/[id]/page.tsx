'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Movie, Showtime, Review } from '@/types';
import { movieService } from '@/services/movieService';
import { reviewService } from '@/services/reviewService';
import { ShowtimeSelector } from '@/components';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const movieId = Number(params.id);

  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingStats, setRatingStats] = useState<{ averageRating: number; totalReviews: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  
  // Review form state
  const [newRating, setNewRating] = useState(8);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (movieId) {
      fetchMovie();
      fetchReviews();
    }
  }, [movieId]);

  const fetchMovie = async () => {
    try {
      const data = await movieService.getMovieById(movieId);
      setMovie(data);
    } catch (error) {
      console.error('Error fetching movie:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const [reviewsData, statsData] = await Promise.all([
        reviewService.getReviewsByMovie(movieId),
        reviewService.getMovieRatingStats(movieId)
      ]);
      setReviews(reviewsData);
      setRatingStats(statsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleShowtimeSelect = (showtime: Showtime) => {
    router.push(`/booking?showtimeId=${showtime.id}`);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?redirect=/movies/${movieId}`);
      return;
    }

    try {
      setSubmitting(true);
      setReviewError('');
      await reviewService.createReview({
        movieId,
        rating: newRating,
        content: newComment,
        isSpoiler: false
      });
      setNewComment('');
      setNewRating(8);
      fetchReviews(); // Refresh reviews
    } catch (error: any) {
      setReviewError(error.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeReview = async (reviewId: number) => {
    try {
      await reviewService.likeReview(reviewId);
      fetchReviews();
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const renderStars = (rating: number, size = 'w-5 h-5') => {
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 1;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} className={`${size} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg className={`${size} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="halfStar">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#D1D5DB" />
              </linearGradient>
            </defs>
            <path fill="url(#halfStar)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} className={`${size} text-gray-300`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="bg-gray-300 h-96"></div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-gray-300 h-8 rounded w-1/3 mb-4"></div>
            <div className="bg-gray-300 h-4 rounded w-full mb-2"></div>
            <div className="bg-gray-300 h-4 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy phim</h1>
          <Link href="/movies" className="text-red-500 hover:text-red-600">
            Quay lại danh sách phim
          </Link>
        </div>
      </div>
    );
  }

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&?\s]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Movie Info Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: Poster + Buttons */}
            <div className="flex-shrink-0 w-full md:w-72">
              <div className="relative">
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gray-300 rounded-lg flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                  </div>
                )}
                
                {/* Release date badge */}
                {movie.releaseDate && (
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatDate(movie.releaseDate)}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-3">
                {movie.trailerUrl && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    Xem Trailer
                  </button>
                )}
                
                {movie.status === 'NOW_SHOWING' && (
                  <Link
                    href={`/dat-ve?movieId=${movie.id}`}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    Đặt vé
                  </Link>
                )}
              </div>
            </div>

            {/* Right: Movie Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{movie.title}</h1>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-gray-600">Xem xếp hạng</span>
                {renderStars(ratingStats?.averageRating || movie.rating || 0)}
                <span className="text-2xl font-bold text-gray-900">
                  {(ratingStats?.averageRating || movie.rating || 0).toFixed(1)}
                </span>
              </div>

              {/* Movie Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {movie.ageRating && (
                  <div className="flex">
                    <span className="font-semibold text-gray-700 w-32">Xếp hạng</span>
                    <span className="text-gray-600">[Trong nước] ({movie.ageRating}) Trên {movie.ageRating.replace(/[^0-9]/g, '')} tuổi</span>
                  </div>
                )}
                
                {movie.releaseDate && (
                  <div className="flex">
                    <span className="font-semibold text-gray-700 w-32">Ngày phát hành</span>
                    <span className="text-gray-600">{formatDate(movie.releaseDate)}</span>
                  </div>
                )}

                <div className="flex col-span-2">
                  <span className="font-semibold text-gray-700 w-32">Thông tin cơ bản</span>
                  <span className="text-gray-600">
                    {movie.genre} ({movie.duration} Phút)
                  </span>
                </div>

                {movie.director && (
                  <div className="flex col-span-2">
                    <span className="font-semibold text-gray-700 w-32">Đạo diễn</span>
                    <span className="text-gray-600">{movie.director}</span>
                  </div>
                )}

                {movie.actors && (
                  <div className="flex col-span-2">
                    <span className="font-semibold text-gray-700 w-32">Diễn viên</span>
                    <span className="text-gray-600">{movie.actors}</span>
                  </div>
                )}

                <div className="flex col-span-2">
                  <span className="font-semibold text-gray-700 w-32">Loại</span>
                  <span className="text-gray-600">2D | Normal | Normal sound | Phụ đề tiếng Anh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Synopsis */}
      {movie.description && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-red-500 pl-3">
              Tóm tắt
            </h2>
            <p className="text-gray-700 leading-relaxed">{movie.description}</p>
          </div>
        </div>
      )}

      {/* Showtimes Section */}
      {movie.status === 'NOW_SHOWING' && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-red-500 pl-3">
              Lịch chiếu
            </h2>
            <ShowtimeSelector movieId={movie.id} onSelect={handleShowtimeSelect} />
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-red-500 pl-3">
            Bình luận ({ratingStats?.totalReviews || 0})
          </h2>

          {/* Review Form */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <form onSubmit={handleSubmitReview}>
              {/* Rating Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Đánh giá của bạn</label>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className={`text-2xl ${star <= newRating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span className="text-lg font-bold text-gray-700">{newRating}/10</span>
                </div>
              </div>

              {/* Comment Input */}
              <div className="mb-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Viết bình luận của bạn..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              <p className="text-xs text-gray-500 mb-4">
                Lưu ý: Trong trường hợp nội dung nhận xét có chứa những từ ngữ nhạy cảm, hoặc cầu vấn mang tính phỉ báng thì nội dung nhận xét sẽ bị ẩn hoàn toàn trong hệ thống.
              </p>

              {reviewError && (
                <p className="text-red-500 text-sm mb-4">{reviewError}</p>
              )}

              <Button
                type="submit"
                className="w-full md:w-auto"
                isLoading={submitting}
                disabled={!isAuthenticated}
              >
                {isAuthenticated ? 'Bình luận' : 'Đăng nhập để bình luận'}
              </Button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b pb-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold">
                        {review.userName?.substring(0, 2).toUpperCase() || 'U'}
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">{review.userName}</span>
                        {renderStars(review.rating, 'w-4 h-4')}
                        <span className="text-sm text-gray-600">{review.rating}</span>
                        <span className="text-sm text-gray-400">
                          {new Date(review.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{review.content}</p>
                      
                      <button
                        onClick={() => handleLikeReview(review.id)}
                        className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        <span>{review.likesCount}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && movie.trailerUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTrailer(false)}
        >
          <div className="relative w-full max-w-4xl aspect-video">
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute -top-10 right-0 text-white hover:text-red-500"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(movie.trailerUrl)}?autoplay=1`}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}
