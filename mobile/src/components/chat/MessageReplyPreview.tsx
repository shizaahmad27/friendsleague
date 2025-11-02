import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../services/chatApi';

interface MessageReplyPreviewProps {
  replyTo: Message;
  onPress?: () => void;
  onClose?: () => void;
  isInHeader?: boolean;
}

export default function MessageReplyPreview({ 
  replyTo, 
  onPress, 
  onClose, 
  isInHeader = false 
}: MessageReplyPreviewProps) {
  const getMessagePreview = () => {
    if (replyTo.type === 'IMAGE') {
      return '📷 Photo';
    } else if (replyTo.type === 'VIDEO') {
      return '🎥 Video';
    } else if (replyTo.type === 'FILE') {
      return '📄 File';
    } else {
      return replyTo.content.length > 50 
        ? `${replyTo.content.substring(0, 50)}...` 
        : replyTo.content;
    }
  };

  const getIcon = () => {
    switch (replyTo.type) {
      case 'IMAGE':
        return 'image-outline';
      case 'VIDEO':
        return 'videocam-outline';
      case 'FILE':
        return 'document-outline';
      default:
        return 'chatbubble-outline';
    }
  };

  if (isInHeader) {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="arrow-undo" size={16} color="#007AFF" />
            <Text style={styles.headerText}>
              Replying to {replyTo.sender?.username || 'Unknown'}
            </Text>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerPreview}>
          <Ionicons name={getIcon() as any} size={14} color="#666" />
          <Text style={styles.headerPreviewText} numberOfLines={1}>
            {getMessagePreview()}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftBorder} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name={getIcon() as any} size={12} color="#666" />
          <Text style={styles.senderName}>
            {replyTo.sender?.username || 'Unknown'}
          </Text>
        </View>
        <Text style={styles.messageText} numberOfLines={2}>
          {getMessagePreview()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 8,
    marginHorizontal: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  leftBorder: {
    width: 3,
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 4,
  },
  messageText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  headerContainer: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  closeButton: {
    padding: 4,
  },
  headerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 22,
  },
  headerPreviewText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
});
