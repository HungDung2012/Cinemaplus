import axios from 'axios';
import { authService } from '@/services/authService';
import { resolveApiBaseUrl } from '@/lib/apiBaseUrl';

// Default to the Next.js proxy in production, but also accept absolute backend origins.
const API_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Nó bảo Axios gửi kèm Cookies (nếu có) trong mọi request.
  withCredentials: true,
  timeout: 10000,
});

// Interceptor để thêm token vào header
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Kiểm tra token có hợp lệ không trước khi gửi request
      if (authService.isAuthenticated()) {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        // Token hết hạn, xóa auth data
        authService.clearAuth();
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
// Interceptor để xử lý response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Xử lý khi token hết hạn hoặc không hợp lệ
      if (typeof window !== 'undefined') {
        authService.clearAuth();
      }
    }
    return Promise.reject(error);
  }
);
