import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

interface VoiceRecorderProps {
  onVoiceSend: (audioUrl: string, duration: number, waveformData?: number[]) => void;
  disabled?: boolean;
  onRecordingStateChange?: (isRecording: boolean) => void;
  isFullWidth?: boolean; // New prop to indicate if this should render full-width UI
}

const { width: screenWidth } = Dimensions.get('window');
const WAVEFORM_BARS = 7;
const MAX_BAR_HEIGHT = 40;
const MIN_BAR_HEIGHT = 8;

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onVoiceSend,
  disabled = false,
  onRecordingStateChange,
  isFullWidth = false,
}) => {
  const {
    recordingState,
    duration,
    audioFile,
    uploadProgress,
    error,
    startRecording,
    stopRecording,
    uploadRecording,
    cancelRecording,
    reset,
  } = useVoiceRecorder();

  // Animation values
  const waveformAnimations = useRef(
    Array.from({ length: WAVEFORM_BARS }, () => new Animated.Value(MIN_BAR_HEIGHT))
  ).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const recordingOpacity = useRef(new Animated.Value(0)).current;

  // Notify parent when recording state changes
  useEffect(() => {
    console.log('VoiceRecorder: Recording state changed to:', recordingState);
    onRecordingStateChange?.(recordingState !== 'idle');
  }, [recordingState, onRecordingStateChange]);

  // Start waveform animation when recording
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let waveformAnimationId: number | null = null;

    if (recordingState === 'recording') {
      // Show recording UI
      Animated.timing(recordingOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Start pulse animation
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // Start waveform animation
      const animateWaveform = () => {
        const animations = waveformAnimations.map((anim, index) => {
          const randomHeight = Math.random() * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) + MIN_BAR_HEIGHT;
          return Animated.timing(anim, {
            toValue: randomHeight,
            duration: 200 + Math.random() * 300,
            useNativeDriver: false,
          });
        });

        Animated.parallel(animations).start(() => {
          if (recordingState === 'recording') {
            waveformAnimationId = requestAnimationFrame(animateWaveform);
          }
        });
      };

      waveformAnimationId = requestAnimationFrame(animateWaveform);
    } else {
      // Hide recording UI
      Animated.timing(recordingOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Reset waveform bars
      waveformAnimations.forEach(anim => {
        anim.setValue(MIN_BAR_HEIGHT);
      });
      pulseAnimation.setValue(1);
    }

    return () => {
      if (pulseLoop) {
        pulseLoop.stop();
      }
      if (waveformAnimationId) {
        cancelAnimationFrame(waveformAnimationId);
      }
    };
  }, [recordingState, waveformAnimations, pulseAnimation, recordingOpacity]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle send
  const handleSend = async (): Promise<void> => {
    try {
      const { audioUrl, waveformData } = await uploadRecording();
      onVoiceSend(audioUrl, duration, waveformData);
      reset();
    } catch (error) {
      console.error('VoiceRecorder: Error sending voice message:', error);
    }
  };

  // Handle cancel
  const handleCancel = async (): Promise<void> => {
    await cancelRecording();
  };

  // Render waveform bars
  const renderWaveform = (): React.ReactNode => {
    return (
      <View style={styles.waveformContainer}>
        {waveformAnimations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: anim,
                backgroundColor: recordingState === 'recording' ? '#007AFF' : '#E5E5EA',
              },
            ]}
          />
        ))}
      </View>
    );
  };

  // If this is full-width mode, always show the recording interface
  if (isFullWidth) {
    return (
      <View style={styles.fullWidthContainer}>
        {/* Recording UI */}
        {recordingState === 'recording' && (
          <View style={styles.recordingRow}>
            {/* Delete button */}
            <TouchableOpacity style={styles.deleteButton} onPress={handleCancel}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>

            {/* Waveform and timer */}
            <View style={styles.centerContent}>
              {renderWaveform()}
              <Text style={styles.timerText}>{formatDuration(duration)}</Text>
            </View>

            {/* Stop button */}
            <TouchableOpacity style={styles.stopButtonCircle} onPress={stopRecording}>
              <View style={styles.stopSquare} />
            </TouchableOpacity>
          </View>
        )}

        {/* Stopped UI (ready to send) */}
        {recordingState === 'stopped' && (
          <View style={styles.recordingRow}>
            {/* Delete button */}
            <TouchableOpacity style={styles.deleteButton} onPress={handleCancel}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>

            {/* Waveform and duration */}
            <View style={styles.centerContent}>
              {renderWaveform()}
              <Text style={styles.timerText}>{formatDuration(duration)}</Text>
            </View>

            {/* Send button */}
            <TouchableOpacity style={styles.sendButtonCircle} onPress={handleSend}>
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* Uploading UI */}
        {recordingState === 'uploading' && (
          <View style={styles.recordingRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.uploadingText}>
              Uploading... {Math.round(uploadProgress)}%
            </Text>
          </View>
        )}

        {/* Error message */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    );
  }

  // Render idle state (just the mic button) - for inline mode
  if (recordingState === 'idle') {
    return (
      <TouchableOpacity
        style={[styles.voiceButton, disabled && styles.voiceButtonDisabled]}
        onPress={startRecording}
        disabled={disabled}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="mic-outline" size={24} color={disabled ? '#999' : '#007AFF'} />
      </TouchableOpacity>
    );
  }

  // This should never happen in inline mode, but just in case
  return null;
};

const styles = StyleSheet.create({
  // Idle state button (inline with other icons)
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 8,
  },
  voiceButtonDisabled: {
    opacity: 0.5,
  },

  // Full-width recording container (replaces input field)
  fullWidthContainer: {
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },

  // Recording row layout (Messenger style)
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Delete button (left side)
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Center content (waveform + timer)
  centerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },

  // Waveform
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  waveformBar: {
    width: 3,
    marginHorizontal: 1.5,
    borderRadius: 1.5,
  },

  // Timer text
  timerText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    minWidth: 45,
  },

  // Stop button (right side when recording)
  stopButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: {
    width: 14,
    height: 14,
    backgroundColor: 'white',
    borderRadius: 2,
  },

  // Send button (right side when stopped)
  sendButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Uploading text
  uploadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },

  // Error text
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 4,
  },
});
