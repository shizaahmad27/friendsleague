// mobile/src/hooks/useSwipeToClose.ts
import { useRef, useEffect } from 'react';
import { Animated, PanResponder } from 'react-native';

interface UseSwipeToCloseOptions {
  onClose: () => void;
  enabled?: boolean;
}

export const useSwipeToClose = ({ onClose, enabled = true }: UseSwipeToCloseOptions) => {
  const panY = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  
  const imageScale = panY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  // Reset pan values and animate modal when it opens
  useEffect(() => {
    if (enabled) {
      panY.setValue(0);
      modalOpacity.setValue(0);
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      modalOpacity.setValue(0);
    }
  }, [enabled, panY, modalOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enabled,
      onMoveShouldSetPanResponder: () => enabled,
      onPanResponderGrant: () => {
        if (enabled) {
          panY.setOffset((panY as any)._value);
          panY.setValue(0);
        }
      },
      onPanResponderMove: enabled ? Animated.event([null, { dy: panY }], { useNativeDriver: false }) : undefined,
      onPanResponderRelease: (_, gesture) => {
        if (!enabled) return;
        
        panY.flattenOffset();
        if (gesture.dy > 100 || gesture.vy > 0.5) {
          // Smooth exit animation
          Animated.parallel([
            Animated.timing(panY, { toValue: 1000, duration: 300, useNativeDriver: false }),
            Animated.timing(modalOpacity, { toValue: 0, duration: 300, useNativeDriver: false })
          ]).start(() => {
            onClose();
            // Reset after modal is closed
            setTimeout(() => {
              panY.setValue(0);
            }, 100);
          });
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  return {
    panY,
    modalOpacity,
    imageScale,
    panResponder,
  };
};
