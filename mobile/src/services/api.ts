import axios from 'axios';
import { AuthResponse, SignUpData, SignInData, ApiResponse } from '../types';
import { useAuthStore } from '../store/authStore';

// Create axios instance
const api = axios.create({
  baseURL: __DEV__ 
    ? 'http://192.168.0.110:3000/api'  
    : 'https://api.friendsleague.com/api',  //production senere
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    console.log('API Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Attempting token refresh...');
      originalRequest._retry = true;
      
      try {
        const { refreshToken, setAuth, logout } = useAuthStore.getState();
        
        if (refreshToken) {
          console.log('Refreshing token with:', refreshToken.substring(0, 20) + '...');
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          console.log('New access token received:', accessToken.substring(0, 20) + '...');
          
          // Update the auth store with new token
          const currentState = useAuthStore.getState();
          currentState.setAuth({
            ...currentState,
            accessToken,
          });
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          console.log('Retrying original request...');
          return api(originalRequest);
        } else {
          console.log('No refresh token available');
          logout();
        }
      } catch (refreshError) {
        console.log('Token refresh failed:', refreshError);
        // Refresh failed, logout user
        logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API functions
export const authApi = {
  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  signIn: async (data: SignInData): Promise<AuthResponse> => {
    const response = await api.post('/auth/signin', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};

export default api;
