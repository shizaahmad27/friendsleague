import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { audioService, AudioFile } from '../services/audioService';

export type RecordingState = 'idle' | 'recording' | 'stopped' | 'uploading';

export interface VoiceRecorderState {
  recordingState: RecordingState;
  duration: number;
  audioFile: AudioFile | null;
  uploadProgress: number;
  error: string | null;
}

export interface VoiceRecorderActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  uploadRecording: () => Promise<string>;
  cancelRecording: () => Promise<void>;
  reset: () => void;
}

const MAX_DURATION_SECONDS = 120; // 2 minutes
const DURATION_UPDATE_INTERVAL = 100; // Update every 100ms

export const useVoiceRecorder = (): VoiceRecorderState & VoiceRecorderActions => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      // Cancel any ongoing recording
      audioService.cancelRecording().catch(console.error);
    };
  }, []); // Empty dependency array to avoid stale closures

  // Start duration tracking
  const startDurationTracking = useCallback(() => {
    startTimeRef.current = Date.now();
    setDuration(0);
    
    durationIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setDuration(elapsed);
      
      // Auto-stop at max duration
      if (elapsed >= MAX_DURATION_SECONDS) {
        stopRecording();
      }
    }, DURATION_UPDATE_INTERVAL);
  }, []);

  // Stop duration tracking
  const stopDurationTracking = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      // Prevent multiple simultaneous recordings
      if (recordingState !== 'idle') {
        console.warn('useVoiceRecorder: Attempted to start recording while not idle');
        return;
      }
      
      // Check permissions
      const hasPermission = await audioService.requestPermissions();
      if (!hasPermission) {
        setError('Microphone permission is required to record voice messages');
        Alert.alert(
          'Permission Required',
          'Please allow microphone access to record voice messages.',
          [{ text: 'OK' }]
        );
        return;
      }

      setRecordingState('recording');
      await audioService.startRecording();
      startDurationTracking();
      
      console.log('useVoiceRecorder: Recording started');
    } catch (error) {
      console.error('useVoiceRecorder: Error starting recording:', error);
      setError('Failed to start recording');
      setRecordingState('idle');
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  }, [startDurationTracking, recordingState]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<void> => {
    try {
      stopDurationTracking();
      setRecordingState('stopped');
      
      const file = await audioService.stopRecording();
      setAudioFile(file);
      
      console.log('useVoiceRecorder: Recording stopped, duration:', duration);
    } catch (error) {
      console.error('useVoiceRecorder: Error stopping recording:', error);
      setError('Failed to stop recording');
      setRecordingState('idle');
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
    }
  }, [duration, stopDurationTracking]);

  // Upload recording
  const uploadRecording = useCallback(async (): Promise<string> => {
    if (!audioFile) {
      throw new Error('No audio file to upload');
    }

    try {
      setRecordingState('uploading');
      setUploadProgress(0);
      setError(null);

      const audioUrl = await audioService.uploadAudio(audioFile, (progress) => {
        setUploadProgress(progress.percentage);
      });

      console.log('useVoiceRecorder: Upload completed, URL:', audioUrl);
      return audioUrl;
    } catch (error) {
      console.error('useVoiceRecorder: Error uploading recording:', error);
      setError('Failed to upload voice message');
      setRecordingState('stopped');
      throw error;
    }
  }, [audioFile]);

  // Cancel recording
  const cancelRecording = useCallback(async (): Promise<void> => {
    try {
      stopDurationTracking();
      await audioService.cancelRecording();
      
      setRecordingState('idle');
      setDuration(0);
      setAudioFile(null);
      setUploadProgress(0);
      setError(null);
      
      console.log('useVoiceRecorder: Recording cancelled');
    } catch (error) {
      console.error('useVoiceRecorder: Error cancelling recording:', error);
    }
  }, [stopDurationTracking]);

  // Reset to initial state
  const reset = useCallback((): void => {
    stopDurationTracking();
    setRecordingState('idle');
    setDuration(0);
    setAudioFile(null);
    setUploadProgress(0);
    setError(null);
  }, [stopDurationTracking]);

  return {
    // State
    recordingState,
    duration,
    audioFile,
    uploadProgress,
    error,
    
    // Actions
    startRecording,
    stopRecording,
    uploadRecording,
    cancelRecording,
    reset,
  };
};
