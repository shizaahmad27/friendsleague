import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaService } from '../services/mediaService';
import { Video, ResizeMode } from 'expo-av';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';

interface MessageMediaProps {
  mediaUrl: string;
  type: 'IMAGE' | 'VIDEO' | 'FILE' | 'VOICE';
  fileName?: string;
  fileSize?: number;
  duration?: number; // Duration in seconds for voice messages
  isOwnMessage?: boolean;
  onLongPress?: () => void;
  messageId?: string;
  onReactionPress?: () => void;
  onReplyPress?: () => void;
  pending?: boolean;
  onMediaPress?: (message: any) => void; // New prop for handling media press
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const MessageMedia: React.FC<MessageMediaProps> = ({
  mediaUrl,
  type,
  fileName,
  fileSize,
  duration,
  isOwnMessage = false,
  onLongPress,
  messageId,
  onReactionPress,
  onReplyPress,
  pending = false,
  onMediaPress,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [mediaWidth, setMediaWidth] = useState<number>(200);
  const [mediaHeight, setMediaHeight] = useState<number>(300);

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

  // Derive a reasonable filename from the URL if missing
  const effectiveFileName = useMemo(() => {
    if (fileName) return fileName;
    try {
      const withoutQuery = displayUrl.split('?')[0];
      const parts = withoutQuery.split('/');
      const last = parts[parts.length - 1];
      return last || `file_${Date.now()}`;
    } catch {
      return `file_${Date.now()}`;
    }
  }, [fileName, displayUrl]);

  // Generate a video thumbnail lazily for preview
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (type !== 'VIDEO' || !displayUrl) return;
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(displayUrl, { time: 1000 });
        if (!cancelled) setVideoThumbnail(uri);
      } catch {
        if (!cancelled) setVideoThumbnail(null);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [type, displayUrl]);

  // Compute non-square media dimensions similar to iMessage
  useEffect(() => {
    const maxW = Math.min(screenWidth * 0.7, 360);
    const maxH = Math.min(screenHeight * 0.5, 420);

    const applySize = (w: number, h: number) => {
      if (!w || !h) {
        setMediaWidth(maxW);
        setMediaHeight(maxW * 0.5625); // fall back to 16:9
        return;
      }
      let targetW = w;
      let targetH = h;
      const ratio = w / h;
      if (targetW > maxW) {
        targetW = maxW;
        targetH = targetW / ratio;
      }
      if (targetH > maxH) {
        targetH = maxH;
        targetW = targetH * ratio;
      }
      // Ensure not too small
      const minW = 140;
      if (targetW < minW) {
        targetW = minW;
        targetH = targetW / ratio;
      }
      setMediaWidth(Math.round(targetW));
      setMediaHeight(Math.round(targetH));
    };

    if (type === 'IMAGE') {
      Image.getSize(
        displayUrl,
        (w, h) => applySize(w, h),
        () => applySize(maxW, maxW * 0.5625), // fallback
      );
    } else if (type === 'VIDEO') {
      const src = videoThumbnail || displayUrl;
      Image.getSize(
        src,
        (w, h) => applySize(w, h),
        () => applySize(maxW, maxW * 0.5625),
      );
    } else if (type === 'FILE') {
      // Use a compact default for files
      applySize(maxW, 68);
    }
  }, [type, displayUrl, videoThumbnail]);

  const handleMediaPress = () => {
    console.log('MessageMedia: handleMediaPress called', {
      type,
      hasOnMediaPress: !!onMediaPress,
      mediaUrl,
      displayUrl
    });
    
    if (onMediaPress) {
      // Use the modularized gallery
      const message = {
        id: messageId || '',
        mediaUrl,
        type,
        content: fileName || '',
        createdAt: new Date().toISOString(),
      };
      console.log('MessageMedia: Calling onMediaPress with message:', message);
      onMediaPress(message);
    } else {
      console.log('MessageMedia: No onMediaPress handler, using fallback');
      // Fallback for when onMediaPress is not provided
      if (type === 'FILE') {
        Alert.alert(
          'File',
          fileName || 'Open file',
          [
            { text: 'Open in Browser', onPress: () => WebBrowser.openBrowserAsync(displayUrl) },
            { text: 'Download', onPress: () => handleDownloadAndShare() },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    }
  };

  const handleDownloadAndShare = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      const filename = fileName || `file_${Date.now()}`;
      const localPath = `${FileSystem.documentDirectory}${filename}`;
      const res = await FileSystem.downloadAsync(displayUrl, localPath, {
        cache: true,
      });
      if (res.status !== 200) {
        throw new Error('Download failed');
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri);
      } else {
        await WebBrowser.openBrowserAsync(displayUrl);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to download');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const getFileIcon = (name?: string) => {
    const n = (name || effectiveFileName || '').toLowerCase();
    const ext = n.split('.').pop();
    switch (ext) {
      case 'pdf':
        return 'document-text-outline';
      case 'doc':
      case 'docx':
        return 'document-outline';
      case 'xls':
      case 'xlsx':
      case 'csv':
        return 'grid-outline';
      case 'ppt':
      case 'pptx':
        return 'easel-outline';
      case 'txt':
        return 'text-outline';
      case 'zip':
      case 'rar':
      case '7z':
        return 'archive-outline';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'image-outline';
      case 'mp3':
      case 'wav':
      case 'm4a':
        return 'musical-notes-outline';
      case 'mp4':
      case 'mov':
      case 'webm':
        return 'videocam-outline';
      case 'json':
        return 'code-slash-outline';
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
          style={[styles.image, { width: mediaWidth, height: mediaHeight }]}
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
      activeOpacity={0.8}
    >
      {videoThumbnail ? (
        <Image source={{ uri: videoThumbnail }} style={[styles.videoThumbnailImage, { width: mediaWidth, height: mediaHeight }]} resizeMode="cover" />
      ) : (
        <View style={[styles.videoThumbnailFallback, { width: mediaWidth, height: mediaHeight }]}>
          <Ionicons name="videocam-outline" size={40} color="#fff" />
        </View>
      )}
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
        <Ionicons name={getFileIcon(effectiveFileName)} size={24} color="#007AFF" />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {effectiveFileName || 'Unknown file'}
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


  return (
    <View style={[styles.container, isOwnMessage && styles.ownMessage]}>
      {type === 'IMAGE' && renderImage()}
      {type === 'VIDEO' && renderVideo()}
      {type === 'FILE' && renderFile()}
      {type === 'VOICE' && (
        <VoiceMessagePlayer
          audioUrl={mediaUrl}
          duration={duration}
          isOwnMessage={isOwnMessage}
        />
      )}
      {pending && (
        <View style={styles.sendingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.sendingText}>Sending…</Text>
        </View>
      )}
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
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  videoThumbnailImage: {
    borderRadius: 12,
  },
  videoThumbnailFallback: {
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
  sendingOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sendingText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 6,
  },
});
