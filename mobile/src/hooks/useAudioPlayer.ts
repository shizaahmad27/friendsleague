import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioService, AudioPlaybackState } from '../services/audioService';

export interface AudioPlayerState {
  isPlaying: boolean;
  position: number;
  duration: number;
  playbackSpeed: number;
  isLoading: boolean;
  error: string | null;
}

export interface AudioPlayerCallbacks {
  onPlaybackComplete?: () => void;
  onError?: (error: string) => void;
}

export const useAudioPlayer = (callbacks: AudioPlayerCallbacks = {}) => {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    position: 0,
    duration: 0,
    playbackSpeed: 1.0,
    isLoading: false,
    error: null,
  });

  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
      AudioService.unloadAudio();
    };
  }, []);

  // Start position tracking
  const startPositionTracking = useCallback(() => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
    }

    positionIntervalRef.current = setInterval(() => {
      const playbackState = AudioService.getPlaybackState();
      setState(prev => ({
        ...prev,
        isPlaying: playbackState.isPlaying,
        position: playbackState.position,
        duration: playbackState.duration,
        playbackSpeed: playbackState.playbackSpeed,
      }));

      // Check if playback is complete
      if (playbackState.position >= playbackState.duration && playbackState.duration > 0) {
        stopPositionTracking();
        setState(prev => ({
          ...prev,
          isPlaying: false,
          position: 0,
        }));
        callbacks.onPlaybackComplete?.();
      }
    }, 100); // Update every 100ms for smooth UI
  }, [callbacks]);

  // Stop position tracking
  const stopPositionTracking = useCallback(() => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
      positionIntervalRef.current = null;
    }
  }, []);

  // Load audio for playback
  const loadAudio = useCallback(async (audioUrl: string) => {
    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      // If loading the same audio, just return
      if (currentAudioUrlRef.current === audioUrl && state.duration > 0) {
        setState(prev => ({
          ...prev,
          isLoading: false,
        }));
        return;
      }

      await AudioService.loadAudio(audioUrl);
      currentAudioUrlRef.current = audioUrl;

      // Get initial state
      const playbackState = AudioService.getPlaybackState();
      setState(prev => ({
        ...prev,
        isLoading: false,
        duration: playbackState.duration,
        position: 0,
        playbackSpeed: playbackState.playbackSpeed,
      }));

      console.log('useAudioPlayer: Audio loaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audio';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      callbacks.onError?.(errorMessage);
      console.error('useAudioPlayer: Error loading audio:', error);
    }
  }, [callbacks, state.duration]);

  // Play audio
  const playAudio = useCallback(async (audioUrl?: string) => {
    try {
      setState(prev => ({
        ...prev,
        error: null,
      }));

      // Load audio if URL provided and different from current
      if (audioUrl && audioUrl !== currentAudioUrlRef.current) {
        await loadAudio(audioUrl);
      }

      await AudioService.playAudio();
      startPositionTracking();
      console.log('useAudioPlayer: Audio playback started');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play audio';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      callbacks.onError?.(errorMessage);
      console.error('useAudioPlayer: Error playing audio:', error);
    }
  }, [callbacks, loadAudio, startPositionTracking]);

  // Pause audio
  const pauseAudio = useCallback(async () => {
    try {
      await AudioService.pauseAudio();
      stopPositionTracking();
      console.log('useAudioPlayer: Audio playback paused');
    } catch (error) {
      console.error('useAudioPlayer: Error pausing audio:', error);
    }
  }, [stopPositionTracking]);

  // Stop audio
  const stopAudio = useCallback(async () => {
    try {
      await AudioService.stopAudio();
      stopPositionTracking();
      setState(prev => ({
        ...prev,
        position: 0,
      }));
      console.log('useAudioPlayer: Audio playback stopped');
    } catch (error) {
      console.error('useAudioPlayer: Error stopping audio:', error);
    }
  }, [stopPositionTracking]);

  // Toggle play/pause
  const togglePlayPause = useCallback(async (audioUrl?: string) => {
    if (state.isPlaying) {
      await pauseAudio();
    } else {
      await playAudio(audioUrl);
    }
  }, [state.isPlaying, playAudio, pauseAudio]);

  // Set playback speed
  const setPlaybackSpeed = useCallback(async (speed: number) => {
    try {
      await AudioService.setPlaybackSpeed(speed);
      setState(prev => ({
        ...prev,
        playbackSpeed: speed,
      }));
      console.log('useAudioPlayer: Playback speed set to:', speed);
    } catch (error) {
      console.error('useAudioPlayer: Error setting playback speed:', error);
    }
  }, []);

  // Cycle through playback speeds (1x -> 1.5x -> 2x -> 1x)
  const cyclePlaybackSpeed = useCallback(async () => {
    const speeds = [1.0, 1.5, 2.0];
    const currentIndex = speeds.indexOf(state.playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    await setPlaybackSpeed(speeds[nextIndex]);
  }, [state.playbackSpeed, setPlaybackSpeed]);

  // Seek to position
  const seekTo = useCallback(async (position: number) => {
    try {
      await AudioService.seekTo(position);
      setState(prev => ({
        ...prev,
        position,
      }));
      console.log('useAudioPlayer: Seeked to position:', position);
    } catch (error) {
      console.error('useAudioPlayer: Error seeking audio:', error);
    }
  }, []);

  // Get formatted duration
  const getFormattedDuration = useCallback(() => {
    return AudioService.formatDuration(state.duration);
  }, [state.duration]);

  // Get formatted position
  const getFormattedPosition = useCallback(() => {
    return AudioService.formatDuration(state.position);
  }, [state.position]);

  // Get progress percentage (0-100)
  const getProgressPercentage = useCallback(() => {
    if (state.duration === 0) return 0;
    return (state.position / state.duration) * 100;
  }, [state.position, state.duration]);

  // Check if audio is loaded
  const isAudioLoaded = useCallback(() => {
    return state.duration > 0;
  }, [state.duration]);

  // Reset state
  const resetState = useCallback(() => {
    stopPositionTracking();
    setState({
      isPlaying: false,
      position: 0,
      duration: 0,
      playbackSpeed: 1.0,
      isLoading: false,
      error: null,
    });
    currentAudioUrlRef.current = null;
  }, [stopPositionTracking]);

  return {
    // State
    ...state,
    
    // Actions
    loadAudio,
    playAudio,
    pauseAudio,
    stopAudio,
    togglePlayPause,
    setPlaybackSpeed,
    cyclePlaybackSpeed,
    seekTo,
    resetState,
    
    // Utilities
    getFormattedDuration,
    getFormattedPosition,
    getProgressPercentage,
    isAudioLoaded,
  };
};
