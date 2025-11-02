// mobile/src/components/VideoViewer.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { MediaService } from '../../services/mediaService';

interface VideoViewerProps {
  videoUrl: string;
  onClose: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onReact?: () => void;
  onReply?: () => void;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({
  videoUrl,
  onClose,
  onShare,
  onSave,
  onReact,
  onReply,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleDownloadAndShare = async () => {
    try {
      setIsDownloading(true);
      const result = await MediaService.shareMedia(videoUrl);
      if (result.method === 'clipboard') {
        Alert.alert('Success', 'Video URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share video:', error);
      Alert.alert('Error', 'Failed to share video');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = async () => {
    try {
      await MediaService.saveMediaToLibrary(videoUrl);
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
  };

  return (
    <View style={styles.container}>
      {hasError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="videocam-outline" size={80} color="#999" />
          <Text style={styles.errorText}>Cannot load video</Text>
          <Text style={styles.errorUrl}>{videoUrl}</Text>
        </View>
      ) : (
        <Video
          source={{ uri: videoUrl }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping={false}
          onError={(error) => {
            setHasError(true);
          }}
          onLoad={() => {
            setHasError(false);
          }}
        />
      )}
      
      {/* Action Buttons Toolbar */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onShare || handleDownloadAndShare}
        >
          <Ionicons name="share-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
        
        {onReact && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onReact}
          >
            <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
          </TouchableOpacity>
        )}
        
        {onReply && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onReply}
          >
            <Ionicons name="arrow-undo-outline" size={28} color="#007AFF" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onSave || handleSave}
        >
          <Ionicons name="download-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {isDownloading && (
        <View style={styles.downloadOverlay}>
          <View style={styles.downloadBox}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.downloadText}>Processing...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
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
  downloadOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  downloadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  downloadText: {
    color: 'white',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  errorUrl: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
});
