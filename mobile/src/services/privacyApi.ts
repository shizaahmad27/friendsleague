// mobile/src/services/privacyApi.ts
import api from './api';
import { PrivacySettingsResponse } from '../../../shared/types';

export const privacyApi = {
  // Get all privacy settings for the current user
  getPrivacySettings: async (): Promise<PrivacySettingsResponse> => {
    const response = await api.get('/users/privacy-settings');
    return response.data;
  },

  // Update global online status visibility
  updateGlobalOnlineStatus: async (showOnlineStatus: boolean): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/users/privacy-settings/global', { showOnlineStatus });
    return response.data;
  },

  // Update per-friend online status visibility
  updateFriendOnlineStatusVisibility: async (
    friendId: string, 
    hideOnlineStatus: boolean
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/users/privacy-settings/friend/${friendId}`, { hideOnlineStatus });
    return response.data;
  },

  // Get online status visibility setting for a specific friend
  getFriendOnlineStatusVisibility: async (friendId: string): Promise<{ hideOnlineStatus: boolean }> => {
    const response = await api.get(`/users/privacy-settings/friend/${friendId}`);
    return response.data;
  },
};
