// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { User } from '../aws-config';
import { AuthService } from '../services/authService';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = (): void => {
    const token = sessionStorage.getItem('aws_token');
    const userData = sessionStorage.getItem('aws_user');

    if (token && userData) {
      try {
        if (AuthService.verifyToken(token)) {
          const user = JSON.parse(userData) as User;
          setUser(user);
        } else {
          console.warn('Token expirado, cerrando sesión');
          logout();
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
    setLoading(false);
  };

  const login = (userData: User, token: string): void => {
    sessionStorage.setItem('aws_token', token);
    sessionStorage.setItem('aws_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = (): void => {
    sessionStorage.removeItem('aws_token');
    sessionStorage.removeItem('aws_user');
    setUser(null);
  };

  const updateUser = (updates: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      sessionStorage.setItem('aws_user', JSON.stringify(updatedUser));
    }
  };

  const isAuthenticated = !!user && !!sessionStorage.getItem('aws_token');

  return { user, loading, login, logout, isAuthenticated, updateUser };
};