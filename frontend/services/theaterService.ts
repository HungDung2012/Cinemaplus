import { api } from '@/lib/axios';
import { ApiResponse, Theater, Room, Seat, Region, City } from '@/types';

export const theaterService = {
  async getAllTheaters(): Promise<Theater[]> {
    const response = await api.get<ApiResponse<Theater[]>>('/theaters');
    return response.data.data;
  },

  async getTheatersByCity(cityId: number): Promise<Theater[]> {
    const response = await api.get<ApiResponse<Theater[]>>(`/theaters/city/${cityId}`);
    return response.data.data;
  },

  async getTheatersByCityCode(cityCode: string): Promise<Theater[]> {
    const response = await api.get<ApiResponse<Theater[]>>(`/theaters/city/code/${cityCode}`);
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

export const cityService = {
  async getAllCities(): Promise<City[]> {
    const response = await api.get<ApiResponse<City[]>>('/cities');
    return response.data.data;
  },

  async getCityById(id: number): Promise<City> {
    const response = await api.get<ApiResponse<City>>(`/cities/${id}`);
    return response.data.data;
  },

  async getCityByCode(code: string): Promise<City> {
    const response = await api.get<ApiResponse<City>>(`/cities/code/${code}`);
    return response.data.data;
  },

  async getCitiesByRegion(regionId: number): Promise<City[]> {
    const response = await api.get<ApiResponse<City[]>>(`/cities/region/${regionId}`);
    return response.data.data;
  },

  async getCitiesByRegionCode(regionCode: string): Promise<City[]> {
    const response = await api.get<ApiResponse<City[]>>(`/cities/region/code/${regionCode}`);
    return response.data.data;
  },

  async getCitiesWithActiveTheaters(): Promise<City[]> {
    const response = await api.get<ApiResponse<City[]>>('/cities/with-theaters');
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
