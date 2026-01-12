import { api } from '@/lib/axios';
import { Review } from '@/types';

export interface CreateReviewRequest {
  movieId: number;
  rating: number;
  content: string;
  isSpoiler?: boolean;
}

export interface RatingStats {
  movieId: number;
  averageRating: number;
  totalReviews: number;
}

export const reviewService = {
  getReviewsByMovie: async (movieId: number, page = 0, size = 10): Promise<Review[]> => {
    try {
      const response = await api.get(`/reviews/movie/${movieId}`, {
        params: { page, size }
      });
      return response.data.data?.content || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  },

  getAllReviewsByMovie: async (movieId: number): Promise<Review[]> => {
    try {
      const response = await api.get(`/reviews/movie/${movieId}/all`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      return [];
    }
  },

  getMovieRatingStats: async (movieId: number): Promise<RatingStats> => {
    try {
      const response = await api.get(`/reviews/movie/${movieId}/stats`);
      return response.data.data || { movieId, averageRating: 0, totalReviews: 0 };
    } catch (error) {
      console.error('Error fetching rating stats:', error);
      return { movieId, averageRating: 0, totalReviews: 0 };
    }
  },

  createReview: async (request: CreateReviewRequest): Promise<Review> => {
    const response = await api.post('/reviews', request);
    return response.data.data;
  },

  likeReview: async (reviewId: number): Promise<Review> => {
    const response = await api.post(`/reviews/${reviewId}/like`);
    return response.data.data;
  },

  deleteReview: async (reviewId: number): Promise<void> => {
    await api.delete(`/reviews/${reviewId}`);
  }
};
