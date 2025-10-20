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
import { Video, ResizeMode } from 'expo-av';
import { Message } from '../services/chatApi';
import { MediaService } from '../services/mediaService';
import { useSwipeToClose } from '../hooks/useSwipeToClose';

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
      console.log('MediaGalleryModal: Message changed:', {
        id: message.id,
        type: message.type,
        mediaUrl: message.mediaUrl,
        hasMediaUrl: !!message.mediaUrl
      });
      
      // Create a gallery of all media messages (images, videos, and files)
      const mediaMessages = allMessages.filter(msg => 
        (msg.type === 'IMAGE' || msg.type === 'VIDEO' || msg.type === 'FILE') && 
        msg.mediaUrl
      );
      const index = mediaMessages.findIndex(msg => msg.id === message.id);
      setGalleryMessages(mediaMessages);
      setGalleryIndex(index >= 0 ? index : 0);
      console.log('MediaGalleryModal: Media gallery created with', mediaMessages.length, 'items');
    }
  }, [message, allMessages]);

  const goToPreviousMedia = () => {
    if (galleryIndex > 0) {
      const newIndex = galleryIndex - 1;
      console.log('MediaGalleryModal: Going to previous media, index:', newIndex);
      setGalleryIndex(newIndex);
    }
  };

  const goToNextMedia = () => {
    if (galleryIndex < galleryMessages.length - 1) {
      const newIndex = galleryIndex + 1;
      console.log('MediaGalleryModal: Going to next media, index:', newIndex);
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
        
        {/* Gallery Navigation - show for all media types when there are multiple items */}
        {galleryMessages.length > 1 && (
          <>
            {/* Previous Button */}
            {galleryIndex > 0 && (
              <TouchableOpacity
                style={styles.galleryNavButton}
                onPress={goToPreviousMedia}
              >
                <Ionicons name="chevron-back" size={30} color="white" />
              </TouchableOpacity>
            )}
            
            {/* Next Button */}
            {galleryIndex < galleryMessages.length - 1 && (
              <TouchableOpacity
                style={[styles.galleryNavButton, styles.galleryNavButtonRight]}
                onPress={goToNextMedia}
              >
                <Ionicons name="chevron-forward" size={30} color="white" />
              </TouchableOpacity>
            )}
            
            {/* Gallery Counter */}
            <View style={styles.galleryCounter}>
              <Text style={styles.galleryCounterText}>
                {galleryIndex + 1} / {galleryMessages.length}
              </Text>
              {currentMessage && (
                <Text style={styles.galleryTypeText}>
                  {currentMessage.type === 'IMAGE' ? '' : 
                   currentMessage.type === 'VIDEO' ? '' : 
                   currentMessage.type === 'FILE' ? '' : ''}
                </Text>
              )}
            </View>
          </>
        )}
        
        {currentMessage && currentMessage.mediaUrl && (
          <Animated.View 
            style={[
              styles.mediaContainer,
              { transform: [{ translateY: panY }, { scale: imageScale }] }
            ]} 
            {...panResponder.panHandlers}
          >
            {currentMessage.type === 'IMAGE' && (
              <Image
                source={{ uri: currentMessage.mediaUrl }}
                style={styles.fullscreenImage}
                resizeMode="contain"
                onLoad={() => console.log('MediaGalleryModal: Image loaded successfully')}
                onError={(error) => console.error('MediaGalleryModal: Image load error:', error)}
              />
            )}
            {currentMessage.type === 'VIDEO' && currentMessage.mediaUrl && (
              <Video
                source={{ uri: currentMessage.mediaUrl }}
                style={styles.fullscreenVideo}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping={false}
                onLoad={() => console.log('MediaGalleryModal: Video loaded successfully')}
                onError={(error) => console.error('MediaGalleryModal: Video load error:', error)}
              />
            )}
            {currentMessage.type === 'FILE' && currentMessage.mediaUrl && (
              <View style={styles.fileContainer}>
                <Ionicons name="document-outline" size={80} color="#007AFF" />
                <Text style={styles.fileName}>{currentMessage.content || 'Unknown file'}</Text>
                <Text style={styles.fileSubtext}>Tap action buttons below to interact</Text>
              </View>
            )}
          </Animated.View>
        )}
        
        {/* Debug info */}
        {currentMessage && !currentMessage.mediaUrl && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>No media URL for message: {currentMessage.id}</Text>
          </View>
        )}
        
        {/* Action Buttons Toolbar - for all media types */}
        {currentMessage && (
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
  galleryTypeText: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  mediaContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  fileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fileName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  fileSubtext: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
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
  debugContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});
