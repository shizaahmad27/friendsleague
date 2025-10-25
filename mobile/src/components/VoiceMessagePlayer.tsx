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
import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration?: number;
  isOwnMessage?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const WAVEFORM_BARS = 12;
const MAX_BAR_HEIGHT = 30;
const MIN_BAR_HEIGHT = 4;

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  audioUrl,
  duration = 0,
  isOwnMessage = false,
}) => {
  const {
    playbackState,
    position,
    duration: playbackDuration,
    speed,
    isLoaded,
    error,
    play,
    pause,
    resume,
    stop,
    toggleSpeed,
    seek,
  } = useAudioPlayer();

  // Animation values
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const playButtonAnimation = useRef(new Animated.Value(1)).current;

  // Update progress animation
  useEffect(() => {
    if (isLoaded && playbackDuration > 0) {
      const progress = position / playbackDuration;
      Animated.timing(progressAnimation, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [position, playbackDuration, isLoaded, progressAnimation]);

  // Animate play button
  useEffect(() => {
    if (playbackState === 'playing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(playButtonAnimation, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(playButtonAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      playButtonAnimation.setValue(1);
    }
  }, [playbackState, playButtonAnimation]);

  // Format time as MM:SS
  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const handlePlayPause = async (): Promise<void> => {
    try {
      if (playbackState === 'playing') {
        await pause();
      } else if (playbackState === 'paused') {
        await resume();
      } else {
        await play(audioUrl);
      }
    } catch (error) {
      console.error('VoiceMessagePlayer: Error toggling playback:', error);
    }
  };

  // Handle speed toggle
  const handleSpeedToggle = async (): Promise<void> => {
    try {
      await toggleSpeed();
    } catch (error) {
      console.error('VoiceMessagePlayer: Error toggling speed:', error);
    }
  };

  // Handle seek
  const handleSeek = async (progress: number): Promise<void> => {
    try {
      // Validate progress value
      const clampedProgress = Math.max(0, Math.min(1, progress));
      const seekPosition = clampedProgress * playbackDuration;
      await seek(seekPosition);
    } catch (error) {
      console.error('VoiceMessagePlayer: Error seeking:', error);
    }
  };

  // Generate static waveform bars based on duration
  const generateWaveformBars = (): number[] => {
    const bars: number[] = [];
    for (let i = 0; i < WAVEFORM_BARS; i++) {
      // Create a simple pattern based on duration and position
      const baseHeight = MIN_BAR_HEIGHT + (Math.sin(i * 0.5) * 0.5 + 0.5) * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT);
      bars.push(baseHeight);
    }
    return bars;
  };

  // Render waveform
  const renderWaveform = (): React.ReactNode => {
    const bars = generateWaveformBars();
    const progress = isLoaded && playbackDuration > 0 ? position / playbackDuration : 0;
    const activeBars = Math.floor(progress * WAVEFORM_BARS);

    return (
      <View style={styles.waveformContainer}>
        {bars.map((height, index) => {
          const isActive = index < activeBars;
          const isCurrent = index === activeBars;
          
          return (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height,
                  backgroundColor: isActive 
                    ? (isOwnMessage ? '#007AFF' : '#34C759')
                    : isCurrent 
                    ? (isOwnMessage ? '#007AFF' : '#34C759')
                    : '#E5E5EA',
                  opacity: isActive ? 1 : isCurrent ? 0.7 : 0.3,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  // Render play/pause button
  const renderPlayButton = (): React.ReactNode => {
    if (playbackState === 'loading') {
      return (
        <View style={styles.playButton}>
          <ActivityIndicator size="small" color={isOwnMessage ? 'white' : '#007AFF'} />
        </View>
      );
    }

    const iconName = playbackState === 'playing' ? 'pause' : 'play';
    
    return (
      <Animated.View style={{ transform: [{ scale: playButtonAnimation }] }}>
        <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
          <Ionicons 
            name={iconName} 
            size={20} 
            color={isOwnMessage ? 'white' : '#007AFF'} 
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render speed button
  const renderSpeedButton = (): React.ReactNode => {
    return (
      <TouchableOpacity style={styles.speedButton} onPress={handleSpeedToggle}>
        <Text style={[styles.speedText, { color: isOwnMessage ? 'white' : '#007AFF' }]}>
          {speed}x
        </Text>
      </TouchableOpacity>
    );
  };

  // Render time display
  const renderTimeDisplay = (): React.ReactNode => {
    const currentTime = isLoaded ? position : 0;
    const totalTime = isLoaded ? playbackDuration : (duration * 1000);
    
    return (
      <Text style={[styles.timeText, { color: isOwnMessage ? 'white' : '#666' }]}>
        {formatTime(currentTime)} / {formatTime(totalTime)}
      </Text>
    );
  };

  // Render progress slider
  const renderProgressSlider = (): React.ReactNode => {
    if (!isLoaded || playbackDuration <= 0) {
      return <View style={styles.progressTrack} />;
    }

    const progress = position / playbackDuration;
    
    return (
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
              backgroundColor: isOwnMessage ? 'white' : '#007AFF',
            },
          ]}
        />
        <TouchableOpacity
          style={styles.progressThumb}
          onPress={() => handleSeek(progress)}
        />
      </View>
    );
  };

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      <View style={styles.content}>
        {renderPlayButton()}
        {renderWaveform()}
        <View style={styles.controls}>
          {renderTimeDisplay()}
          {renderProgressSlider()}
        </View>
        {renderSpeedButton()}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: isOwnMessage ? '#FFB3B3' : '#FF3B30' }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: screenWidth * 0.7,
    minWidth: 200,
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    height: MAX_BAR_HEIGHT,
  },
  waveformBar: {
    width: 2,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  controls: {
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  progressTrack: {
    height: 2,
    backgroundColor: '#E5E5EA',
    borderRadius: 1,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    left: '50%',
    marginLeft: -5,
  },
  speedButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  speedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
