// mobile/src/components/ChatSettingsModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../services/chatApi';
import { MediaGalleryModal } from './MediaGalleryModal';
import { useSwipeToClose } from '../hooks/useSwipeToClose';
import { useVideoThumbnail } from '../hooks/useVideoThumbnail';

interface ChatSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  messages: Message[];
  onOpenGallery: (message: Message) => void;
}

export const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
  visible,
  onClose,
  messages,
  onOpenGallery,
}) => {
  const [showAllImages, setShowAllImages] = useState(false);
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState<Message | null>(null);

  // Swipe to close functionality for the main modal
  const { panY, modalOpacity, imageScale, panResponder } = useSwipeToClose({
    onClose,
    enabled: visible,
  });

  const handleOpenGallery = (message: Message) => {
    setFullscreenMessage(message);
  };

  const handleCloseGallery = () => {
    setFullscreenMessage(null);
  };

  // Component for video thumbnails
  const VideoThumbnail = ({ message }: { message: Message }) => {
    const { videoThumbnail, isLoading } = useVideoThumbnail(
      message.mediaUrl || '', 
      message.type as 'IMAGE' | 'VIDEO' | 'FILE'
    );
    
    return (
      <TouchableOpacity 
        key={message.id} 
        style={styles.mediaItem}
        onPress={() => handleOpenGallery(message)}
      >
        {videoThumbnail ? (
          <Image source={{ uri: videoThumbnail }} style={styles.mediaThumbnail} />
        ) : (
          <View style={styles.videoThumbnail}>
            {isLoading ? (
              <Ionicons name="hourglass-outline" size={20} color="white" />
            ) : (
              <Ionicons name="play-circle" size={30} color="white" />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.chatSettingsModal, 
            { 
              opacity: modalOpacity,
              transform: [{ translateY: panY }]
            }
          ]} 
          {...panResponder.panHandlers}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chat Settings</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mediaSections}>
            {/* Images Section */}
            <View style={styles.mediaSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Images</Text>
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setShowAllImages(!showAllImages)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllImages ? 'Show less' : 'Show more'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.mediaGrid}>
                {messages
                  .filter(msg => msg.type === 'IMAGE' && msg.mediaUrl)
                  .slice(0, showAllImages ? undefined : 6)
                  .map((msg, index) => (
                    <TouchableOpacity 
                      key={msg.id} 
                      style={styles.mediaItem}
                      onPress={() => handleOpenGallery(msg)}
                    >
                      <Image source={{ uri: msg.mediaUrl }} style={styles.mediaThumbnail} />
                    </TouchableOpacity>
                  ))}
              </View>
            </View>

            {/* Videos Section */}
            <View style={styles.mediaSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Videos</Text>
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setShowAllVideos(!showAllVideos)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllVideos ? 'Show less' : 'Show more'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.mediaGrid}>
                {messages
                  .filter(msg => msg.type === 'VIDEO' && msg.mediaUrl)
                  .slice(0, showAllVideos ? undefined : 6)
                  .map((msg, index) => (
                    <VideoThumbnail key={msg.id} message={msg} />
                  ))}
              </View>
            </View>

            {/* Files Section */}
            <View style={styles.mediaSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Files</Text>
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setShowAllFiles(!showAllFiles)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllFiles ? 'Show less' : 'Show more'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.filesList}>
                {messages
                  .filter(msg => msg.type === 'FILE' && msg.mediaUrl)
                  .slice(0, showAllFiles ? undefined : 5)
                  .map((msg, index) => (
                    <TouchableOpacity 
                      key={msg.id} 
                      style={styles.fileItem}
                      onPress={() => handleOpenGallery(msg)}
                    >
                      <View style={styles.fileIcon}>
                        <Ionicons name="document" size={20} color="#007AFF" />
                      </View>
                      <Text style={styles.fileName} numberOfLines={1}>
                        File {index + 1}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Media Gallery Modal */}
      <MediaGalleryModal
        visible={fullscreenMessage !== null}
        onClose={handleCloseGallery}
        message={fullscreenMessage}
        allMessages={messages}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatSettingsModal: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  mediaSections: {
    padding: 20,
  },
  mediaSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  showMoreButton: {
    padding: 4,
  },
  showMoreText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2c2c2e',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filesList: {
    gap: 10,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileName: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
});
