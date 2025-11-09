import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

interface LocationTrackingOptions {
  enabled: boolean;
  onPermissionDenied?: () => void;
}

interface LocationTrackingResult {
  isTracking: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  location: Location.LocationObject | null;
  error: string | null;
}

export function useLocationTracking(
  options: LocationTrackingOptions
): LocationTrackingResult {
  const { enabled, onPermissionDenied } = options;
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (err) {
      console.error('Error checking location permission:', err);
      setHasPermission(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      setError(null);
      
      // Request foreground permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setHasPermission(false);
        setError('Location permission denied');
        
        if (onPermissionDenied) {
          onPermissionDenied();
        } else {
          Alert.alert(
            'Location Permission Required',
            'Please enable location permissions in your device settings to share your location.',
            [{ text: 'OK' }]
          );
        }
        return false;
      }

      setHasPermission(true);
      return true;
    } catch (err: any) {
      console.error('Error requesting location permission:', err);
      setError(err.message || 'Failed to request location permission');
      setHasPermission(false);
      return false;
    }
  };

  const startTracking = async () => {
    try {
      setError(null);

      // Check if we have permission
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          return;
        }
      }

      // Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError('Location services are disabled. Please enable them in your device settings.');
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Start watching location
      watchSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (newLocation) => {
          setLocation(newLocation);
          setError(null);
        }
      );

      setIsTracking(true);
    } catch (err: any) {
      console.error('Error starting location tracking:', err);
      setError(err.message || 'Failed to start location tracking');
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    if (watchSubscriptionRef.current) {
      watchSubscriptionRef.current.remove();
      watchSubscriptionRef.current = null;
    }
    setIsTracking(false);
    setLocation(null);
  };

  // Handle enabled/disabled state changes
  useEffect(() => {
    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }

    // Cleanup on unmount
    return () => {
      stopTracking();
    };
  }, [enabled]);

  return {
    isTracking,
    hasPermission,
    requestPermission,
    startTracking,
    stopTracking,
    location,
    error,
  };
}

