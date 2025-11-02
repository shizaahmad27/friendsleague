import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Message } from '../../services/chatApi';

interface MessageStatusProps {
  message: Message;
  status: 'sent' | 'delivered' | 'read';
  isGroupChat: boolean;
  readByCount?: { read: number; total: number };
  readByUsers?: Array<{ username: string; avatar?: string }>;
  onPress?: () => void;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({
  message,
  status,
  isGroupChat,
  readByCount,
  readByUsers,
  onPress,
}) => {
  if (!message.senderId) return null;

  const renderStatus = () => {
    if (isGroupChat && readByCount && readByUsers) {
      if (readByCount.read === 0) {
        return <Text style={styles.statusText}>Delivered</Text>;
      }
      
      // If everyone has read it
      if (readByCount.read === readByCount.total) {
        return <Text style={styles.statusText}>Read by all</Text>;
      }
      
      // Show usernames who read it
      const usernames = readByUsers.map(user => user.username);
      
      // If too many users, show first few and "and X others"
      let displayText;
      if (usernames.length <= 2) {
        displayText = usernames.join(', ');
      } else {
        displayText = `${usernames.slice(0, 2).join(', ')} and ${usernames.length - 2} others`;
      }
      
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <Text style={styles.statusTextLink}>
            Read by {displayText}
          </Text>
        </TouchableOpacity>
      );
    }

    // Direct chat
    if (status === 'read') {
      // Find the read receipt for this message
      const readReceipt = message.readReceipts?.[0]; // Get the first (and only) read receipt
      if (readReceipt) {
        const readTime = new Date(readReceipt.readAt);
        const timeString = readTime.toLocaleTimeString([], { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        return <Text style={styles.statusText}>Read at {timeString}</Text>;
      }
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
