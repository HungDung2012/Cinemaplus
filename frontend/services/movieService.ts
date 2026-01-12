import { api } from '@/lib/axios';
import { ApiResponse, Movie, PageResponse } from '@/types';

export const movieService = {
  async getAllMovies(page = 0, size = 10): Promise<PageResponse<Movie>> {
    const response = await api.get<ApiResponse<PageResponse<Movie>>>('/movies', {
      params: { page, size }
    });
    return response.data.data;
  },

  // Phân trang cho phim đang chiếu
  async getNowShowingMoviesPaged(page = 0, size = 10): Promise<PageResponse<Movie>> {
    const response = await api.get<ApiResponse<PageResponse<Movie>>>('/movies/now-showing', {
      params: { page, size }
    });
    return response.data.data;
  },

  // Legacy: Lấy tất cả phim đang chiếu (cho trang chủ)
  async getNowShowingMovies(): Promise<Movie[]> {
    const response = await api.get<ApiResponse<PageResponse<Movie>>>('/movies/now-showing', {
      params: { page: 0, size: 100 }
    });
    return response.data.data.content;
  },

  // Phân trang cho phim sắp chiếu
  async getComingSoonMoviesPaged(page = 0, size = 10): Promise<PageResponse<Movie>> {
    const response = await api.get<ApiResponse<PageResponse<Movie>>>('/movies/coming-soon', {
      params: { page, size }
    });
    return response.data.data;
  },

  // Legacy: Lấy tất cả phim sắp chiếu (cho trang chủ)
  async getComingSoonMovies(): Promise<Movie[]> {
    const response = await api.get<ApiResponse<PageResponse<Movie>>>('/movies/coming-soon', {
      params: { page: 0, size: 100 }
    });
    return response.data.data.content;
  },

  // Phân trang cho phim đã chiếu
  async getEndedMoviesPaged(page = 0, size = 10): Promise<PageResponse<Movie>> {
    const response = await api.get<ApiResponse<PageResponse<Movie>>>('/movies/ended', {
      params: { page, size }
    });
    return response.data.data;
  },

  // Legacy: Lấy tất cả phim đã chiếu (cho trang chủ)
  async getEndedMovies(): Promise<Movie[]> {
    const response = await api.get<ApiResponse<PageResponse<Movie>>>('/movies/ended', {
      params: { page: 0, size: 100 }
    });
    return response.data.data.content;
  },

  async getMovieById(id: number): Promise<Movie> {
    const response = await api.get<ApiResponse<Movie>>(`/movies/${id}`);
    return response.data.data;
  },

  async searchMovies(keyword: string, page = 0, size = 10): Promise<PageResponse<Movie>> {
    const response = await api.get<ApiResponse<PageResponse<Movie>>>('/movies/search', {
      params: { keyword, page, size }
    });
    return response.data.data;
  },

  async getAllGenres(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/movies/genres');
    return response.data.data;
  }
};
