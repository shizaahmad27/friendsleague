// mobile/src/hooks/useUserOnlineStatus.ts
import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';

interface OnlineStatusData {
  userId: string;
  timestamp: string;
}

export const useUserOnlineStatus = () => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [lastSeenTimes, setLastSeenTimes] = useState<Map<string, string>>(new Map());
  const [privacySettings, setPrivacySettings] = useState<Map<string, { showOnlineStatus: boolean; hideFromMe: boolean }>>(new Map());

  // Handle user coming online
  const handleUserOnline = useCallback((data: OnlineStatusData) => {
    setOnlineUsers(prev => new Set([...prev, data.userId]));
    setLastSeenTimes(prev => new Map(prev).set(data.userId, data.timestamp));
  }, []);

  // Handle user going offline
  const handleUserOffline = useCallback((data: OnlineStatusData) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(data.userId);
      return newSet;
    });
    setLastSeenTimes(prev => new Map(prev).set(data.userId, data.timestamp));
  }, []);

  // Handle global privacy setting changes
  const handlePrivacyGlobalChanged = useCallback((data: { userId: string; showOnlineStatus: boolean; timestamp: string }) => {
    setPrivacySettings(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(data.userId) || { showOnlineStatus: true, hideFromMe: false };
      newMap.set(data.userId, { ...current, showOnlineStatus: data.showOnlineStatus });
      return newMap;
    });
  }, []);

  // Handle per-friend privacy setting changes
  const handlePrivacyFriendChanged = useCallback((data: { userId: string; targetUserId: string; hideOnlineStatus: boolean; timestamp: string }) => {
    setPrivacySettings(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(data.userId) || { showOnlineStatus: true, hideFromMe: false };
      newMap.set(data.userId, { ...current, hideFromMe: data.hideOnlineStatus });
      return newMap;
    });
  }, []);

  // Set up socket listeners
  useEffect(() => {
    socketService.onUserOnline(handleUserOnline);
    socketService.onUserOffline(handleUserOffline);
    socketService.onPrivacyGlobalChanged(handlePrivacyGlobalChanged);
    socketService.onPrivacyFriendChanged(handlePrivacyFriendChanged);

    return () => {
      socketService.offUserOnline(handleUserOnline);
      socketService.offUserOffline(handleUserOffline);
      socketService.offPrivacyGlobalChanged(handlePrivacyGlobalChanged);
      socketService.offPrivacyFriendChanged(handlePrivacyFriendChanged);
    };
  }, [handleUserOnline, handleUserOffline, handlePrivacyGlobalChanged, handlePrivacyFriendChanged]);

  // Helper function to check if a user is online (considering privacy settings)
  const isUserOnline = useCallback((userId: string): boolean => {
    const isActuallyOnline = onlineUsers.has(userId);
    if (!isActuallyOnline) return false;
    
    // Check privacy settings
    const privacy = privacySettings.get(userId);
    if (!privacy) return true; // Default to showing if no privacy settings
    
    // If user has hidden their status globally, don't show
    if (!privacy.showOnlineStatus) return false;
    
    // If user has hidden their status from me specifically, don't show
    if (privacy.hideFromMe) return false;
    
    return true;
  }, [onlineUsers, privacySettings]);

  // Helper function to get last seen time
  const getLastSeenTime = useCallback((userId: string): string | null => {
    return lastSeenTimes.get(userId) || null;
  }, [lastSeenTimes]);

  // Helper function to format last seen time
  const formatLastSeen = useCallback((timestamp: string): string => {
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return lastSeen.toLocaleDateString();
    }
  }, []);

  return {
    isUserOnline,
    getLastSeenTime,
    formatLastSeen,
    onlineUsers: Array.from(onlineUsers),
  };
};
