import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Linking, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useOnlineStatus } from './src/hooks/useOnlineStatus';
import { useAuthStore } from './src/store/authStore';
import { eventsApi } from './src/services/eventsApi';
import { useNavigationContainerRef } from '@react-navigation/native';

export default function App() {
  // Initialize online status management
  useOnlineStatus();
  const { isAuthenticated } = useAuthStore();
  const navRef = useNavigationContainerRef();

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;
      try {
        const parsed = new URL(url);
        // friendsleague://event-invite?eventId=xxx&code=YYYYYYYY
        if (parsed.hostname === 'event-invite' || parsed.pathname.includes('event-invite')) {
          const eventId = parsed.searchParams.get('eventId');
          const code = parsed.searchParams.get('code');
          if (!eventId || !code) return;
          if (!isAuthenticated) {
            Alert.alert('Sign in required', 'Please sign in to join this event.');
            return;
          }
          await eventsApi.useInvitation(eventId, code);
          // Navigate to event details
          navRef.current?.navigate('EventDetails' as never, { eventId } as never);
        }
      } catch (e) {
        // ignore
      }
    };

    // Handle initial URL
    Linking.getInitialURL().then(handleUrl);
    // Subscribe to incoming URLs
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [isAuthenticated]);

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
