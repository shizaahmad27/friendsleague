import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MediaService, MediaFile } from '../services/mediaService';

export interface QuickCameraCallbacks {
  onMediaSelected: (mediaUrl: string, type: 'IMAGE' | 'VIDEO', localUri?: string, isEphemeral?: boolean, ephemeralViewDuration?: number | null) => void;
  onUploadProgress?: (progress: any) => void;
  onPreviewSelected?: (localUri: string, type: 'IMAGE' | 'VIDEO') => void;
}

export interface QuickCameraState {
  isCapturing: boolean;
  uploadProgress: any | null;
  showEphemeralPreview: boolean;
  capturedMedia: {
    uri: string;
    type: 'IMAGE' | 'VIDEO';
  } | null;
}

export const useQuickCamera = (callbacks: QuickCameraCallbacks) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<any | null>(null);
  const [showEphemeralPreview, setShowEphemeralPreview] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{ uri: string; type: 'IMAGE' | 'VIDEO' } | null>(null);

  /**
   * Launch camera with support for both photos and videos
   */
  const launchCamera = async (): Promise<void> => {
    console.log('useQuickCamera: Starting camera launch...');
    
    // Reset any previous state
    setIsCapturing(false);
    setUploadProgress(null);
    
    try {
      // Request camera permissions
      console.log('useQuickCamera: Requesting camera permissions...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        console.error('useQuickCamera: Camera permission denied');
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to take photos and videos.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('useQuickCamera: Camera permission granted, launching camera...');
      
      // Launch camera with support for both images and videos
      const result = await Promise.race([
        ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All, // Support both images and videos
          allowsEditing: false, // Don't force cropping
          quality: 1, // Maximum quality
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Camera launch timeout after 30 seconds')), 30000)
        )
      ]) as ImagePicker.ImagePickerResult;
      
      if (result.canceled || !result.assets[0]) {
        console.log('useQuickCamera: User canceled camera or no assets');
        return;
      }

      const asset = result.assets[0];
      console.log('useQuickCamera: Camera capture completed, asset:', asset);

      // Determine media type based on asset properties
      let mediaType: 'IMAGE' | 'VIDEO';

      // Check if it's a video by looking at duration or type
      if (asset.type === 'video' || asset.duration !== undefined) {
        mediaType = 'VIDEO';
      } else {
        mediaType = 'IMAGE';
      }

      console.log('useQuickCamera: Detected media type:', mediaType);

      // Store captured media and show ephemeral preview modal
      setCapturedMedia({
        uri: asset.uri,
        type: mediaType,
      });
      setShowEphemeralPreview(true);

    } catch (error) {
      console.error('useQuickCamera: Camera error:', error);
      console.error('useQuickCamera: Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Camera Error', `Failed to capture media: ${errorMessage}. Please try again.`);
    }
  };

  /**
   * Send ephemeral media with selected timer
   */
  const sendEphemeralMedia = async (viewDuration: number | null): Promise<void> => {
    if (!capturedMedia) {
      console.error('useQuickCamera: No captured media to send');
      return;
    }

    console.log('useQuickCamera: Sending ephemeral media with duration:', viewDuration);
    
    try {
      // Create MediaFile object
      const mediaFile: MediaFile = {
        uri: capturedMedia.uri,
        name: capturedMedia.type === 'VIDEO' ? `video_${Date.now()}.mp4` : `photo_${Date.now()}.jpg`,
        type: capturedMedia.type === 'VIDEO' ? 'video/mp4' : 'image/jpeg',
        size: 0, // Will be set during upload
      };

      // Emit local preview first
      try {
        callbacks.onPreviewSelected?.(mediaFile.uri, capturedMedia.type);
      } catch (error) {
        console.warn('useQuickCamera: Error calling onPreviewSelected:', error);
      }

      // Start uploading in background
      console.log('useQuickCamera: Starting upload process...');
      setIsCapturing(false);
      setUploadProgress(null);

      // Add a timeout to prevent infinite uploading state
      const uploadTimeout = setTimeout(() => {
        console.log('useQuickCamera: Upload timeout, resetting state');
        setIsCapturing(false);
        setUploadProgress(null);
        Alert.alert('Upload Timeout', 'Upload is taking too long. Please check your internet connection and try again.');
      }, 120000); // 2 minutes

      try {
        // Upload the media
        console.log('useQuickCamera: Starting upload process...');
        const mediaUrl = await MediaService.uploadMedia(mediaFile, (progress) => {
          console.log('useQuickCamera: Upload progress:', progress.percentage + '%');
          setUploadProgress(progress);
          callbacks.onUploadProgress?.(progress);
        });

        clearTimeout(uploadTimeout);
        console.log('useQuickCamera: Upload completed, mediaUrl:', mediaUrl);
        
        // Send as ephemeral message
        callbacks.onMediaSelected(mediaUrl, capturedMedia.type, mediaFile.uri, true, viewDuration);
        
        // Close preview modal
        setShowEphemeralPreview(false);
        setCapturedMedia(null);
        
      } catch (uploadError) {
        clearTimeout(uploadTimeout);
        throw uploadError;
      }
    } catch (error) {
      console.error('useQuickCamera: Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Upload Error', `Failed to upload media: ${errorMessage}. Please try again.`);
    } finally {
      console.log('useQuickCamera: Upload finished or failed');
      setIsCapturing(false);
      setUploadProgress(null);
    }
  };

  /**
   * Cancel ephemeral preview
   */
  const cancelEphemeralPreview = () => {
    setShowEphemeralPreview(false);
    setCapturedMedia(null);
  };

  // Reset function to clear any stuck state
  const resetState = () => {
    console.log('useQuickCamera: Resetting state');
    setIsCapturing(false);
    setUploadProgress(null);
    setShowEphemeralPreview(false);
    setCapturedMedia(null);
  };

  return {
    // State
    isCapturing,
    uploadProgress,
    showEphemeralPreview,
    capturedMedia,
    
    // Actions
    launchCamera,
    sendEphemeralMedia,
    cancelEphemeralPreview,
    resetState,
  };
};
