import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import BlurView from 'expo-blur/build/BlurView';
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
  const panelAnim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 visible

  // Auto-reset stuck uploading state after 60 seconds
  useEffect(() => {
    if (isUploading) {
      const resetTimeout = setTimeout(() => {
        console.log('MediaPicker: Auto-resetting stuck uploading state');
        setIsUploading(false);
        setUploadProgress(null);
      }, 60000); // 60 seconds

      return () => clearTimeout(resetTimeout);
    }
  }, [isUploading]);

  const handleMediaSelection = async (pickerFunction: () => Promise<MediaFile | null>, type: 'IMAGE' | 'VIDEO' | 'FILE') => {
    console.log('MediaPicker: Starting media selection for type:', type);
    
    // Reset any previous state first
    setIsUploading(false);
    setUploadProgress(null);
    
    try {
      // Close modal first
      closeMenu();
      console.log('MediaPicker: Modal closing, waiting before launching picker...');
      
      // Wait for modal to fully close before launching picker
      // This is crucial for iOS - native pickers can't launch while modal is active
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('MediaPicker: Modal closed, calling picker function...');
      
      // Only set uploading to true after we actually get a file
      const mediaFile = await pickerFunction();
      console.log('MediaPicker: Picker function completed, mediaFile:', mediaFile);
      
      if (!mediaFile) {
        // User cancelled or no file selected
        console.log('MediaPicker: No file selected, returning');
        return;
      }

      // Now we have a file, start uploading
      console.log('MediaPicker: File selected, starting upload...');
      setIsUploading(true);
      setUploadProgress(null);

      // Add a timeout to prevent infinite uploading state
      const uploadTimeout = setTimeout(() => {
        console.log('MediaPicker: Upload timeout, resetting state');
        setIsUploading(false);
        setUploadProgress(null);
        Alert.alert('Upload Timeout', 'Upload is taking too long. Please check your internet connection and try again.');
      }, 120000); 

      try {
        // Upload the media
        console.log('MediaPicker: Starting upload process...');
        const mediaUrl = await MediaService.uploadMedia(mediaFile, (progress) => {
          console.log('MediaPicker: Upload progress:', progress.percentage + '%');
          setUploadProgress(progress);
          onUploadProgress?.(progress);
        });

        clearTimeout(uploadTimeout);
        console.log('MediaPicker: Upload completed, mediaUrl:', mediaUrl);
        onMediaSelected(mediaUrl, type);
      } catch (uploadError) {
        clearTimeout(uploadTimeout);
        throw uploadError;
      }
    } catch (error) {
      console.error('MediaPicker: Media upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Upload Error', `Failed to upload media: ${errorMessage}. Please try again.`);
    } finally {
      console.log('MediaPicker: Resetting upload state');
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const openMenu = () => {
    console.log('MediaPicker: Opening menu, isUploading:', isUploading);
    if (isUploading) {
      console.log('MediaPicker: Currently uploading, ignoring menu open');
      return;
    }
    setIsModalVisible(true);
    Animated.timing(panelAnim, {
      toValue: 1,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    console.log('MediaPicker: Closing menu');
    Animated.timing(panelAnim, {
      toValue: 0,
      duration: 240,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setIsModalVisible(false));
  };

  // Reset function to clear any stuck state
  const resetState = () => {
    console.log('MediaPicker: Resetting state');
    setIsUploading(false);
    setUploadProgress(null);
    setIsModalVisible(false);
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
        <TouchableOpacity style={styles.resetButton} onPress={resetState}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.mediaButton} onPress={openMenu}>
        <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
      </TouchableOpacity>

      <Modal visible={isModalVisible} transparent animationType="none" onRequestClose={closeMenu}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeMenu}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <View style={styles.modalRoot} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.menuPanel,
                {
                  opacity: panelAnim,
                  transform: [
                    {
                      translateY: panelAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
                    },
                    {
                      scale: panelAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity style={styles.menuItem} onPress={() => { 
                console.log('MediaPicker: Camera button pressed');
                handleMediaSelection(MediaService.takePhoto, 'IMAGE'); 
              }}>
                <View style={[styles.menuIcon, { backgroundColor: '#FF9F0A' }]}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
                <Text style={styles.menuText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { 
                console.log('MediaPicker: Photos button pressed');
                handleMediaSelection(MediaService.pickImage, 'IMAGE'); 
              }}>
                <View style={[styles.menuIcon, { backgroundColor: '#34C759' }]}>
                  <Ionicons name="images" size={16} color="#fff" />
                </View>
                <Text style={styles.menuText}>Photos</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { handleMediaSelection(MediaService.pickVideo, 'VIDEO'); }}>
                <View style={[styles.menuIcon, { backgroundColor: '#5856D6' }]}>
                  <Ionicons name="videocam" size={16} color="#fff" />
                </View>
                <Text style={styles.menuText}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { handleMediaSelection(MediaService.pickDocument, 'FILE'); }}>
                <View style={[styles.menuIcon, { backgroundColor: '#0A84FF' }]}>
                  <Ionicons name="document" size={16} color="#fff" />
                </View>
                <Text style={styles.menuText}>Document</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
  backdrop: {
    flex: 1,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuPanel: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 90,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  menuIcon: {
    width: 30,
    height: 30,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
  resetButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
