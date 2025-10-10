import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaService } from '../services/mediaService';

interface MessageMediaProps {
  mediaUrl: string;
  type: 'IMAGE' | 'VIDEO' | 'FILE';
  fileName?: string;
  fileSize?: number;
  isOwnMessage?: boolean;
  onLongPress?: () => void;
  messageId?: string;
  onReactionPress?: () => void;
  onReplyPress?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const MessageMedia: React.FC<MessageMediaProps> = ({
  mediaUrl,
  type,
  fileName,
  fileSize,
  isOwnMessage = false,
  onLongPress,
  messageId,
  onReactionPress,
  onReplyPress,
}) => {
  const [isFullscreenVisible, setIsFullscreenVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Debug logging for image URLs and URL validation
  React.useEffect(() => {
    if (type === 'IMAGE') {
      const validatedUrl = MediaService.validateAndFixS3Url(mediaUrl);
      if (validatedUrl !== mediaUrl) {
      }
    }
  }, [mediaUrl, type]);

  // Get the validated URL for display
  const displayUrl = MediaService.validateAndFixS3Url(mediaUrl);

  const handleMediaPress = () => {
    if (type === 'IMAGE') {
      // Reset error state when opening fullscreen
      setImageError(false);
      setIsFullscreenVisible(true);
    } else if (type === 'VIDEO') {
      // TODO: Implement video player
      Alert.alert('Video Player', 'Video player will be implemented in a future update');
    } else if (type === 'FILE') {
      // TODO: Implement file download/view
      Alert.alert('File Viewer', 'File viewer will be implemented in a future update');
    }
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return 'document-outline';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'document-text-outline';
      case 'doc':
      case 'docx':
        return 'document-outline';
      case 'xls':
      case 'xlsx':
        return 'grid-outline';
      case 'txt':
        return 'text-outline';
      default:
        return 'document-outline';
    }
  };

  const renderImage = () => (
    <TouchableOpacity 
      onPress={handleMediaPress} 
      onLongPress={onLongPress}
      style={styles.imageContainer}
    >
      {imageError ? (
        <View style={[styles.imageContainer, styles.errorContainer]}>
          <Ionicons name="image-outline" size={40} color="#999" />
          <Text style={styles.errorText}>Failed to load image</Text>
        </View>
      ) : (
        <Image
          source={{ uri: displayUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={(error) => {
            console.error('MessageMedia: Image load error:', error);
            console.error('MessageMedia: Failed URL:', displayUrl);
            setImageError(true);
          }}
          onLoad={() => {
          }}
        />
      )}
    </TouchableOpacity>
  );

  const renderVideo = () => (
    <TouchableOpacity 
      onPress={handleMediaPress} 
      onLongPress={onLongPress}
      style={styles.videoContainer}
    >
      <View style={styles.videoThumbnail}>
        <Ionicons name="play-circle" size={40} color="white" />
      </View>
      <View style={styles.videoOverlay}>
        <Ionicons name="play" size={16} color="white" />
      </View>
    </TouchableOpacity>
  );

  const renderFile = () => (
    <TouchableOpacity 
      onPress={handleMediaPress} 
      onLongPress={onLongPress}
      style={styles.fileContainer}
    >
      <View style={styles.fileIcon}>
        <Ionicons name={getFileIcon(fileName)} size={24} color="#007AFF" />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {fileName || 'Unknown file'}
        </Text>
        {fileSize && (
          <Text style={styles.fileSize}>
            {MediaService.formatFileSize(fileSize)}
          </Text>
        )}
      </View>
      <Ionicons name="download-outline" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderFullscreenImage = () => (
    <Modal
      visible={isFullscreenVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsFullscreenVisible(false)}
    >
      <View style={styles.fullscreenContainer}>
        <TouchableOpacity
          style={styles.fullscreenCloseButton}
          onPress={() => setIsFullscreenVisible(false)}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        {imageError ? (
          <View style={styles.fullscreenErrorContainer}>
            <Ionicons name="image-outline" size={80} color="#999" />
            <Text style={styles.fullscreenErrorText}>Failed to load image</Text>
            <Text style={styles.fullscreenErrorUrl}>{displayUrl}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: displayUrl }}
            style={styles.fullscreenImage}
            resizeMode="contain"
            onError={(error) => {
              console.error('MessageMedia: Fullscreen image load error:', error);
              console.error('MessageMedia: Failed fullscreen URL:', displayUrl);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('MessageMedia: Fullscreen image loaded successfully:', displayUrl);
              setImageError(false);
            }}
          />
        )}
        
        {/* Action Buttons Toolbar */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={async () => {
              try {
                console.log('Share button pressed');
                const result = await MediaService.shareMedia(displayUrl);
                if (result.method === 'clipboard') {
                  Alert.alert('Success', 'Image URL copied to clipboard!');
                }
                // No alert needed for successful share via Web Share API
              } catch (error) {
                console.error('Failed to share media:', error);
                Alert.alert('Error', 'Failed to share media');
              }
            }}
          >
            <Ionicons name="share-outline" size={28} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              console.log('React button pressed');
              if (onReactionPress) {
                onReactionPress();
              }
            }}
          >
            <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              setIsFullscreenVisible(false);
              onReplyPress?.();
            }}
          >
            <Ionicons name="arrow-undo-outline" size={28} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={async () => {
              try {
                console.log('Save button pressed');
                await MediaService.saveMediaToLibrary(displayUrl);
                Alert.alert('Success', 'Image saved to your photo library!');
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
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, isOwnMessage && styles.ownMessage]}>
      {type === 'IMAGE' && renderImage()}
      {type === 'VIDEO' && renderVideo()}
      {type === 'FILE' && renderFile()}
      {type === 'IMAGE' && renderFullscreenImage()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // No margins - let ChatScreen handle spacing
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  errorContainer: {
    width: 200,
    height: 200,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  videoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: 200,
    height: 200,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  videoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 12,
    minWidth: 200,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  fullscreenContainer: {
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
  fullscreenImage: {
    width: screenWidth,
    height: screenHeight,
  },
  fullscreenErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullscreenErrorText: {
    color: 'white',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  fullscreenErrorUrl: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
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
