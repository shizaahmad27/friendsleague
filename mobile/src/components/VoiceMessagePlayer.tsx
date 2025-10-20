import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, AudioPlayerCallbacks } from '../hooks/useAudioPlayer';

interface VoiceMessagePlayerProps extends AudioPlayerCallbacks {
  audioUrl: string;
  duration?: number;
  isOwnMessage?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const MAX_WAVEFORM_WIDTH = screenWidth * 0.6;

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  audioUrl,
  duration = 0,
  isOwnMessage = false,
  onPlaybackComplete,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const playButtonAnim = useRef(new Animated.Value(1)).current;

  const {
    isPlaying,
    position,
    playbackSpeed,
    isLoading,
    error,
    loadAudio,
    togglePlayPause,
    cyclePlaybackSpeed,
    seekTo,
    getFormattedDuration,
    getFormattedPosition,
    getProgressPercentage,
    isAudioLoaded,
  } = useAudioPlayer({
    onPlaybackComplete,
    onError,
  });

  // Load audio when component mounts
  useEffect(() => {
    if (audioUrl) {
      loadAudio(audioUrl).then(() => {
        setIsLoaded(true);
      });
    }
  }, [audioUrl, loadAudio]);

  // Update progress animation
  useEffect(() => {
    const progress = getProgressPercentage();
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [position, getProgressPercentage, progressAnim]);

  // Play button animation
  useEffect(() => {
    if (isPlaying) {
      Animated.spring(playButtonAnim, {
        toValue: 1.1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(playButtonAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [isPlaying, playButtonAnim]);

  const handlePlayPause = () => {
    togglePlayPause(audioUrl);
  };

  const handleSpeedToggle = () => {
    cyclePlaybackSpeed();
  };

  const handleSeek = (event: any) => {
    const { locationX } = event.nativeEvent;
    const waveformWidth = MAX_WAVEFORM_WIDTH - 60; // Account for button width
    const seekPosition = (locationX / waveformWidth) * duration;
    seekTo(seekPosition);
  };

  const getSpeedText = () => {
    switch (playbackSpeed) {
      case 1.0: return '1x';
      case 1.5: return '1.5x';
      case 2.0: return '2x';
      default: return '1x';
    }
  };

  const getPlayButtonIcon = () => {
    if (isLoading) return 'hourglass-outline';
    if (isPlaying) return 'pause';
    return 'play';
  };

  const renderWaveform = () => {
    const bars = 20;
    const barWidth = 3;
    const barSpacing = 2;
    const maxBarHeight = 20;
    
    return (
      <View style={styles.waveformContainer}>
        {Array.from({ length: bars }, (_, index) => {
          // Simple waveform visualization - in a real app, you'd use actual audio data
          const height = Math.random() * maxBarHeight + 4;
          const isActive = (index / bars) * 100 <= getProgressPercentage();
          
          return (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  width: barWidth,
                  height,
                  marginRight: barSpacing,
                  backgroundColor: isActive 
                    ? (isOwnMessage ? '#007AFF' : '#34C759')
                    : (isOwnMessage ? 'rgba(0, 122, 255, 0.3)' : 'rgba(52, 199, 89, 0.3)'),
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={20} color="#FF3B30" />
        <Text style={styles.errorText}>Failed to load audio</Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessage : styles.otherMessage,
    ]}>
      <TouchableOpacity
        style={[
          styles.playButton,
          isOwnMessage ? styles.ownPlayButton : styles.otherPlayButton,
        ]}
        onPress={handlePlayPause}
        disabled={isLoading}
      >
        <Animated.View style={{ transform: [{ scale: playButtonAnim }] }}>
          <Ionicons 
            name={getPlayButtonIcon()} 
            size={20} 
            color="white" 
          />
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <View style={styles.waveformAndTime}>
          <TouchableOpacity
            style={styles.waveformTouchable}
            onPress={handleSeek}
            activeOpacity={0.7}
          >
            {renderWaveform()}
          </TouchableOpacity>
          
          <View style={styles.timeContainer}>
            <Text style={[
              styles.timeText,
              isOwnMessage ? styles.ownTimeText : styles.otherTimeText,
            ]}>
              {isLoaded ? getFormattedPosition() : '0:00'}
            </Text>
            <Text style={[
              styles.durationText,
              isOwnMessage ? styles.ownDurationText : styles.otherDurationText,
            ]}>
              / {isLoaded ? getFormattedDuration() : '0:00'}
            </Text>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.speedButton,
              isOwnMessage ? styles.ownSpeedButton : styles.otherSpeedButton,
            ]}
            onPress={handleSpeedToggle}
          >
            <Text style={[
              styles.speedText,
              isOwnMessage ? styles.ownSpeedText : styles.otherSpeedText,
            ]}>
              {getSpeedText()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    maxWidth: MAX_WAVEFORM_WIDTH,
    minWidth: 120,
  },
  ownMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#F2F2F7',
    alignSelf: 'flex-start',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ownPlayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  otherPlayButton: {
    backgroundColor: '#34C759',
  },
  contentContainer: {
    flex: 1,
  },
  waveformAndTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  waveformTouchable: {
    flex: 1,
    marginRight: 8,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 24,
  },
  waveformBar: {
    borderRadius: 1.5,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ownTimeText: {
    color: 'white',
  },
  otherTimeText: {
    color: '#000',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.7,
  },
  ownDurationText: {
    color: 'white',
  },
  otherDurationText: {
    color: '#000',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  speedButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ownSpeedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  otherSpeedButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  speedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ownSpeedText: {
    color: 'white',
  },
  otherSpeedText: {
    color: '#000',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFE5E5',
    borderRadius: 18,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF3B30',
  },
});
