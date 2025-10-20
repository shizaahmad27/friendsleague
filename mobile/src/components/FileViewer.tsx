// mobile/src/components/FileViewer.tsx
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
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { MediaService } from '../services/mediaService';

interface FileViewerProps {
  fileUrl: string;
  fileName?: string;
  onClose: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onReact?: () => void;
  onReply?: () => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  fileUrl,
  fileName,
  onClose,
  onShare,
  onSave,
  onReact,
  onReply,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAndShare = async () => {
    try {
      setIsDownloading(true);
      const effectiveFileName = fileName || `file_${Date.now()}`;
      const localPath = `${FileSystem.documentDirectory}${effectiveFileName}`;
      const res = await FileSystem.downloadAsync(fileUrl, localPath, {
        cache: true,
      });
      if (res.status !== 200) {
        throw new Error('Download failed');
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri);
      } else {
        await WebBrowser.openBrowserAsync(fileUrl);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to download');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      const result = await MediaService.shareMedia(fileUrl);
      if (result.method === 'clipboard') {
        Alert.alert('Success', 'File URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share file:', error);
      Alert.alert('Error', 'Failed to share file');
    }
  };

  const getFileIcon = (name?: string) => {
    const n = (name || '').toLowerCase();
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

  const isPdf = fileName?.toLowerCase().endsWith('.pdf');

  return (
    <View style={styles.container}>
      {isPdf ? (
        <WebView
          source={{ uri: fileUrl }}
          startInLoadingState
          renderError={() => (
            <View style={styles.errorContainer}>
              <Ionicons name="document-outline" size={80} color="#999" />
              <Text style={styles.errorText}>Cannot preview this file</Text>
              <TouchableOpacity style={styles.openInBrowserButton} onPress={() => WebBrowser.openBrowserAsync(fileUrl)}>
                <Text style={styles.openInBrowserText}>Open in Browser</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <View style={styles.filePreviewContainer}>
          <Ionicons name={getFileIcon(fileName)} size={80} color="#007AFF" />
          <Text style={styles.fileName}>{fileName || 'Unknown file'}</Text>
          <Text style={styles.fileSubtext}>Tap to download or open</Text>
        </View>
      )}
      
      {/* Action Buttons Toolbar */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onShare || handleShare}
        >
          <Ionicons name="share-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleDownloadAndShare}
        >
          <Ionicons name="download-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => WebBrowser.openBrowserAsync(fileUrl)}
        >
          <Ionicons name="open-outline" size={28} color="#007AFF" />
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
      </View>

      {isDownloading && (
        <View style={styles.downloadOverlay}>
          <View style={styles.downloadBox}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.downloadText}>Downloading...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filePreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    width: '100%',
    height: '100%',
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
});
