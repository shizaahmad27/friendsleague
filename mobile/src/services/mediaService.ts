import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import api from './api';

export interface MediaFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  mediaUrl: string;
  key: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class MediaService {
  private static readonly MAX_IMAGE_WIDTH = 1280; // Reduced from 1920 for faster uploads
  private static readonly IMAGE_QUALITY = 0.7; // Reduced from 0.8 for smaller files

  /**
   * Request camera/photo library permissions
   */
  static async requestPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Pick an image from camera or photo library
   */
  static async pickImage(): Promise<MediaFile | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Permission to access media library is required');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Start with some compression to reduce initial file size
    });

    
    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    
    return {
      uri: asset.uri,
      name: asset.fileName || `image_${Date.now()}.jpg`,
      type: 'image/jpeg',
      size: asset.fileSize || 0,
    };
  }

  /**
   * Take a photo with camera
   */
  static async takePhoto(): Promise<MediaFile | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Permission to access camera is required');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Start with some compression to reduce initial file size
    });

    
    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    
    return {
      uri: asset.uri,
      name: asset.fileName || `photo_${Date.now()}.jpg`,
      type: 'image/jpeg',
      size: asset.fileSize || 0,
    };
  }

  /**
   * Pick a video from library
   */
  static async pickVideo(): Promise<MediaFile | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access media library is required');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.fileName || `video_${Date.now()}.mp4`,
      type: 'video/mp4',
      size: asset.fileSize || 0,
    };
  }

  /**
   * Pick a document/file
   */
  static async pickDocument(): Promise<MediaFile | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || 'application/octet-stream',
      size: asset.size || 0,
    };
  }

  /**
   * Compress an image to reduce file size with smart compression
   */
  static async compressImage(imageUri: string): Promise<MediaFile> {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('Image file not found');
    }

    const originalSize = (fileInfo as any).size || 0;

    // Smart compression based on file size
    let compressionQuality = this.IMAGE_QUALITY;
    let maxWidth = this.MAX_IMAGE_WIDTH;

    // If file is very large (>2MB), use more aggressive compression
    if (originalSize > 2 * 1024 * 1024) {
      compressionQuality = 0.5;
      maxWidth = 1024;
    }
    // If file is large (>1MB), use moderate compression
    else if (originalSize > 1024 * 1024) {
      compressionQuality = 0.6;
      maxWidth = 1280;
    }

    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: maxWidth,
          },
        },
      ],
      {
        compress: compressionQuality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    const compressedInfo = await FileSystem.getInfoAsync(manipResult.uri);
    const compressedSize = (compressedInfo as any).size || 0;
    
    
    return {
      uri: manipResult.uri,
      name: `compressed_${Date.now()}.jpg`,
      type: 'image/jpeg',
      size: compressedSize,
    };
  }

  /**
   * Get presigned URL from backend
   */
  static async getPresignedUrl(fileName: string, fileType: string, fileSize: number): Promise<PresignedUrlResponse> {
    
    const response = await api.post('/upload/presigned-url', {
      fileName,
      fileType,
      fileSize,
    });

    return response.data;
  }

  /**
   * Upload file to S3 using presigned URL with retry logic
   */
  static async uploadToS3(
    fileUri: string,
    uploadUrl: string,
    fileType: string,
    onProgress?: (progress: UploadProgress) => void,
    maxRetries: number = 3
  ): Promise<void> {
    
    const uploadOptions: any = {
      httpMethod: 'PUT',
      headers: {
        'Content-Type': fileType,
      },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      timeout: 120000, // 2 minute timeout for the upload itself
    };

    if (onProgress) {
      uploadOptions.uploadProgressCallback = (progressEvent: any) => {
        const progress: UploadProgress = {
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100),
        };
        onProgress(progress);
      };
    }

    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        
        const response = await FileSystem.uploadAsync(uploadUrl, fileUri, uploadOptions);
        

        if (response.status !== 200) {
          console.error('MediaService: Upload failed with status:', response.status);
          console.error('MediaService: Upload response body:', response.body);
          console.error('MediaService: Upload response headers:', response.headers);
          throw new Error(`Upload failed with status: ${response.status}. Response: ${response.body}`);
        }
        
        return; // Success, exit the retry loop
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown upload error');
        console.error(`MediaService: Upload attempt ${attempt} failed:`, lastError.message);
        
        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // All retries failed
    console.error('MediaService: All upload attempts failed');
    throw new Error(`Upload failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Complete media upload flow: get presigned URL and upload to S3
   */
  static async uploadMedia(
    mediaFile: MediaFile,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Compress image if it's an image and larger than 500KB
    let processedFile = mediaFile;
    if (mediaFile.type.startsWith('image/') && mediaFile.size > 500 * 1024) {
      processedFile = await this.compressImage(mediaFile.uri);
    } else if (mediaFile.type.startsWith('image/')) {
    }

    // Get presigned URL
    const presignedData = await this.getPresignedUrl(
      processedFile.name,
      processedFile.type,
      processedFile.size
    );

    // Upload to S3
    await this.uploadToS3(
      processedFile.uri,
      presignedData.uploadUrl,
      processedFile.type,
      onProgress
    );

    return presignedData.mediaUrl;
  }

  /**
   * Get file extension from MIME type
   */
  static getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/x-msvideo': 'avi',
      'video/webm': 'webm',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt',
    };

    return extensions[mimeType] || 'bin';
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate and potentially fix S3 URL format
   */
  static validateAndFixS3Url(url: string): string {
    if (!url) return url;
    
    
    // Check if URL contains the wrong region and fix it
    // The bucket is in eu-north-1 but URLs might be generated with us-north-1
    if (url.includes('us-north-1')) {
      const fixedUrl = url.replace('us-north-1', 'eu-north-1');
      return fixedUrl;
    }
    
    // Check if URL contains us-east-1 and fix it
    if (url.includes('us-east-1')) {
      const fixedUrl = url.replace('us-east-1', 'eu-north-1');
      return fixedUrl;
    }
    
    return url;
  }

  /**
   * Share media using Web Share API or copy to clipboard
   */
  static async shareMedia(mediaUrl: string): Promise<{ success: boolean; method: 'share' | 'clipboard' }> {
    try {
            // Check if Web Share API is available (works in Expo Go on mobile)
      if (typeof navigator !== 'undefined' && navigator.share) {
        // Use Web Share API
        await navigator.share({
          title: 'Check out this image!',
          text: 'Look at this image from FriendsLeague',
          url: mediaUrl,
        });
        return { success: true, method: 'share' };
      } else {
        // Fallback: Copy URL to clipboard using Expo Clipboard
        const Clipboard = await import('expo-clipboard');
        await Clipboard.setStringAsync(mediaUrl);
        return { success: true, method: 'clipboard' };
      }
    } catch (error) {
      throw new Error('Failed to share media');
    }
  }

  /**
   * Save media to device photo library
   */
  static async saveMediaToLibrary(mediaUrl: string): Promise<void> {
    try {
      
      // Download the image to a temporary file first
      const filename = `image_${Date.now()}.jpg`;
      const localUri = `${FileSystem.documentDirectory}${filename}`;
      
      const downloadResult = await FileSystem.downloadAsync(mediaUrl, localUri);
      
      if (downloadResult.status !== 200) {
        throw new Error('Failed to download image');
      }
      
      // Try to use expo-media-library if available (production builds)
      try {
        const MediaLibrary = (await import('expo-media-library')).default;
        
        // Request permissions
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Media library permission not granted');
        }
        
        // Save to photo library
        await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
        
        // Clean up temporary file
        await FileSystem.deleteAsync(localUri, { idempotent: true });
        
      
        return;
      } catch (mediaLibraryError) {
    
        
        // Fallback: Use Web Share API to save (works in Expo Go)
        if (typeof navigator !== 'undefined' && navigator.share) {
          // Create a blob from the downloaded file and share it
          const response = await fetch(downloadResult.uri);
          const blob = await response.blob();
          
          // Create a temporary URL for the blob
          const blobUrl = URL.createObjectURL(blob);
          
          // Use Web Share API with the blob
          await navigator.share({
            title: 'Save Image',
            files: [new File([blob], filename, { type: 'image/jpeg' })]
          });
          
          // Clean up
          URL.revokeObjectURL(blobUrl);
          await FileSystem.deleteAsync(localUri, { idempotent: true });
          
          return;
        } else {
          // Final fallback: Copy URL to clipboard with instructions
          const Clipboard = await import('expo-clipboard');
          await Clipboard.setStringAsync(mediaUrl);
          await FileSystem.deleteAsync(localUri, { idempotent: true });
          throw new Error('Save not available in Expo Go - URL copied to clipboard. Open the URL in your browser and long-press the image to save it.');
        }
      }
    } catch (error) {
      console.error('MediaService: Save to library failed:', error);
      throw new Error('Failed to save media to library');
    }
  }
}
