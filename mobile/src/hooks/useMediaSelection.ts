import { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { MediaService, MediaFile, UploadProgress } from '../services/mediaService';

export interface MediaSelectionCallbacks {
  onMediaSelected: (mediaUrl: string, type: 'IMAGE' | 'VIDEO' | 'FILE', localUri?: string) => void;
  onUploadProgress?: (progress: UploadProgress) => void;
  onPreviewSelected?: (localUri: string, type: 'IMAGE' | 'VIDEO' | 'FILE') => void;
}

export interface MediaSelectionState {
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
}

export const useMediaSelection = (callbacks: MediaSelectionCallbacks) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // Auto-reset stuck uploading state after 60 seconds
  useEffect(() => {
    if (isUploading) {
      const resetTimeout = setTimeout(() => {
        console.log('useMediaSelection: Auto-resetting stuck uploading state');
        setIsUploading(false);
        setUploadProgress(null);
      }, 60000); // 60 seconds

      return () => clearTimeout(resetTimeout);
    }
  }, [isUploading]);

  const handleMediaSelection = async (
    pickerFunction: () => Promise<MediaFile | null>, 
    type: 'IMAGE' | 'VIDEO' | 'FILE'
  ) => {
    console.log('useMediaSelection: Starting media selection for type:', type);
    
    // Reset any previous state first
    setIsUploading(false);
    setUploadProgress(null);
    
    try {
      console.log('useMediaSelection: Calling picker function...');
      
      // Only set uploading to true after we actually get a file
      const mediaFile = await pickerFunction();
      console.log('useMediaSelection: Picker function completed, mediaFile:', mediaFile);
      
      if (!mediaFile) {
        // User cancelled or no file selected
        console.log('useMediaSelection: No file selected, returning');
        return;
      }

      // Now we have a file, first emit local preview
      try {
        callbacks.onPreviewSelected?.(mediaFile.uri, type);
      } catch (error) {
        console.warn('useMediaSelection: Error calling onPreviewSelected:', error);
      }

      // Start uploading in background (do NOT show uploading UI)
      console.log('useMediaSelection: File selected, starting upload...');
      setIsUploading(false);
      setUploadProgress(null);

      // Add a timeout to prevent infinite uploading state
      const uploadTimeout = setTimeout(() => {
        console.log('useMediaSelection: Upload timeout, resetting state');
        setIsUploading(false);
        setUploadProgress(null);
        Alert.alert('Upload Timeout', 'Upload is taking too long. Please check your internet connection and try again.');
      }, 120000); 

      try {
        // Upload the media
        console.log('useMediaSelection: Starting upload process...');
        const mediaUrl = await MediaService.uploadMedia(mediaFile, (progress) => {
          console.log('useMediaSelection: Upload progress:', progress.percentage + '%');
          setUploadProgress(progress);
          callbacks.onUploadProgress?.(progress);
        });

        clearTimeout(uploadTimeout);
        console.log('useMediaSelection: Upload completed, mediaUrl:', mediaUrl);
        callbacks.onMediaSelected(mediaUrl, type, mediaFile.uri);
      } catch (uploadError) {
        clearTimeout(uploadTimeout);
        throw uploadError;
      }
    } catch (error) {
      console.error('useMediaSelection: Media upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Upload Error', `Failed to upload media: ${errorMessage}. Please try again.`);
    } finally {
      console.log('useMediaSelection: Background upload finished or failed');
      setUploadProgress(null);
    }
  };

  // Reset function to clear any stuck state
  const resetState = () => {
    console.log('useMediaSelection: Resetting state');
    setIsUploading(false);
    setUploadProgress(null);
  };

  // Individual media selection functions
  const selectFromCamera = () => handleMediaSelection(MediaService.takePhoto, 'IMAGE');
  const selectFromPhotos = () => handleMediaSelection(MediaService.pickImage, 'IMAGE');
  const selectVideo = () => handleMediaSelection(MediaService.pickVideo, 'VIDEO');
  const selectDocument = () => handleMediaSelection(MediaService.pickDocument, 'FILE');

  return {
    // State
    isUploading,
    uploadProgress,
    
    // Actions
    selectFromCamera,
    selectFromPhotos,
    selectVideo,
    selectDocument,
    resetState,
  };
};
