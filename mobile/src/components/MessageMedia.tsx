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
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const MessageMedia: React.FC<MessageMediaProps> = ({
  mediaUrl,
  type,
  fileName,
  fileSize,
  isOwnMessage = false,
}) => {
  const [isFullscreenVisible, setIsFullscreenVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleMediaPress = () => {
    if (type === 'IMAGE') {
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
    <TouchableOpacity onPress={handleMediaPress} style={styles.imageContainer}>
      {imageError ? (
        <View style={[styles.imageContainer, styles.errorContainer]}>
          <Ionicons name="image-outline" size={40} color="#999" />
          <Text style={styles.errorText}>Failed to load image</Text>
        </View>
      ) : (
        <Image
          source={{ uri: mediaUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      )}
      <View style={styles.imageOverlay}>
        <Ionicons name="expand-outline" size={16} color="white" />
      </View>
    </TouchableOpacity>
  );

  const renderVideo = () => (
    <TouchableOpacity onPress={handleMediaPress} style={styles.videoContainer}>
      <View style={styles.videoThumbnail}>
        <Ionicons name="play-circle" size={40} color="white" />
      </View>
      <View style={styles.videoOverlay}>
        <Ionicons name="play" size={16} color="white" />
      </View>
    </TouchableOpacity>
  );

  const renderFile = () => (
    <TouchableOpacity onPress={handleMediaPress} style={styles.fileContainer}>
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
        <Image
          source={{ uri: mediaUrl }}
          style={styles.fullscreenImage}
          resizeMode="contain"
        />
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
    maxWidth: screenWidth * 0.7,
    marginVertical: 2,
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
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
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
});
