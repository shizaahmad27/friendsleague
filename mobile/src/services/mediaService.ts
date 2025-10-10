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
  private static readonly MAX_IMAGE_WIDTH = 1920;
  private static readonly IMAGE_QUALITY = 0.8;

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
      quality: 1, // We'll compress it ourselves
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
      quality: 1, // We'll compress it ourselves
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
   * Compress an image to reduce file size
   */
  static async compressImage(imageUri: string): Promise<MediaFile> {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('Image file not found');
    }

    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: this.MAX_IMAGE_WIDTH,
          },
        },
      ],
      {
        compress: this.IMAGE_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    const compressedInfo = await FileSystem.getInfoAsync(manipResult.uri);
    
    return {
      uri: manipResult.uri,
      name: `compressed_${Date.now()}.jpg`,
      type: 'image/jpeg',
      size: (compressedInfo as any).size || 0,
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
   * Upload file to S3 using presigned URL
   */
  static async uploadToS3(
    fileUri: string,
    uploadUrl: string,
    fileType: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    const uploadOptions: any = {
      httpMethod: 'PUT',
      headers: {
        'Content-Type': fileType,
      },
      uploadType: 'BINARY_CONTENT',
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

    const response = await FileSystem.uploadAsync(uploadUrl, fileUri, uploadOptions);

    if (response.status !== 200) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
  }

  /**
   * Complete media upload flow: get presigned URL and upload to S3
   */
  static async uploadMedia(
    mediaFile: MediaFile,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Compress image if it's an image
    let processedFile = mediaFile;
    if (mediaFile.type.startsWith('image/')) {
      processedFile = await this.compressImage(mediaFile.uri);
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
}
