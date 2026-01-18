import { api } from '@/lib/axios';
import { 
  CinemaListResponse, 
  TheaterSummary, 
  CinemaScheduleResponse 
} from '@/types';

/**
 * Service để gọi API liên quan đến rạp chiếu phim
 */
export const cinemaService = {
  /**
   * Lấy danh sách tất cả rạp, nhóm theo thành phố
   */
  async getAllCinemas(): Promise<CinemaListResponse> {
    const response = await api.get<CinemaListResponse>('/cinemas');
    return response.data;
  },

  /**
   * Lấy danh sách rạp theo thành phố
   */
  async getTheatersByCity(cityName: string): Promise<TheaterSummary[]> {
    const response = await api.get<TheaterSummary[]>(`/cinemas/city/${encodeURIComponent(cityName)}`);
    return response.data;
  },

  /**
   * Lấy chi tiết một rạp
   */
  async getTheaterDetail(theaterId: number): Promise<TheaterSummary> {
    const response = await api.get<TheaterSummary>(`/cinemas/${theaterId}`);
    return response.data;
  },

  /**
   * Lấy lịch chiếu của rạp theo ngày
   * @param theaterId - ID của rạp
   * @param date - Ngày xem lịch (format: yyyy-MM-dd)
   */
  async getCinemaSchedule(theaterId: number, date?: string): Promise<CinemaScheduleResponse> {
    const params = date ? { date } : {};
    const response = await api.get<CinemaScheduleResponse>(`/cinemas/${theaterId}/schedule`, { params });
    return response.data;
  }
};

export default cinemaService;
