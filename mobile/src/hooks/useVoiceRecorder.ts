import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioService, AudioRecording } from '../services/audioService';
import { UploadProgress } from '../services/mediaService';

export interface VoiceRecorderState {
  isRecording: boolean;
  isUploading: boolean;
  duration: number;
  uploadProgress: UploadProgress | null;
  error: string | null;
}

export interface VoiceRecorderCallbacks {
  onRecordingComplete?: (mediaUrl: string) => void;
  onRecordingCancelled?: () => void;
  onError?: (error: string) => void;
}

export const useVoiceRecorder = (callbacks: VoiceRecorderCallbacks = {}) => {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    isUploading: false,
    duration: 0,
    uploadProgress: null,
    error: null,
  });

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<AudioRecording | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      // Cancel any ongoing recording
      if (state.isRecording) {
        AudioService.cancelRecording();
      }
    };
  }, [state.isRecording]);

  // Start duration tracking
  const startDurationTracking = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    durationIntervalRef.current = setInterval(async () => {
      try {
        const status = await AudioService.getRecordingStatus();
        setState(prev => ({
          ...prev,
          duration: status.duration,
        }));

        // Check if recording is too long
        if (AudioService.isRecordingTooLong(status.duration)) {
          await stopRecording();
        }
      } catch (error) {
        console.error('useVoiceRecorder: Error getting recording status:', error);
      }
    }, 100); // Update every 100ms for smooth UI
  }, []);

  // Stop duration tracking
  const stopDurationTracking = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        isRecording: true,
        duration: 0,
        error: null,
        uploadProgress: null,
      }));

      await AudioService.startRecording();
      startDurationTracking();
      console.log('useVoiceRecorder: Recording started');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setState(prev => ({
        ...prev,
        isRecording: false,
        error: errorMessage,
      }));
      callbacks.onError?.(errorMessage);
      console.error('useVoiceRecorder: Error starting recording:', error);
    }
  }, [callbacks, startDurationTracking]);

  // Stop recording and upload
  const stopRecording = useCallback(async () => {
    try {
      stopDurationTracking();
      
      setState(prev => ({
        ...prev,
        isRecording: false,
        isUploading: true,
      }));

      const recording = await AudioService.stopRecording();
      
      if (!recording) {
        throw new Error('No recording data available');
      }

      // Check minimum duration (0.5 seconds)
      if (recording.duration < 500) {
        throw new Error('Recording too short');
      }

      recordingRef.current = recording;

      // Upload the recording
      const mediaUrl = await AudioService.uploadAudioRecording(
        recording,
        (progress) => {
          setState(prev => ({
            ...prev,
            uploadProgress: progress,
          }));
        }
      );

      setState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: null,
        duration: 0,
      }));

      callbacks.onRecordingComplete?.(mediaUrl);
      console.log('useVoiceRecorder: Recording completed and uploaded');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording';
      setState(prev => ({
        ...prev,
        isRecording: false,
        isUploading: false,
        uploadProgress: null,
        error: errorMessage,
      }));
      callbacks.onError?.(errorMessage);
      console.error('useVoiceRecorder: Error stopping recording:', error);
    }
  }, [callbacks, stopDurationTracking]);

  // Cancel recording
  const cancelRecording = useCallback(async () => {
    try {
      stopDurationTracking();
      
      setState(prev => ({
        ...prev,
        isRecording: false,
        isUploading: false,
        duration: 0,
        uploadProgress: null,
        error: null,
      }));

      await AudioService.cancelRecording();
      recordingRef.current = null;
      callbacks.onRecordingCancelled?.();
      console.log('useVoiceRecorder: Recording cancelled');
    } catch (error) {
      console.error('useVoiceRecorder: Error cancelling recording:', error);
    }
  }, [callbacks, stopDurationTracking]);

  // Reset state
  const resetState = useCallback(() => {
    stopDurationTracking();
    setState({
      isRecording: false,
      isUploading: false,
      duration: 0,
      uploadProgress: null,
      error: null,
    });
    recordingRef.current = null;
  }, [stopDurationTracking]);

  // Get formatted duration
  const getFormattedDuration = useCallback(() => {
    return AudioService.formatDuration(state.duration);
  }, [state.duration]);

  // Check if recording is active
  const isRecordingActive = useCallback(() => {
    return state.isRecording || state.isUploading;
  }, [state.isRecording, state.isUploading]);

  return {
    // State
    ...state,
    
    // Actions
    startRecording,
    stopRecording,
    cancelRecording,
    resetState,
    
    // Utilities
    getFormattedDuration,
    isRecordingActive,
  };
};
