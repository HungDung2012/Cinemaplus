import { api } from '@/lib/axios';
import { ApiResponse, Food, FoodCategory } from '@/types';

export const foodService = {
  async getAllFoods(): Promise<Food[]> {
    const response = await api.get<ApiResponse<Food[]>>('/foods');
    return response.data.data;
  },

  async getFoodsByCategory(category: FoodCategory): Promise<Food[]> {
    const response = await api.get<ApiResponse<Food[]>>(`/foods/category/${category}`);
    return response.data.data;
  },

  async getCombos(): Promise<Food[]> {
    const response = await api.get<ApiResponse<Food[]>>('/foods/combos');
    return response.data.data;
  },

  async getSingleItems(): Promise<Food[]> {
    const response = await api.get<ApiResponse<Food[]>>('/foods/singles');
    return response.data.data;
  },

  async getFoodsGrouped(): Promise<Record<string, Food[]>> {
    const response = await api.get<ApiResponse<Record<string, Food[]>>>('/foods/grouped');
    return response.data.data;
  },

  async getFoodById(id: number): Promise<Food> {
    const response = await api.get<ApiResponse<Food>>(`/foods/${id}`);
    return response.data.data;
  },

  async getCategories(): Promise<FoodCategory[]> {
    const response = await api.get<ApiResponse<FoodCategory[]>>('/foods/categories');
    return response.data.data;
  }
};
