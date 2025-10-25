import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { MediaService } from './mediaService';

export interface AudioFile {
  uri: string;
  duration: number;
  size: number;
  name: string;
}

export interface AudioPlaybackState {
  isLoaded: boolean;
  isPlaying: boolean;
  position: number;
  duration: number;
  speed: number;
}

class AudioService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private currentPlaybackState: AudioPlaybackState = {
    isLoaded: false,
    isPlaying: false,
    position: 0,
    duration: 0,
    speed: 1.0,
  };
  private playbackStateListeners: Set<(state: AudioPlaybackState) => void> = new Set();

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('AudioService.requestPermissions: Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Start audio recording
   */
  async startRecording(): Promise<void> {
    try {
      // Stop any existing recording
      if (this.recording) {
        await this.stopRecording();
      }

      // Stop any playing audio to avoid conflicts
      await this.stopAllAudio();

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      // Create and prepare recording
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      // Start recording
      await this.recording.startAsync();
      console.log('AudioService.startRecording: Recording started');
    } catch (error) {
      console.error('AudioService.startRecording: Error starting recording:', error);
      throw new Error('Failed to start recording. Please check microphone permissions.');
    }
  }

  /**
   * Stop audio recording and return file info
   */
  async stopRecording(): Promise<AudioFile | null> {
    try {
      if (!this.recording) {
        console.log('AudioService.stopRecording: No active recording');
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      if (!uri) {
        console.error('AudioService.stopRecording: No recording URI');
        return null;
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const duration = await this.getAudioDuration(uri);
      
      const audioFile: AudioFile = {
        uri,
        duration,
        size: (fileInfo as any).size || 0,
        name: `voice_${Date.now()}.m4a`,
      };

      console.log('AudioService.stopRecording: Recording stopped, duration:', duration);
      
      // Clean up
      this.recording = null;
      
      return audioFile;
    } catch (error) {
      console.error('AudioService.stopRecording: Error stopping recording:', error);
      throw new Error('Failed to stop recording');
    }
  }

  /**
   * Cancel recording and cleanup
   */
  async cancelRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();
        if (uri) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
        this.recording = null;
      }
    } catch (error) {
      console.error('AudioService.cancelRecording: Error canceling recording:', error);
    }
  }

  /**
   * Get audio duration from file
   */
  private async getAudioDuration(uri: string): Promise<number> {
    try {
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri });
      const status = await sound.getStatusAsync();
      const duration = status.isLoaded ? status.durationMillis || 0 : 0;
      await sound.unloadAsync();
      return Math.round(duration / 1000); // Convert to seconds
    } catch (error) {
      console.error('AudioService.getAudioDuration: Error getting duration:', error);
      return 0;
    }
  }

  /**
   * Upload audio file to S3
   */
  async uploadAudio(
    audioFile: AudioFile,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<string> {
    try {
      // Convert AudioFile to MediaFile format for upload
      const mediaFile = {
        uri: audioFile.uri,
        name: audioFile.name,
        type: 'audio/m4a',
        size: audioFile.size,
      };

      const audioUrl = await MediaService.uploadMedia(mediaFile, onProgress);
      console.log('AudioService.uploadAudio: Upload completed, URL:', audioUrl);
      
      return audioUrl;
    } catch (error) {
      console.error('AudioService.uploadAudio: Error uploading audio:', error);
      throw new Error('Failed to upload voice message');
    }
  }

  /**
   * Play audio with speed control
   */
  async playAudio(uri: string, speed: number = 1.0): Promise<void> {
    try {
      // Stop any currently playing audio
      await this.stopAllAudio();

      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      // Create and load sound
      this.sound = new Audio.Sound();
      await this.sound.loadAsync({ uri });
      
      // Set playback speed
      await this.sound.setRateAsync(speed, true);
      
      // Set up status update listener
      this.sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          const newState: AudioPlaybackState = {
            isLoaded: true,
            isPlaying: status.isPlaying || false,
            position: status.positionMillis || 0,
            duration: status.durationMillis || 0,
            speed: status.rate || 1.0,
          };
          
          this.currentPlaybackState = newState;
          this.notifyPlaybackStateListeners(newState);
          
          // Auto-cleanup when playback finishes
          if (status.didJustFinish) {
            this.stopAllAudio();
          }
        }
      });

      // Start playback
      await this.sound.playAsync();
      console.log('AudioService.playAudio: Playback started');
    } catch (error) {
      console.error('AudioService.playAudio: Error playing audio:', error);
      throw new Error('Failed to play audio');
    }
  }

  /**
   * Pause current playback
   */
  async pauseAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
        console.log('AudioService.pauseAudio: Playback paused');
      }
    } catch (error) {
      console.error('AudioService.pauseAudio: Error pausing audio:', error);
    }
  }

  /**
   * Resume current playback
   */
  async resumeAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.playAsync();
        console.log('AudioService.resumeAudio: Playback resumed');
      }
    } catch (error) {
      console.error('AudioService.resumeAudio: Error resuming audio:', error);
    }
  }

  /**
   * Stop all audio playback
   */
  async stopAllAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
        
        // Reset state
        this.currentPlaybackState = {
          isLoaded: false,
          isPlaying: false,
          position: 0,
          duration: 0,
          speed: 1.0,
        };
        this.notifyPlaybackStateListeners(this.currentPlaybackState);
        
        console.log('AudioService.stopAllAudio: All audio stopped');
      }
    } catch (error) {
      console.error('AudioService.stopAllAudio: Error stopping audio:', error);
    }
  }

  /**
   * Set playback speed
   */
  async setPlaybackSpeed(speed: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setRateAsync(speed, true);
        console.log('AudioService.setPlaybackSpeed: Speed set to', speed);
      }
    } catch (error) {
      console.error('AudioService.setPlaybackSpeed: Error setting speed:', error);
    }
  }

  /**
   * Seek to position in current audio
   */
  async seekTo(positionMillis: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setPositionAsync(positionMillis);
        console.log('AudioService.seekTo: Seeked to', positionMillis);
      }
    } catch (error) {
      console.error('AudioService.seekTo: Error seeking:', error);
    }
  }

  /**
   * Get current playback state
   */
  getCurrentPlaybackState(): AudioPlaybackState {
    return { ...this.currentPlaybackState };
  }

  /**
   * Add playback state listener
   */
  addPlaybackStateListener(listener: (state: AudioPlaybackState) => void): void {
    this.playbackStateListeners.add(listener);
  }

  /**
   * Remove playback state listener
   */
  removePlaybackStateListener(listener: (state: AudioPlaybackState) => void): void {
    this.playbackStateListeners.delete(listener);
  }

  /**
   * Notify all playback state listeners
   */
  private notifyPlaybackStateListeners(state: AudioPlaybackState): void {
    this.playbackStateListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('AudioService.notifyPlaybackStateListeners: Error in listener:', error);
      }
    });
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.cancelRecording();
      await this.stopAllAudio();
      this.playbackStateListeners.clear();
      console.log('AudioService.cleanup: All resources cleaned up');
    } catch (error) {
      console.error('AudioService.cleanup: Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const audioService = new AudioService();
