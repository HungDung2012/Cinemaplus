import api from '@/lib/axios';

// ===================== MOVIES =====================
export const adminMovieService = {
  getAll: async (params?: any) => {
    const response = await api.get('/admin/movies', { params });
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
    return response.data?.data;
  },

  create: async (data: any) => {
    const response = await api.post('/admin/theaters', data);
    return response.data?.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/admin/theaters/${id}`, data);
    return response.data?.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/theaters/${id}`);
    return response.data?.data;
  },
};

// ===================== SHOWTIMES =====================
export const adminShowtimeService = {
  getAll: async (params?: any) => {
    // Params: startDate, endDate, theaterIds, movieIds, page, size
    const response = await api.get('/admin/showtimes', {
      params: {
        ...params,
        theaterIds: params?.theaterIds?.join(','), // Ensure array is sent as comma separated if needed by axios/backend default, though standard repeat is fine. Strings are safer.
        movieIds: params?.movieIds?.join(',')
      }
    });
    return response.data?.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/admin/showtimes/${id}`);
    return response.data?.data;
  },

  create: async (data: any) => {
    const response = await api.post('/admin/showtimes', data);
    return response.data?.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/admin/showtimes/${id}`, data);
    return response.data?.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/showtimes/${id}`);
    return response.data?.data;
  },
};

// ===================== BOOKINGS =====================
export const adminBookingService = {
  getAll: async () => {
    const response = await api.get('/admin/bookings');
    return response.data?.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/admin/bookings/${id}`);
    return response.data?.data;
  },

  updateStatus: async (id: number, status: string) => {
    const response = await api.put(`/admin/bookings/${id}/status`, { status });
    return response.data?.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/bookings/${id}`);
    return response.data?.data;
  },
};

// ===================== USERS =====================
export const adminUserService = {
  getAll: async () => {
    const response = await api.get('/admin/users');
    return response.data?.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data?.data;
  },

  create: async (data: any) => {
    const response = await api.post('/admin/users', data);
    return response.data?.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data?.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data?.data;
  },

  updateRole: async (id: number, role: string) => {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data?.data;
  },
};

// ===================== FOODS =====================
export const adminFoodService = {
  getAll: async () => {
    const response = await api.get('/admin/foods');
    return response.data?.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/admin/foods/${id}`);
    return response.data?.data;
  },

  create: async (data: any) => {
    const response = await api.post('/admin/foods', data);
    return response.data?.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/admin/foods/${id}`, data);
    return response.data?.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/foods/${id}`);
    return response.data?.data;
  },
};

// ===================== PROMOTIONS =====================
export const adminPromotionService = {
  getAll: async () => {
    const response = await api.get('/admin/promotions');
    return response.data?.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/admin/promotions/${id}`);
    return response.data?.data;
  },

  create: async (data: any) => {
    const response = await api.post('/admin/promotions', data);
    return response.data?.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/admin/promotions/${id}`, data);
    return response.data?.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/promotions/${id}`);
    return response.data?.data;
  },
};

// ===================== REVIEWS =====================
export const adminReviewService = {
  getAll: async () => {
    const response = await api.get('/admin/reviews');
    return response.data?.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/reviews/${id}`);
    return response.data?.data;
  },
};

// ===================== ROOMS =====================
export const adminRoomService = {
  getAll: async () => {
    const response = await api.get('/rooms');
    return response.data?.data;
  },

  getByTheater: async (theaterId: number) => {
    const response = await api.get(`/rooms/theater/${theaterId}`);
    return response.data?.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/rooms/${id}`);
    return response.data?.data;
  },

  create: async (data: any) => {
    const response = await api.post('/admin/rooms', data);
    return response.data?.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/admin/rooms/${id}`, data);
    return response.data?.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/admin/rooms/${id}`);
    return response.data?.data;
  },
};

// ===================== DASHBOARD =====================
export const adminDashboardService = {
  getStats: async () => {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
  }
};

// ===================== CITIES =====================
export const adminCityService = {
  getAll: async () => {
    const response = await api.get('/cities');
    return response.data?.data;
  }
};
