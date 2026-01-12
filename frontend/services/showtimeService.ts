import { api } from '@/lib/axios';
import { ApiResponse, Showtime } from '@/types';

export const showtimeService = {
  async getShowtimesByMovie(movieId: number): Promise<Showtime[]> {
    const response = await api.get<ApiResponse<Showtime[]>>(`/showtimes/movie/${movieId}`);
    return response.data.data;
  },

  async getShowtimesByMovieAndDate(movieId: number, date: string): Promise<Showtime[]> {
    const response = await api.get<ApiResponse<Showtime[]>>(`/showtimes/movie/${movieId}/date/${date}`);
    return response.data.data;
  },

  async getShowtimesByMovieTheaterAndDate(movieId: number, theaterId: number, date: string): Promise<Showtime[]> {
    const response = await api.get<ApiResponse<Showtime[]>>(
      `/showtimes/movie/${movieId}/theater/${theaterId}/date/${date}`
    );
    return response.data.data;
  },

  async getShowtimesByTheaterAndDate(theaterId: number, date: string): Promise<Showtime[]> {
    const response = await api.get<ApiResponse<Showtime[]>>(`/showtimes/theater/${theaterId}/date/${date}`);
    return response.data.data;
  },

  async getShowtimeById(id: number): Promise<Showtime> {
    const response = await api.get<ApiResponse<Showtime>>(`/showtimes/${id}`);
    return response.data.data;
  },

  async getShowtimesByMovieAndTheater(movieId: number, theaterId: number): Promise<Showtime[]> {
    const response = await api.get<ApiResponse<Showtime[]>>(`/showtimes/movie/${movieId}/theater/${theaterId}`);
    return response.data.data;
  }
};