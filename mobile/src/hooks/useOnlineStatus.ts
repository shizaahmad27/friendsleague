import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usersApi } from '../services/usersApi';
import { useAuthStore } from '../store/authStore';
import socketService from '../services/socketService';

export const useOnlineStatus = () => {
  const { user, isAuthenticated } = useAuthStore();
  const appState = useRef(AppState.currentState);

  // Update online status when user logs in/out
  useEffect(() => {
    if (isAuthenticated && user) {
      // Set user as online when they log in
      updateOnlineStatus(true);
    } else {
      // Set user as offline when they log out
      updateOnlineStatus(false);
    }
  }, [isAuthenticated, user]);

  // Update online status when app goes to background/foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        if (isAuthenticated && user) {
          updateOnlineStatus(true);
        }
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        if (isAuthenticated && user) {
          updateOnlineStatus(false);
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated, user]);

  // Update online status when component unmounts (user closes app)
  useEffect(() => {
    return () => {
      if (isAuthenticated && user) {
        updateOnlineStatus(false);
      }
    };
  }, [isAuthenticated, user]);

  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!isAuthenticated || !user) return;

    try {
      // Update database
      await usersApi.updateOnlineStatus(isOnline);
      
      // Trigger Socket.io events for real-time updates
      if (isOnline) {
        // Connect socket and join user room
        socketService.connect();
        socketService.joinUser(user.id);
      } else {
        // Leave user room and disconnect
        socketService.leaveUser(user.id);
        socketService.disconnect();
      }
      
      console.log(`Online status updated: ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  };

  return {
    updateOnlineStatus,
  };
};
