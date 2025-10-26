import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Message } from '../services/chatApi';

interface MessageStatusProps {
  message: Message;
  status: 'sent' | 'delivered' | 'read';
  isGroupChat: boolean;
  readByCount?: { read: number; total: number };
  onPress?: () => void;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({
  message,
  status,
  isGroupChat,
  readByCount,
  onPress,
}) => {
  if (!message.senderId) return null;

  const renderStatus = () => {
    if (isGroupChat && readByCount) {
      if (readByCount.read === 0) {
        return <Text style={styles.statusText}>Delivered</Text>;
      }
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <Text style={styles.statusTextLink}>
            Read by {readByCount.read} of {readByCount.total}
          </Text>
        </TouchableOpacity>
      );
    }

    // Direct chat
    if (status === 'read') {
      return <Text style={styles.statusText}>Read</Text>;
    }
    if (status === 'delivered') {
      return <Text style={styles.statusText}>Delivered</Text>;
    }
    return null;
  };

  return <View style={styles.container}>{renderStatus()}</View>;
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  statusText: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  statusTextLink: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.7)',
    textDecorationLine: 'underline',
  },
});
