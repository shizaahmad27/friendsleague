// mobile/src/components/OnlineStatusIndicator.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  lastSeen?: string;
  showLastSeen?: boolean;
  style?: any;
}

export const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
  isOnline,
  lastSeen,
  showLastSeen = true,
  style,
}) => {
  const formatLastSeen = (timestamp: string): string => {
    const now = new Date();
    const lastSeenDate = new Date(timestamp);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return lastSeenDate.toLocaleDateString();
    }
  };

  if (isOnline) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.onlineDot} />
        <Text style={styles.onlineText}>Active now</Text>
      </View>
    );
  }

  if (showLastSeen && lastSeen) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.lastSeenText}>
          Last seen {formatLastSeen(lastSeen)}
        </Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759', // Green color for online status
    marginRight: 6,
  },
  onlineText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  lastSeenText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
