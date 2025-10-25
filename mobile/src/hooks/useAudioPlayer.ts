import { useState, useEffect, useCallback } from 'react';
import { audioService, AudioPlaybackState } from '../services/audioService';

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused';

export interface AudioPlayerState {
  playbackState: PlaybackState;
  position: number;
  duration: number;
  speed: number;
  isLoaded: boolean;
  error: string | null;
}

export interface AudioPlayerActions {
  play: (uri: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  toggleSpeed: () => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;
  reset: () => void;
}

const SPEED_OPTIONS = [1.0, 1.5, 2.0] as const;
type SpeedOption = typeof SPEED_OPTIONS[number];

export const useAudioPlayer = (): AudioPlayerState & AudioPlayerActions => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<SpeedOption>(1.0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUri, setCurrentUri] = useState<string | null>(null);

  // Handle playback state updates from audioService
  const handlePlaybackStateUpdate = useCallback((state: AudioPlaybackState) => {
    // Only update state if this component is managing the currently playing audio
    if (currentUri && state.currentUri === currentUri) {
      setIsLoaded(state.isLoaded);
      setPosition(state.position);
      setDuration(state.duration);
      setSpeed(state.speed as SpeedOption);
      
      if (state.isLoaded) {
        if (state.isPlaying) {
          setPlaybackState('playing');
        } else {
          setPlaybackState('paused');
        }
      } else {
        setPlaybackState('idle');
      }
    } else if (!state.currentUri) {
      // If no audio is playing, reset to idle
      setPlaybackState('idle');
      setPosition(0);
      setIsLoaded(false);
    }
  }, [currentUri]);

  // Add listener on mount, remove on unmount
  useEffect(() => {
    audioService.addPlaybackStateListener(handlePlaybackStateUpdate);
    
    return () => {
      audioService.removePlaybackStateListener(handlePlaybackStateUpdate);
      // Stop any playing audio when component unmounts
      audioService.stopAllAudio().catch(console.error);
    };
  }, [handlePlaybackStateUpdate]);

  // Play audio
  const play = useCallback(async (uri: string): Promise<void> => {
    try {
      setError(null);
      setCurrentUri(uri);
      
      if (playbackState === 'playing' && currentUri === uri) {
        // Same audio is already playing, just resume
        await audioService.resumeAudio();
        return;
      }
      
      setPlaybackState('loading');
      await audioService.playAudio(uri, speed);
      
      console.log('useAudioPlayer: Audio playback started');
    } catch (error) {
      console.error('useAudioPlayer: Error playing audio:', error);
      setError('Failed to play audio');
      setPlaybackState('idle');
    }
  }, [playbackState, currentUri, speed]);

  // Pause audio
  const pause = useCallback(async (): Promise<void> => {
    try {
      await audioService.pauseAudio();
      console.log('useAudioPlayer: Audio paused');
    } catch (error) {
      console.error('useAudioPlayer: Error pausing audio:', error);
      setError('Failed to pause audio');
    }
  }, []);

  // Resume audio
  const resume = useCallback(async (): Promise<void> => {
    try {
      await audioService.resumeAudio();
      console.log('useAudioPlayer: Audio resumed');
    } catch (error) {
      console.error('useAudioPlayer: Error resuming audio:', error);
      setError('Failed to resume audio');
    }
  }, []);

  // Stop audio
  const stop = useCallback(async (): Promise<void> => {
    try {
      await audioService.stopAllAudio();
      setCurrentUri(null);
      setPlaybackState('idle');
      setPosition(0);
      setDuration(0);
      setIsLoaded(false);
      console.log('useAudioPlayer: Audio stopped');
    } catch (error) {
      console.error('useAudioPlayer: Error stopping audio:', error);
      setError('Failed to stop audio');
    }
  }, []);

  // Toggle playback speed
  const toggleSpeed = useCallback(async (): Promise<void> => {
    try {
      const currentIndex = SPEED_OPTIONS.indexOf(speed);
      const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
      const newSpeed = SPEED_OPTIONS[nextIndex];
      
      setSpeed(newSpeed);
      await audioService.setPlaybackSpeed(newSpeed);
      
      console.log('useAudioPlayer: Speed changed to', newSpeed);
    } catch (error) {
      console.error('useAudioPlayer: Error changing speed:', error);
      setError('Failed to change playback speed');
    }
  }, [speed]);

  // Seek to position
  const seek = useCallback(async (positionMillis: number): Promise<void> => {
    try {
      await audioService.seekTo(positionMillis);
      console.log('useAudioPlayer: Seeked to', positionMillis);
    } catch (error) {
      console.error('useAudioPlayer: Error seeking:', error);
      setError('Failed to seek audio');
    }
  }, []);

  // Reset to initial state
  const reset = useCallback((): void => {
    setPlaybackState('idle');
    setPosition(0);
    setDuration(0);
    setSpeed(1.0);
    setIsLoaded(false);
    setError(null);
    setCurrentUri(null);
  }, []);

  return {
    // State
    playbackState,
    position,
    duration,
    speed,
    isLoaded,
    error,
    
    // Actions
    play,
    pause,
    resume,
    stop,
    toggleSpeed,
    seek,
    reset,
  };
};
