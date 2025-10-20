import * as React from 'react';
import { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceRecorder, VoiceRecorderCallbacks } from '../hooks/useVoiceRecorder';

interface VoiceRecorderProps extends VoiceRecorderCallbacks {
  disabled?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const CANCEL_SLIDE_DISTANCE = 100;

export const VoiceRecorder: React.FC<VoiceRecorderProps> = (props) => {
  const {
    onRecordingComplete,
    onRecordingCancelled,
    onError,
    disabled = false,
  } = props;
  const [isPressed, setIsPressed] = useState(false);
  const [showCancelHint, setShowCancelHint] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const panResponderRef = useRef<any>(null);

  const {
    isRecording,
    isUploading,
    duration,
    uploadProgress,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    getFormattedDuration,
    isRecordingActive,
  } = useVoiceRecorder({
    onRecordingComplete,
    onRecordingCancelled,
    onError,
  });

  // Pulse animation for recording state
  React.useEffect(() => {
    if (isRecording) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Pan responder for slide-to-cancel
  React.useEffect(() => {
    if (isRecording) {
      panResponderRef.current = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setShowCancelHint(true);
        },
        onPanResponderMove: (_, gestureState) => {
          const slideDistance = Math.max(0, -gestureState.dx);
          slideAnim.setValue(slideDistance);
          
          // Show cancel hint if sliding left
          if (gestureState.dx < -30) {
            setShowCancelHint(true);
          } else {
            setShowCancelHint(false);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          // If slid left enough, cancel recording
          if (gestureState.dx < -CANCEL_SLIDE_DISTANCE) {
            cancelRecording();
          } else {
            // Otherwise, stop recording normally
            stopRecording();
          }
          
          // Reset animations
          slideAnim.setValue(0);
          setShowCancelHint(false);
        },
      });
    } else {
      panResponderRef.current = null;
    }
  }, [isRecording, slideAnim, cancelRecording, stopRecording]);

  const handlePressIn = async () => {
    if (disabled || isRecordingActive()) return;
    
    setIsPressed(true);
    
    // Scale down animation
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
    
    // Start recording
    await startRecording();
  };

  const handlePressOut = () => {
    if (!isRecording) return;
    
    setIsPressed(false);
    
    // Scale back animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    
    // Stop recording (unless cancelled by slide)
    if (!showCancelHint) {
      stopRecording();
    }
  };

  const getButtonIcon = () => {
    if (isUploading) return 'cloud-upload-outline';
    if (isRecording) return 'mic';
    return 'mic-outline';
  };

  const getButtonColor = () => {
    if (isUploading) return '#FF9500';
    if (isRecording) return '#FF3B30';
    return '#007AFF';
  };

  const renderRecordingUI = () => {
    if (!isRecording && !isUploading) return null;

    return (
      <View style={styles.recordingContainer}>
        <View style={styles.recordingContent}>
          {isRecording && (
            <>
              <Animated.View style={[styles.recordingIcon, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="mic" size={20} color="#FF3B30" />
              </Animated.View>
              <Text style={styles.recordingText}>
                {getFormattedDuration()}
              </Text>
              {showCancelHint && (
                <View style={styles.cancelHint}>
                  <Ionicons name="close" size={16} color="#FF3B30" />
                  <Text style={styles.cancelText}>Release to cancel</Text>
                </View>
              )}
            </>
          )}
          
          {isUploading && (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#FF9500" />
              <Text style={styles.uploadingText}>Uploading...</Text>
              {uploadProgress && (
                <Text style={styles.progressText}>
                  {uploadProgress.percentage}%
                </Text>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  if (error) {
    Alert.alert('Recording Error', error);
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            transform: [
              { scale: scaleAnim },
              { translateX: slideAnim },
            ],
          },
        ]}
        {...(panResponderRef.current?.panHandlers || {})}
      >
        <TouchableOpacity
          style={[
            styles.recordButton,
            { backgroundColor: getButtonColor() },
            disabled && styles.disabledButton,
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || isUploading}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={getButtonIcon()} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </Animated.View>
      
      {renderRecordingUI()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  recordingContainer: {
    position: 'absolute',
    left: 50,
    right: 0,
    height: 40,
    justifyContent: 'center',
  },
  recordingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 120,
  },
  recordingIcon: {
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  cancelHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  uploadingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 8,
  },
});
