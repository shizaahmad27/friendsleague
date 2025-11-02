import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface EphemeralViewerProps {
  visible: boolean;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  viewDuration?: number | null;
  onClose: () => void;
  onMarkAsViewed: () => Promise<void>;
}

export const EphemeralViewer: React.FC<EphemeralViewerProps> = ({
  visible,
  mediaUrl,
  mediaType,
  viewDuration,
  onClose,
  onMarkAsViewed,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(viewDuration || null);
  const [isMarkedAsViewed, setIsMarkedAsViewed] = useState(false);
  const [videoStatus, setVideoStatus] = useState<any>({});
  
  const pan = useRef(new Animated.ValueXY()).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer color logic
  const getTimerColor = (seconds: number) => {
    if (seconds > 5) return '#fff'; // White/green
    if (seconds > 3) return '#FFA500'; // Orange
    return '#FF0000'; // Red
  };

  // Progress calculation
  const progress = viewDuration 
    ? ((viewDuration - (timeRemaining || 0)) / viewDuration) * 100 
    : 0;

  // Mark as viewed when modal opens
  useEffect(() => {
    if (visible && !isMarkedAsViewed) {
      onMarkAsViewed().then(() => {
        setIsMarkedAsViewed(true);
      }).catch((error) => {
        console.error('Failed to mark as viewed:', error);
        Alert.alert('Error', 'Failed to mark snap as viewed');
      });
    }
  }, [visible, isMarkedAsViewed, onMarkAsViewed]);

  // Timer countdown
  useEffect(() => {
    if (visible && timeRemaining && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev && prev <= 1) {
            handleClose();
            return 0;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [visible, timeRemaining]);

  // Pulsing animation when timer < 3 seconds
  useEffect(() => {
    if (timeRemaining && timeRemaining < 3) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [timeRemaining, pulseAnim]);

  const handleClose = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onClose();
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 20;
    },
    onPanResponderMove: (_, gestureState) => {
      pan.setValue({ x: 0, y: gestureState.dy });
      
      // Fade out as user drags down
      const opacity = Math.max(0, 1 - Math.abs(gestureState.dy) / 200);
      fadeAnim.setValue(opacity);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dy) > 100) {
        // Close if dragged down far enough
        Animated.parallel([
          Animated.timing(pan, {
            toValue: { x: 0, y: screenHeight },
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          handleClose();
        });
      } else {
        // Snap back
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });

  const renderMedia = () => {
    // Don't render if mediaUrl is empty
    if (!mediaUrl || mediaUrl.trim() === '') {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Loading...</Text>
        </View>
      );
    }

    if (mediaType === 'VIDEO') {
      const isPlayOnce = viewDuration === -1;
      const isLoop = viewDuration === null;
      
      return (
        <Video
          source={{ uri: mediaUrl }}
          style={styles.mediaFit}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping={isLoop}
          isMuted={false}
          onPlaybackStatusUpdate={(status) => {
            setVideoStatus(status);
            // Close automatically when video finishes playing (Play Once mode)
            if (isPlayOnce && status.isLoaded && status.didJustFinish) {
              handleClose();
            }
          }}
        />
      );
    } else {
      return (
        <Image
          source={{ uri: mediaUrl }}
          style={styles.mediaFitImage}
          resizeMode="contain"
        />
      );
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: pan.y }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Header with timer and close button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            {mediaType === 'IMAGE' && timeRemaining !== null && (
              <View style={styles.timerContainer}>
                <Animated.View 
                  style={[
                    styles.timerCircle,
                    {
                      transform: [{ scale: pulseAnim }],
                      borderColor: getTimerColor(timeRemaining),
                    }
                  ]}
                >
                  <Text style={[styles.timerText, { color: getTimerColor(timeRemaining) }]}>
                    {formatTime(timeRemaining)}
                  </Text>
                </Animated.View>
                {/* Progress ring */}
                <View style={styles.progressRing}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        transform: [{ rotate: `${(progress * 3.6) - 90}deg` }],
                        backgroundColor: getTimerColor(timeRemaining),
                      }
                    ]} 
                  />
                </View>
              </View>
            )}
            
            {mediaType === 'VIDEO' && (
              <View style={styles.timerContainer}>
                <View style={styles.timerCircle}>
                  <Ionicons 
                    name={viewDuration === -1 ? 'play-circle-outline' : 'infinite-outline'} 
                    size={24} 
                    color="#fff" 
                  />
                </View>
              </View>
            )}
            
            <View style={styles.placeholder} />
          </View>

          {/* Media */}
          <View style={styles.mediaContainer}>
            {renderMedia()}
          </View>

          {/* Bottom instructions */}
          <View style={styles.bottomContainer}>
            <Text style={styles.instructionText}>
              {mediaType === 'VIDEO' 
                ? (viewDuration === -1 
                    ? 'Tap to close • Video will stop after playing once'
                    : 'Tap to close • Video will loop until you close it')
                : (timeRemaining === null 
                    ? 'Tap to close • Swipe down to dismiss'
                    : 'Tap to close • Swipe down to dismiss')
              }
            </Text>
          </View>
        </Animated.View>

        {/* Tap to close overlay */}
        <TouchableOpacity
          style={styles.tapOverlay}
          onPress={handleClose}
          activeOpacity={1}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  tapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  timerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressFill: {
    position: 'absolute',
    width: 4,
    height: 45,
    backgroundColor: '#fff',
    borderRadius: 2,
    top: 0,
    left: '50%',
    marginLeft: -2,
    transformOrigin: 'bottom center',
  },
  placeholder: {
    width: 40,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
  },
  mediaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  media: {
    width: screenWidth,
    height: screenHeight,
  },
  mediaFit: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mediaFitImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
});
