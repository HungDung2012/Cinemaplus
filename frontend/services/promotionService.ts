import api from '@/lib/axios';
import { Promotion, PromotionTypeOption } from '@/types';

/**
 * Lấy tất cả khuyến mãi đang hoạt động
 */
export const getAllPromotions = async (): Promise<Promotion[]> => {
  const response = await api.get('/promotions');
  return response.data;
};

/**
 * Lấy khuyến mãi nổi bật
 */
export const getFeaturedPromotions = async (): Promise<Promotion[]> => {
  const response = await api.get('/promotions/featured');
  return response.data;
};

/**
 * Lấy khuyến mãi theo loại
 */
export const getPromotionsByType = async (type: string): Promise<Promotion[]> => {
  const response = await api.get(`/promotions/type/${type}`);
  return response.data;
};

/**
 * Lấy chi tiết khuyến mãi theo ID
 */
export const getPromotionById = async (id: number | string): Promise<Promotion> => {
  const response = await api.get(`/promotions/${id}`);
  return response.data;
};

/**
 * Tìm kiếm khuyến mãi
 */
export const searchPromotions = async (keyword: string): Promise<Promotion[]> => {
  const response = await api.get('/promotions/search', { params: { keyword } });
  return response.data;
};

/**
 * Lấy danh sách các loại khuyến mãi
 */
export const getPromotionTypes = async (): Promise<PromotionTypeOption[]> => {
  const response = await api.get('/promotions/types');
  return response.data;
};
