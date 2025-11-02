import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import BlurView from 'expo-blur/build/BlurView';
import { Ionicons } from '@expo/vector-icons';
import { useMediaSelection, MediaSelectionCallbacks } from '../../hooks/useMediaSelection';
import { MediaService } from '../../services/mediaService';

interface MediaPickerProps extends MediaSelectionCallbacks {}

export const MediaPicker: React.FC<MediaPickerProps> = (props) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const panelAnim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 visible
  
  const { isUploading, uploadProgress, selectFromCamera, selectFromPhotos, selectVideo, selectDocument, resetState } = useMediaSelection(props);

  const handleMediaSelection = async (selectionFunction: () => Promise<void>) => {
        try {
      closeMenu();
     
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await selectionFunction();
    } catch (error) {
      console.error('MediaPicker: Media selection error:', error);
    }
  };

  const openMenu = () => {
    if (isUploading) {
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
  const resetPickerState = () => {
    console.log('MediaPicker: Resetting picker state');
    resetState();
    setIsModalVisible(false);
  };

  if (false) {
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
                  { width: `${uploadProgress?.percentage || 0}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {uploadProgress?.percentage}% ({MediaService.formatFileSize(uploadProgress?.loaded || 0)} / {MediaService.formatFileSize(uploadProgress?.total || 0)})
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.resetButton} onPress={resetPickerState}>
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
                handleMediaSelection(selectFromCamera); 
              }}>
                <View style={[styles.menuIcon, { backgroundColor: '#FF9F0A' }]}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
                <Text style={styles.menuText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { 
                console.log('MediaPicker: Photos button pressed');
                handleMediaSelection(selectFromPhotos); 
              }}>
                <View style={[styles.menuIcon, { backgroundColor: '#34C759' }]}>
                  <Ionicons name="images" size={16} color="#fff" />
                </View>
                <Text style={styles.menuText}>Photos</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { 
                console.log('MediaPicker: Video button pressed');
                handleMediaSelection(selectVideo); 
              }}>
                <View style={[styles.menuIcon, { backgroundColor: '#5856D6' }]}>
                  <Ionicons name="videocam" size={16} color="#fff" />
                </View>
                <Text style={styles.menuText}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { 
                console.log('MediaPicker: Document button pressed');
                handleMediaSelection(selectDocument); 
              }}>
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
    paddingHorizontal: 6,
    paddingVertical: 4,
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
