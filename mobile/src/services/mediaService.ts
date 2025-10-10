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
    console.log('MediaService: pickImage() function called');
    console.log('MediaService: Requesting media library permissions...');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('MediaService: Media library permission status:', status);
    
    if (status !== 'granted') {
      console.log('MediaService: Media library permission denied');
      throw new Error('Permission to access media library is required');
    }

    console.log('MediaService: Launching image library...');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Start with some compression to reduce initial file size
    });

    console.log('MediaService: Image library result:', result);
    
    if (result.canceled || !result.assets[0]) {
      console.log('MediaService: Image library was canceled or no assets');
      return null;
    }

    const asset = result.assets[0];
    console.log('MediaService: Image library asset:', asset);
    
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
    console.log('MediaService: takePhoto() function called');
    console.log('MediaService: Requesting camera permissions...');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    console.log('MediaService: Camera permission status:', status);
    
    if (status !== 'granted') {
      console.log('MediaService: Camera permission denied');
      throw new Error('Permission to access camera is required');
    }

    console.log('MediaService: Launching camera...');
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Start with some compression to reduce initial file size
    });

    console.log('MediaService: Camera result:', result);
    
    if (result.canceled || !result.assets[0]) {
      console.log('MediaService: Camera was canceled or no assets');
      return null;
    }

    const asset = result.assets[0];
    console.log('MediaService: Camera asset:', asset);
    
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
    console.log('MediaService: Original image size:', this.formatFileSize(originalSize));

    // Smart compression based on file size
    let compressionQuality = this.IMAGE_QUALITY;
    let maxWidth = this.MAX_IMAGE_WIDTH;

    // If file is very large (>2MB), use more aggressive compression
    if (originalSize > 2 * 1024 * 1024) {
      compressionQuality = 0.5;
      maxWidth = 1024;
      console.log('MediaService: Using aggressive compression for large file');
    }
    // If file is large (>1MB), use moderate compression
    else if (originalSize > 1024 * 1024) {
      compressionQuality = 0.6;
      maxWidth = 1280;
      console.log('MediaService: Using moderate compression for medium file');
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
    
    console.log('MediaService: Compressed image size:', this.formatFileSize(compressedSize));
    console.log('MediaService: Compression ratio:', Math.round((1 - compressedSize / originalSize) * 100) + '%');
    
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
    console.log('MediaService: Requesting presigned URL for:', { fileName, fileType, fileSize });
    
    const response = await api.post('/upload/presigned-url', {
      fileName,
      fileType,
      fileSize,
    });

    console.log('MediaService: Presigned URL response:', response.data);
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
    console.log('MediaService: Starting S3 upload...');
    console.log('MediaService: Upload URL:', uploadUrl);
    console.log('MediaService: File URI:', fileUri);
    console.log('MediaService: File Type:', fileType);
    
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

    console.log('MediaService: Upload options:', uploadOptions);
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`MediaService: Upload attempt ${attempt}/${maxRetries}`);
        
        const response = await FileSystem.uploadAsync(uploadUrl, fileUri, uploadOptions);
        
        console.log('MediaService: Upload response:', response);

        if (response.status !== 200) {
          console.error('MediaService: Upload failed with status:', response.status);
          console.error('MediaService: Upload response body:', response.body);
          console.error('MediaService: Upload response headers:', response.headers);
          throw new Error(`Upload failed with status: ${response.status}. Response: ${response.body}`);
        }
        
        console.log('MediaService: Upload successful!');
        return; // Success, exit the retry loop
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown upload error');
        console.error(`MediaService: Upload attempt ${attempt} failed:`, lastError.message);
        
        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`MediaService: Waiting ${waitTime}ms before retry...`);
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
      console.log('MediaService: File is large enough to compress, compressing...');
      processedFile = await this.compressImage(mediaFile.uri);
    } else if (mediaFile.type.startsWith('image/')) {
      console.log('MediaService: File is small enough, skipping compression for speed');
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
    
    console.log('MediaService: Validating S3 URL:', url);
    
    // Check if URL contains the wrong region and fix it
    // The bucket is in eu-north-1 but URLs might be generated with us-north-1
    if (url.includes('us-north-1')) {
      const fixedUrl = url.replace('us-north-1', 'eu-north-1');
      console.log('MediaService: Fixed region in URL:', fixedUrl);
      return fixedUrl;
    }
    
    // Check if URL contains us-east-1 and fix it
    if (url.includes('us-east-1')) {
      const fixedUrl = url.replace('us-east-1', 'eu-north-1');
      console.log('MediaService: Fixed region in URL:', fixedUrl);
      return fixedUrl;
    }
    
    return url;
  }
}
