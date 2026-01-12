import { api } from '@/lib/axios';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';

// Decode JWT token để lấy payload
function decodeToken(token: string): { exp: number; [key: string]: unknown } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Kiểm tra token có hết hạn chưa
function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  // exp là Unix timestamp (giây), Date.now() là milliseconds
  // Thêm buffer 30 giây để tránh edge case
  return decoded.exp * 1000 < Date.now() + 30000;
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  setToken(token: string) {
    localStorage.setItem('token', token);
  },

  setUser(user: AuthResponse) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser(): AuthResponse | null {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      const token = this.getToken();
      
      // Kiểm tra nếu token hết hạn thì clear và return null
      if (!token || isTokenExpired(token)) {
        this.clearAuth();
        return null;
      }
      
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Kiểm tra token có hết hạn không
    if (isTokenExpired(token)) {
      this.clearAuth();
      return false;
    }
    
    return true;
  },

  // Clear tất cả auth data
  clearAuth() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Lấy thời gian còn lại của token (milliseconds)
  getTokenRemainingTime(): number | null {
    const token = this.getToken();
    if (!token) return null;
    
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return null;
    
    return decoded.exp * 1000 - Date.now();
  }
};
