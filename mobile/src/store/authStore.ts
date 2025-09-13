import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthResponse } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setAuth: (authData: AuthResponse) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // State
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  setAuth: (authData: AuthResponse) =>
    set({
      user: authData.user,
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      isAuthenticated: true,
      error: null,
    }),

  setUser: (user: User) =>
    set({
      user,
    }),

  setLoading: (loading: boolean) =>
    set({
      isLoading: loading,
    }),

  setError: (error: string | null) =>
    set({
      error,
    }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    }),

  clearError: () =>
    set({
      error: null,
    }),
}));
