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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    if (mediaType === 'VIDEO') {
      return (
        <Video
          source={{ uri: mediaUrl }}
          style={styles.media}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted={false}
          onPlaybackStatusUpdate={(status) => setVideoStatus(status)}
        />
      );
    } else {
      return (
        <Image
          source={{ uri: mediaUrl }}
          style={styles.media}
          resizeMode="cover"
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
            
            {timeRemaining !== null && (
              <View style={styles.timerContainer}>
                <View style={styles.timerCircle}>
                  <Text style={styles.timerText}>
                    {formatTime(timeRemaining)}
                  </Text>
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
              {timeRemaining === null 
                ? 'Tap to close • Swipe down to dismiss'
                : 'Tap to close • Swipe down to dismiss'
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  timerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  mediaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    width: screenWidth,
    height: screenHeight,
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
