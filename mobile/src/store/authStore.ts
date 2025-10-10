import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthResponse } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usersApi } from '../services/usersApi';


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
  logout: () => Promise<void>;
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

  logout: async () => {
    // Update online status before clearing auth state
    try {
      await usersApi.updateOnlineStatus(false);
      console.log('Online status updated to offline during logout');
    } catch (error) {
      console.error('Failed to update online status during logout:', error);
      // Continue with logout even if online status update fails
    }
    
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () =>
    set({
      error: null,
    }),
}));
