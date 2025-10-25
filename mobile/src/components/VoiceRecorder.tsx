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
  onVoiceSend: (audioUrl: string, duration: number) => void;
  disabled?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const WAVEFORM_BARS = 7;
const MAX_BAR_HEIGHT = 40;
const MIN_BAR_HEIGHT = 8;

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onVoiceSend,
  disabled = false,
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
      const audioUrl = await uploadRecording();
      onVoiceSend(audioUrl, duration);
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

  // Render recording UI
  const renderRecordingUI = (): React.ReactNode => {
    if (recordingState === 'idle') {
      return (
        <TouchableOpacity
          style={[styles.micButton, disabled && styles.micButtonDisabled]}
          onPress={startRecording}
          disabled={disabled}
        >
          <Ionicons name="mic" size={24} color={disabled ? '#999' : '#007AFF'} />
        </TouchableOpacity>
      );
    }

    if (recordingState === 'recording') {
      return (
        <Animated.View style={[styles.recordingContainer, { opacity: recordingOpacity }]}>
          <View style={styles.recordingContent}>
            {renderWaveform()}
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
            <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
              <Ionicons name="stop" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    }

    if (recordingState === 'stopped') {
      return (
        <View style={styles.stoppedContainer}>
          <View style={styles.stoppedContent}>
            {renderWaveform()}
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Ionicons name="close" size={20} color="#FF3B30" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    if (recordingState === 'uploading') {
      return (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.uploadingText}>
            Uploading... {Math.round(uploadProgress)}%
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {renderRecordingUI()}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  micButtonDisabled: {
    borderColor: '#999',
    backgroundColor: '#F5F5F5',
  },
  recordingContainer: {
    width: screenWidth * 0.8,
    maxWidth: 300,
  },
  recordingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stoppedContainer: {
    width: screenWidth * 0.8,
    maxWidth: 300,
  },
  stoppedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  waveformBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 1.5,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 12,
    minWidth: 50,
  },
  stopButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  sendButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  uploadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 4,
  },
});
