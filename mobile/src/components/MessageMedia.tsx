import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaService } from '../services/mediaService';
import { Video, ResizeMode } from 'expo-av';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import * as VideoThumbnails from 'expo-video-thumbnails';

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
  pending?: boolean;
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
  pending = false,
}) => {
  const [isFullscreenVisible, setIsFullscreenVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isFileVisible, setIsFileVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [mediaWidth, setMediaWidth] = useState<number>(200);
  const [mediaHeight, setMediaHeight] = useState<number>(300);

  // Swipe down to dismiss with image-only drag
  const panY = React.useRef(new Animated.Value(0)).current;
  const modalOpacity = React.useRef(new Animated.Value(0)).current;
  const imageScale = panY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });
  
  // Reset pan values and animate modal when it opens
  React.useEffect(() => {
    if (isFullscreenVisible || isVideoVisible || isFileVisible) {
      panY.setValue(0);
      modalOpacity.setValue(0);
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      modalOpacity.setValue(0);
    }
  }, [isFullscreenVisible, isVideoVisible, isFileVisible, panY, modalOpacity]);
  
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panY.setOffset((panY as any)._value);
        panY.setValue(0);
      },
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        panY.flattenOffset();
        if (g.dy > 100 || g.vy > 0.5) {
          // Smooth exit animation
          Animated.parallel([
            Animated.timing(panY, { toValue: 1000, duration: 300, useNativeDriver: false }),
            Animated.timing(modalOpacity, { toValue: 0, duration: 300, useNativeDriver: false })
          ]).start(() => {
            setIsFullscreenVisible(false);
            setIsVideoVisible(false);
            setIsFileVisible(false);
            // Reset after modal is closed
            setTimeout(() => {
              panY.setValue(0);
            }, 100);
          });
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

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
    if (type === 'IMAGE') {
      // Reset error state when opening fullscreen
      setImageError(false);
      setIsFullscreenVisible(true);
    } else if (type === 'VIDEO') {
      setIsVideoVisible(true);
    } else if (type === 'FILE') {
      const lower = (fileName || '').toLowerCase();
      if (lower.endsWith('.pdf')) {
        setIsFileVisible(true);
      } else {
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

  const renderFullscreenImage = () => (
    <Modal
      visible={isFullscreenVisible}
      transparent={true}
      animationType="none"
      onRequestClose={() => setIsFullscreenVisible(false)}
    >
      <Animated.View style={[styles.fullscreenContainer, { opacity: modalOpacity }]}>
        <TouchableOpacity
          style={styles.fullscreenCloseButton}
          onPress={() => setIsFullscreenVisible(false)}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ translateY: panY }, { scale: imageScale }] }} {...panResponder.panHandlers}>
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
        </Animated.View>
        
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
      </Animated.View>
    </Modal>
  );

  const renderFullscreenVideo = () => (
    <Modal
      visible={isVideoVisible}
      transparent={true}
      animationType="none"
      onRequestClose={() => setIsVideoVisible(false)}
    >
      <Animated.View style={[styles.fullscreenContainer, { opacity: modalOpacity }]}>
        <TouchableOpacity
          style={styles.fullscreenCloseButton}
          onPress={() => setIsVideoVisible(false)}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ translateY: panY }, { scale: imageScale }] }} {...panResponder.panHandlers}>
          <Video
            source={{ uri: displayUrl }}
            style={styles.fullscreenVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping={false}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );

  const renderFileViewer = () => (
    <Modal
      visible={isFileVisible}
      transparent={true}
      animationType="none"
      onRequestClose={() => setIsFileVisible(false)}
    >
      <Animated.View style={[styles.fullscreenContainer, { opacity: modalOpacity }]}>
        <TouchableOpacity
          style={styles.fullscreenCloseButton}
          onPress={() => setIsFileVisible(false)}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ translateY: panY }, { scale: imageScale }] }} {...panResponder.panHandlers}>
          <View style={styles.pdfContainer}>
            <WebView
              source={{ uri: displayUrl }}
              startInLoadingState
              renderError={() => (
                <View style={styles.fullscreenErrorContainer}>
                  <Ionicons name="document-outline" size={80} color="#999" />
                  <Text style={styles.fullscreenErrorText}>Cannot preview this file</Text>
                  <TouchableOpacity style={styles.openInBrowserButton} onPress={() => WebBrowser.openBrowserAsync(displayUrl)}>
                    <Text style={styles.openInBrowserText}>Open in Browser</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </Animated.View>
        <View style={styles.fileActionsBar}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDownloadAndShare}>
            <Ionicons name="download-outline" size={28} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDownloadAndShare}>
            <Ionicons name="share-outline" size={28} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => WebBrowser.openBrowserAsync(displayUrl)}>
            <Ionicons name="open-outline" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>
        {isDownloading && (
          <View style={styles.downloadOverlay}>
            <View style={styles.downloadBox}>
              <Ionicons name="download-outline" size={28} color="#007AFF" />
              <Text style={styles.downloadText}>Downloading...</Text>
            </View>
          </View>
        )}
      </Animated.View>
    </Modal>
  );

  return (
    <View style={[styles.container, isOwnMessage && styles.ownMessage]}>
      {type === 'IMAGE' && renderImage()}
      {type === 'VIDEO' && renderVideo()}
      {type === 'FILE' && renderFile()}
      {type === 'IMAGE' && renderFullscreenImage()}
      {type === 'VIDEO' && renderFullscreenVideo()}
      {type === 'FILE' && renderFileViewer()}
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
  fullscreenVideo: {
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
  pdfContainer: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: 'white',
  },
  openInBrowserButton: {
    marginTop: 16,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  openInBrowserText: {
    color: '#111',
    fontWeight: '600',
  },
  fileActionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 14,
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
