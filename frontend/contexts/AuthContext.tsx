'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthResponse, User, LoginRequest, RegisterRequest } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: AuthResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (...roles: string[]) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in và token còn hạn
    const storedUser = authService.getUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
    } else {
      // Token hết hạn hoặc không có
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await authService.login(data);
    authService.setToken(response.token);
    authService.setUser(response);
    setUser(response);
  };

  const register = async (data: RegisterRequest) => {
    const response = await authService.register(data);
    authService.setToken(response.token);
    authService.setUser(response);
    setUser(response);
  };

  const logout = () => {
    authService.clearAuth();
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // ADMIN always has all permissions
    if (user.role === 'ADMIN') return true;
    if (!user.permissions || user.permissions.length === 0) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (...roles: string[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  const ADMIN_ROLES = ['ADMIN', 'MANAGER'];
  const isAdmin = !!user && ADMIN_ROLES.includes(user.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && authService.isAuthenticated(),
        login,
        register,
        logout,
        hasPermission,
        hasRole,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
