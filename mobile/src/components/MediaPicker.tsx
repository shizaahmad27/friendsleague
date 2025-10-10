import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaService, MediaFile, UploadProgress } from '../services/mediaService';

interface MediaPickerProps {
  onMediaSelected: (mediaUrl: string, type: 'IMAGE' | 'VIDEO' | 'FILE') => void;
  onUploadProgress?: (progress: UploadProgress) => void;
}

const { width } = Dimensions.get('window');

export const MediaPicker: React.FC<MediaPickerProps> = ({
  onMediaSelected,
  onUploadProgress,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const handleMediaSelection = async (pickerFunction: () => Promise<MediaFile | null>, type: 'IMAGE' | 'VIDEO' | 'FILE') => {
    try {
      setIsModalVisible(false);
      setIsUploading(true);
      setUploadProgress(null);

      const mediaFile = await pickerFunction();
      if (!mediaFile) {
        setIsUploading(false);
        return;
      }

      // Upload the media
      const mediaUrl = await MediaService.uploadMedia(mediaFile, (progress) => {
        setUploadProgress(progress);
        onUploadProgress?.(progress);
      });

      onMediaSelected(mediaUrl, type);
    } catch (error) {
      console.error('Media upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload media. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const showMediaOptions = () => {
    Alert.alert(
      'Select Media',
      'Choose the type of media you want to send',
      [
        { text: 'Camera', onPress: () => handleMediaSelection(MediaService.takePhoto, 'IMAGE') },
        { text: 'Photo Library', onPress: () => handleMediaSelection(MediaService.pickImage, 'IMAGE') },
        { text: 'Video', onPress: () => handleMediaSelection(MediaService.pickVideo, 'VIDEO') },
        { text: 'Document', onPress: () => handleMediaSelection(MediaService.pickDocument, 'FILE') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (isUploading) {
    return (
      <View style={styles.uploadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.uploadingText}>Uploading...</Text>
        {uploadProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${uploadProgress.percentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {uploadProgress.percentage}% ({MediaService.formatFileSize(uploadProgress.loaded)} / {MediaService.formatFileSize(uploadProgress.total)})
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.mediaButton} onPress={showMediaOptions}>
      <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
      <Text style={styles.mediaButtonText}>Media</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    marginRight: 8,
  },
  mediaButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    marginRight: 8,
    minWidth: 120,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
