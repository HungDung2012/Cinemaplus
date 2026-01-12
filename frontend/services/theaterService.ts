import { api } from '@/lib/axios';
import { ApiResponse, Theater, Room, Seat, Region } from '@/types';

export const theaterService = {
  async getAllTheaters(): Promise<Theater[]> {
    const response = await api.get<ApiResponse<Theater[]>>('/theaters');
    return response.data.data;
  },

  async getTheatersByCity(city: string): Promise<Theater[]> {
    const response = await api.get<ApiResponse<Theater[]>>(`/theaters/city/${city}`);
    return response.data.data;
  },

  async getTheaterById(id: number): Promise<Theater> {
    const response = await api.get<ApiResponse<Theater>>(`/theaters/${id}`);
    return response.data.data;
  },

  async getTheatersByRegion(regionId: number): Promise<Theater[]> {
    const response = await api.get<ApiResponse<Theater[]>>(`/theaters/region/${regionId}`);
    return response.data.data;
  },

  async getTheatersByRegionCode(regionCode: string): Promise<Theater[]> {
    const response = await api.get<ApiResponse<Theater[]>>(`/theaters/region/code/${regionCode}`);
    return response.data.data;
  }
};

export const regionService = {
  async getAllRegions(): Promise<Region[]> {
    const response = await api.get<ApiResponse<Region[]>>('/regions');
    return response.data.data;
  },

  async getRegionById(id: number): Promise<Region> {
    const response = await api.get<ApiResponse<Region>>(`/regions/${id}`);
    return response.data.data;
  }
};

export const roomService = {
  async getRoomsByTheater(theaterId: number): Promise<Room[]> {
    const response = await api.get<ApiResponse<Room[]>>(`/rooms/theater/${theaterId}`);
    return response.data.data;
  },

  async getRoomById(id: number): Promise<Room> {
    const response = await api.get<ApiResponse<Room>>(`/rooms/${id}`);
    return response.data.data;
  }
};

export const seatService = {
  async getSeatsByRoom(roomId: number): Promise<Seat[]> {
    const response = await api.get<ApiResponse<Seat[]>>(`/seats/room/${roomId}`);
    return response.data.data;
  },

  async getSeatsByShowtime(showtimeId: number, roomId: number): Promise<Seat[]> {
    const response = await api.get<ApiResponse<Seat[]>>(`/seats/showtime/${showtimeId}/room/${roomId}`);
    return response.data.data;
  }
};
