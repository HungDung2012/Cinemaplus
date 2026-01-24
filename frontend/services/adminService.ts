import api from '@/lib/axios';

// ===================== MOVIES =====================
export const adminMovieService = {
  getAll: async (params?: any) => {
    const response = await api.get('/admin/movies', { params });
    // Keep consistent return structure with original code which returned content array directly
    // But page component will need pagination info now.
    // Let's return the full response data which contains { content, pageNumber, ... } if requesting pagination
    return response.data?.data;
  },

  getById: async (id: number | string) => {
    const response = await api.get(`/admin/movies/${id}`);
    return response.data?.data;
  },

  create: async (data: any) => {
    const response = await api.post('/admin/movies', data);
    return response.data?.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/admin/movies/${id}`, data);
    return response.data?.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/movies/${id}`);
    return response.data;
  },
};

// ===================== THEATERS =====================
export const adminTheaterService = {
  getAll: async () => {
    const response = await api.get('/admin/theaters');
    return response.data?.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/admin/theaters/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/admin/theaters', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/admin/theaters/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/theaters/${id}`);
    return response.data;
  },
};

// ===================== SHOWTIMES =====================
export const adminShowtimeService = {
  getAll: async (params?: any) => {
    // Sử dụng endpoint range mới tạo để lọc theo tuần
    const response = await api.get('/admin/showtimes/range', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/admin/showtimes/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/admin/showtimes', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/admin/showtimes/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/showtimes/${id}`);
    return response.data;
  },
};

// ===================== BOOKINGS =====================
export const adminBookingService = {
  getAll: async () => {
    const response = await api.get('/admin/bookings');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/admin/bookings/${id}`);
    return response.data;
  },

  updateStatus: async (id: number, status: string) => {
    const response = await api.put(`/admin/bookings/${id}/status`, { status });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/bookings/${id}`);
    return response.data;
  },
};

// ===================== USERS =====================
export const adminUserService = {
  getAll: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  updateRole: async (id: number, role: string) => {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data;
  },
};

// ===================== FOODS =====================
export const adminFoodService = {
  getAll: async () => {
    const response = await api.get('/admin/foods');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/admin/foods/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/admin/foods', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/admin/foods/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/foods/${id}`);
    return response.data;
  },
};

// ===================== PROMOTIONS =====================
export const adminPromotionService = {
  getAll: async () => {
    const response = await api.get('/admin/promotions');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/admin/promotions/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/admin/promotions', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/admin/promotions/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/promotions/${id}`);
    return response.data;
  },
};

// ===================== REVIEWS =====================
export const adminReviewService = {
  getAll: async () => {
    const response = await api.get('/admin/reviews');
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/reviews/${id}`);
    return response.data;
  },
};

// ===================== ROOMS =====================
export const adminRoomService = {
  getAll: async () => {
    const response = await api.get('/admin/rooms');
    return response.data;
  },

  getByTheater: async (theaterId: number) => {
    const response = await api.get(`/admin/rooms/theater/${theaterId}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/admin/rooms', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/admin/rooms/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/rooms/${id}`);
    return response.data;
  },
};
