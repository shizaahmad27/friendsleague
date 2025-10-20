import { MediaService, MediaFile } from './mediaService';

export interface MediaPickerCallbacks {
  onMediaSelected: (mediaUrl: string, type: 'IMAGE' | 'VIDEO' | 'FILE', localUri?: string) => void;
  onUploadProgress?: (progress: any) => void;
  onPreviewSelected?: (localUri: string, type: 'IMAGE' | 'VIDEO' | 'FILE') => void;
}

class MediaPickerService {
  private callbacks: MediaPickerCallbacks | null = null;

  setCallbacks(callbacks: MediaPickerCallbacks) {
    this.callbacks = callbacks;
  }

  clearCallbacks() {
    this.callbacks = null;
  }

  private async handleMediaSelection(
    pickerFunction: () => Promise<MediaFile | null>, 
    type: 'IMAGE' | 'VIDEO' | 'FILE'
  ) {
    if (!this.callbacks) {
      console.error('MediaPickerService: No callbacks set');
      return;
    }

    console.log('MediaPickerService: Starting media selection for type:', type);
    
    try {
      // Wait a bit to ensure any modals are closed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('MediaPickerService: Calling picker function...');
      const mediaFile = await pickerFunction();
      console.log('MediaPickerService: Picker function completed, mediaFile:', mediaFile);
      
      if (!mediaFile) {
        console.log('MediaPickerService: No file selected, returning');
        return;
      }

      // Emit local preview first
      try {
        this.callbacks.onPreviewSelected?.(mediaFile.uri, type);
      } catch (error) {
        console.warn('MediaPickerService: Error calling onPreviewSelected:', error);
      }

      // Upload the media
      console.log('MediaPickerService: Starting upload process...');
      const mediaUrl = await MediaService.uploadMedia(mediaFile, (progress) => {
        console.log('MediaPickerService: Upload progress:', progress.percentage + '%');
        this.callbacks?.onUploadProgress?.(progress);
      });

      console.log('MediaPickerService: Upload completed, mediaUrl:', mediaUrl);
      this.callbacks.onMediaSelected(mediaUrl, type, mediaFile.uri);
    } catch (error) {
      console.error('MediaPickerService: Media selection error:', error);
      throw error;
    }
  }

  async selectFromCamera() {
    return this.handleMediaSelection(MediaService.takePhoto, 'IMAGE');
  }

  async selectFromPhotos() {
    return this.handleMediaSelection(MediaService.pickImage, 'IMAGE');
  }

  async selectVideo() {
    return this.handleMediaSelection(MediaService.pickVideo, 'VIDEO');
  }

  async selectDocument() {
    return this.handleMediaSelection(MediaService.pickDocument, 'FILE');
  }
}

export const mediaPickerService = new MediaPickerService();
