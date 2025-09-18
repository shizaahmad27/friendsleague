import api from './api';

export interface User {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export const usersApi = {
  // Search users by username
  searchUsers: async (username: string): Promise<User[]> => {
    const response = await api.get(`/users/search?username=${encodeURIComponent(username)}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<User> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Get user's friends
  getUserFriends: async (): Promise<User[]> => {
    const response = await api.get('/users/friends');
    return response.data;
  },

  // Update online status
  updateOnlineStatus: async (isOnline: boolean): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/users/online-status', { isOnline });
    return response.data;
  },
};
