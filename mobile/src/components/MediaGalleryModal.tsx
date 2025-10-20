// mobile/src/components/MediaGalleryModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../services/chatApi';
import { MediaService } from '../services/mediaService';
import { useSwipeToClose } from '../hooks/useSwipeToClose';
import { VideoViewer } from './VideoViewer';
import { FileViewer } from './FileViewer';

interface MediaGalleryModalProps {
  visible: boolean;
  onClose: () => void;
  message: Message | null;
  allMessages: Message[];
  onReactionPress?: (message: Message) => void;
  onReplyPress?: (message: Message) => void;
}

export const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({
  visible,
  onClose,
  message,
  allMessages,
  onReactionPress,
  onReplyPress,
}) => {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryMessages, setGalleryMessages] = useState<Message[]>([]);
  
  // Swipe to close functionality
  const { panY, modalOpacity, imageScale, panResponder } = useSwipeToClose({
    onClose,
    enabled: visible,
  });

  // Update gallery when message changes
  React.useEffect(() => {
    if (message) {
      // For images, create a gallery of all images
      if (message.type === 'IMAGE') {
        const imageMessages = allMessages.filter(msg => msg.type === 'IMAGE' && msg.mediaUrl);
        const index = imageMessages.findIndex(msg => msg.id === message.id);
        setGalleryMessages(imageMessages);
        setGalleryIndex(index >= 0 ? index : 0);
      } else {
        // For videos and files, just show the single item
        setGalleryMessages([message]);
        setGalleryIndex(0);
      }
    }
  }, [message, allMessages]);

  const goToPreviousImage = () => {
    if (galleryIndex > 0) {
      const newIndex = galleryIndex - 1;
      setGalleryIndex(newIndex);
    }
  };

  const goToNextImage = () => {
    if (galleryIndex < galleryMessages.length - 1) {
      const newIndex = galleryIndex + 1;
      setGalleryIndex(newIndex);
    }
  };

  const handleClose = () => {
    setGalleryIndex(0);
    setGalleryMessages([]);
    onClose();
  };

  const currentMessage = galleryMessages[galleryIndex];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.fullscreenOverlay, { opacity: modalOpacity }]}>
        <TouchableOpacity
          style={styles.fullscreenCloseButton}
          onPress={handleClose}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        
        {/* Gallery Navigation - only show for images */}
        {galleryMessages.length > 1 && currentMessage?.type === 'IMAGE' && (
          <>
            {/* Previous Button */}
            {galleryIndex > 0 && (
              <TouchableOpacity
                style={styles.galleryNavButton}
                onPress={goToPreviousImage}
              >
                <Ionicons name="chevron-back" size={30} color="white" />
              </TouchableOpacity>
            )}
            
            {/* Next Button */}
            {galleryIndex < galleryMessages.length - 1 && (
              <TouchableOpacity
                style={[styles.galleryNavButton, styles.galleryNavButtonRight]}
                onPress={goToNextImage}
              >
                <Ionicons name="chevron-forward" size={30} color="white" />
              </TouchableOpacity>
            )}
            
            {/* Gallery Counter */}
            <View style={styles.galleryCounter}>
              <Text style={styles.galleryCounterText}>
                {galleryIndex + 1} / {galleryMessages.length}
              </Text>
            </View>
          </>
        )}
        
        <Animated.View style={{ transform: [{ translateY: panY }, { scale: imageScale }] }} {...panResponder.panHandlers}>
          {currentMessage && currentMessage.mediaUrl && (
            <>
              {currentMessage.type === 'IMAGE' && (
                <Image
                  source={{ uri: currentMessage.mediaUrl }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              )}
              {currentMessage.type === 'VIDEO' && currentMessage.mediaUrl && (
                <VideoViewer
                  videoUrl={currentMessage.mediaUrl}
                  onClose={handleClose}
                  onShare={async () => {
                    try {
                      const result = await MediaService.shareMedia(currentMessage.mediaUrl!);
                      if (result.method === 'clipboard') {
                        Alert.alert('Success', 'Video URL copied to clipboard!');
                      }
                    } catch (error) {
                      console.error('Failed to share video:', error);
                      Alert.alert('Error', 'Failed to share video');
                    }
                  }}
                  onSave={async () => {
                    try {
                      await MediaService.saveMediaToLibrary(currentMessage.mediaUrl!);
                      Alert.alert('Success', 'Video saved to your photo library!');
                    } catch (error) {
                      console.error('Failed to save video:', error);
                      const errorMessage = error instanceof Error ? error.message : 'Failed to save video to library';
                      if (errorMessage.includes('copied to clipboard')) {
                        Alert.alert(
                          'Development Mode', 
                          'In Expo Go, videos can\'t be saved directly. This will work properly when the app is built and installed on your device! For now, the video URL has been copied to your clipboard.'
                        );
                      } else {
                        Alert.alert('Error', errorMessage);
                      }
                    }
                  }}
                  onReact={onReactionPress ? () => onReactionPress(currentMessage) : undefined}
                  onReply={onReplyPress ? () => onReplyPress(currentMessage) : undefined}
                />
              )}
              {currentMessage.type === 'FILE' && currentMessage.mediaUrl && (
                <FileViewer
                  fileUrl={currentMessage.mediaUrl}
                  fileName={currentMessage.content || 'Unknown file'}
                  onClose={handleClose}
                  onShare={async () => {
                    try {
                      const result = await MediaService.shareMedia(currentMessage.mediaUrl!);
                      if (result.method === 'clipboard') {
                        Alert.alert('Success', 'File URL copied to clipboard!');
                      }
                    } catch (error) {
                      console.error('Failed to share file:', error);
                      Alert.alert('Error', 'Failed to share file');
                    }
                  }}
                  onReact={onReactionPress ? () => onReactionPress(currentMessage) : undefined}
                  onReply={onReplyPress ? () => onReplyPress(currentMessage) : undefined}
                />
              )}
            </>
          )}
        </Animated.View>
        
        {/* Action Buttons Toolbar - only for images */}
        {currentMessage && currentMessage.type === 'IMAGE' && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={async () => {
                try {
                  console.log('Share button pressed');
                  if (currentMessage?.mediaUrl) {
                    const result = await MediaService.shareMedia(currentMessage.mediaUrl);
                    if (result.method === 'clipboard') {
                      Alert.alert('Success', 'Image URL copied to clipboard!');
                    }
                    // No alert needed for successful share via Web Share API
                  }
                } catch (error) {
                  console.error('Failed to share media:', error);
                  Alert.alert('Error', 'Failed to share media');
                }
              }}
            >
              <Ionicons name="share-outline" size={28} color="#007AFF" />
            </TouchableOpacity>
            
            {onReactionPress && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  console.log('React button pressed');
                  onReactionPress(currentMessage);
                }}
              >
                <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
              </TouchableOpacity>
            )}
            
            {onReplyPress && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  handleClose();
                  onReplyPress(currentMessage);
                }}
              >
                <Ionicons name="arrow-undo-outline" size={28} color="#007AFF" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={async () => {
                try {
                  console.log('Save button pressed');
                  if (currentMessage?.mediaUrl) {
                    await MediaService.saveMediaToLibrary(currentMessage.mediaUrl);
                    Alert.alert('Success', 'Image saved to your photo library!');
                  }
                } catch (error) {
                  console.error('Failed to save media:', error);
                  const errorMessage = error instanceof Error ? error.message : 'Failed to save image to library';
                  if (errorMessage.includes('copied to clipboard')) {
                    Alert.alert(
                      'Development Mode', 
                      'In Expo Go, images can\'t be saved directly. This will work properly when the app is built and installed on your device! For now, the image URL has been copied to your clipboard.'
                    );
                  } else {
                    Alert.alert('Error', errorMessage);
                  }
                }
              }}
            >
              <Ionicons name="download-outline" size={28} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  // Gallery navigation styles
  galleryNavButton: {
    position: 'absolute',
    top: '50%',
    left: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    transform: [{ translateY: -20 }],
  },
  galleryNavButtonRight: {
    left: undefined,
    right: 20,
  },
  galleryCounter: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  galleryCounterText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    width: '100%',
    height: '100%',
  },
  fullscreenVideoText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  fullscreenVideoSubtext: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 8,
  },
  fullscreenFileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    width: '100%',
    height: '100%',
  },
  fullscreenFileText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  fullscreenFileSubtext: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 8,
  },
  // Action buttons styles
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 40, // Extra padding for home indicator
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
});
