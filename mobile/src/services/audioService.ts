import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { MediaService, MediaFile, UploadProgress } from './mediaService';

export interface AudioRecording {
  uri: string;
  duration: number;
  size: number;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  position: number;
  duration: number;
  playbackSpeed: number;
}

export class AudioService {
  private static recording: Audio.Recording | null = null;
  private static sound: Audio.Sound | null = null;
  private static currentPlaybackState: AudioPlaybackState = {
    isPlaying: false,
    position: 0,
    duration: 0,
    playbackSpeed: 1.0,
  };

  // Recording configuration - using high quality preset
  private static readonly RECORDING_OPTIONS: Audio.RecordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;

  private static readonly MAX_RECORDING_DURATION = 300000; // 5 minutes in milliseconds

  /**
   * Request audio recording permissions
   */
  static async requestAudioPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('AudioService: Error requesting audio permissions:', error);
      return false;
    }
  }

  /**
   * Start audio recording
   */
  static async startRecording(): Promise<void> {
    try {
      // Check permissions
      const hasPermission = await this.requestAudioPermissions();
      if (!hasPermission) {
        throw new Error('Audio recording permission denied');
      }

      // Stop any existing recording
      if (this.recording) {
        await this.stopRecording();
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      // Create and start recording
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(this.RECORDING_OPTIONS);
      await this.recording.startAsync();

      console.log('AudioService: Recording started');
    } catch (error) {
      console.error('AudioService: Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Stop audio recording and return the recording data
   */
  static async stopRecording(): Promise<AudioRecording | null> {
    try {
      if (!this.recording) {
        console.warn('AudioService: No active recording to stop');
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();

      if (!uri || !status.canRecord) {
        throw new Error('Failed to get recording data');
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Recording file does not exist');
      }

      const recording: AudioRecording = {
        uri,
        duration: status.durationMillis || 0,
        size: fileInfo.size || 0,
      };

      // Clean up
      this.recording = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      console.log('AudioService: Recording stopped, duration:', recording.duration);
      return recording;
    } catch (error) {
      console.error('AudioService: Error stopping recording:', error);
      this.recording = null;
      throw error;
    }
  }

  /**
   * Cancel current recording and delete the file
   */
  static async cancelRecording(): Promise<void> {
    try {
      if (!this.recording) {
        return;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      if (uri) {
        // Delete the temporary file
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }

      this.recording = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      console.log('AudioService: Recording cancelled');
    } catch (error) {
      console.error('AudioService: Error cancelling recording:', error);
      this.recording = null;
    }
  }

  /**
   * Get current recording status
   */
  static async getRecordingStatus(): Promise<{ isRecording: boolean; duration: number }> {
    try {
      if (!this.recording) {
        return { isRecording: false, duration: 0 };
      }

      const status = await this.recording.getStatusAsync();
      return {
        isRecording: status.isRecording || false,
        duration: status.durationMillis || 0,
      };
    } catch (error) {
      console.error('AudioService: Error getting recording status:', error);
      return { isRecording: false, duration: 0 };
    }
  }

  /**
   * Upload audio recording to S3
   */
  static async uploadAudioRecording(
    recording: AudioRecording,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      // Create MediaFile from recording
      const mediaFile: MediaFile = {
        uri: recording.uri,
        name: `voice_note_${Date.now()}.m4a`,
        type: 'audio/m4a',
        size: recording.size,
      };

      // Upload using existing MediaService
      const mediaUrl = await MediaService.uploadMedia(mediaFile, onProgress);
      console.log('AudioService: Audio uploaded successfully:', mediaUrl);
      return mediaUrl;
    } catch (error) {
      console.error('AudioService: Error uploading audio:', error);
      throw error;
    }
  }

  /**
   * Load and prepare audio for playback
   */
  static async loadAudio(audioUrl: string): Promise<void> {
    try {
      // Unload existing sound
      if (this.sound) {
        await this.unloadAudio();
      }

      // Create new sound instance
      this.sound = new Audio.Sound();
      await this.sound.loadAsync({ uri: audioUrl });

      // Get duration
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        this.currentPlaybackState.duration = status.durationMillis || 0;
      }

      console.log('AudioService: Audio loaded for playback');
    } catch (error) {
      console.error('AudioService: Error loading audio:', error);
      throw error;
    }
  }

  /**
   * Play loaded audio
   */
  static async playAudio(): Promise<void> {
    try {
      if (!this.sound) {
        throw new Error('No audio loaded');
      }

      await this.sound.playAsync();
      this.currentPlaybackState.isPlaying = true;

      // Set up position update listener
      this.sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          this.currentPlaybackState.position = status.positionMillis || 0;
          this.currentPlaybackState.isPlaying = status.isPlaying || false;
        }
      });

      console.log('AudioService: Audio playback started');
    } catch (error) {
      console.error('AudioService: Error playing audio:', error);
      throw error;
    }
  }

  /**
   * Pause audio playback
   */
  static async pauseAudio(): Promise<void> {
    try {
      if (!this.sound) {
        return;
      }

      await this.sound.pauseAsync();
      this.currentPlaybackState.isPlaying = false;
      console.log('AudioService: Audio playback paused');
    } catch (error) {
      console.error('AudioService: Error pausing audio:', error);
    }
  }

  /**
   * Stop audio playback and reset position
   */
  static async stopAudio(): Promise<void> {
    try {
      if (!this.sound) {
        return;
      }

      await this.sound.stopAsync();
      this.currentPlaybackState.isPlaying = false;
      this.currentPlaybackState.position = 0;
      console.log('AudioService: Audio playback stopped');
    } catch (error) {
      console.error('AudioService: Error stopping audio:', error);
    }
  }

  /**
   * Set playback speed (1.0, 1.5, 2.0)
   */
  static async setPlaybackSpeed(speed: number): Promise<void> {
    try {
      if (!this.sound) {
        return;
      }

      await this.sound.setRateAsync(speed, true);
      this.currentPlaybackState.playbackSpeed = speed;
      console.log('AudioService: Playback speed set to:', speed);
    } catch (error) {
      console.error('AudioService: Error setting playback speed:', error);
    }
  }

  /**
   * Seek to specific position in milliseconds
   */
  static async seekTo(position: number): Promise<void> {
    try {
      if (!this.sound) {
        return;
      }

      await this.sound.setPositionAsync(position);
      this.currentPlaybackState.position = position;
      console.log('AudioService: Seeked to position:', position);
    } catch (error) {
      console.error('AudioService: Error seeking audio:', error);
    }
  }

  /**
   * Get current playback state
   */
  static getPlaybackState(): AudioPlaybackState {
    return { ...this.currentPlaybackState };
  }

  /**
   * Unload current audio
   */
  static async unloadAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
        this.currentPlaybackState = {
          isPlaying: false,
          position: 0,
          duration: 0,
          playbackSpeed: 1.0,
        };
        console.log('AudioService: Audio unloaded');
      }
    } catch (error) {
      console.error('AudioService: Error unloading audio:', error);
    }
  }

  /**
   * Clean up all audio resources
   */
  static async cleanup(): Promise<void> {
    try {
      await this.cancelRecording();
      await this.unloadAudio();
      console.log('AudioService: Cleanup completed');
    } catch (error) {
      console.error('AudioService: Error during cleanup:', error);
    }
  }

  /**
   * Format duration in milliseconds to MM:SS format
   */
  static formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Check if recording duration exceeds maximum allowed
   */
  static isRecordingTooLong(duration: number): boolean {
    return duration > this.MAX_RECORDING_DURATION;
  }
}
