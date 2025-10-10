import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAuthStore } from '../store/authStore';

interface Reaction {
  emoji: string;
  count: number;
  users: Array<{
    id: string;
    username: string;
    avatar?: string;
  }>;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onReactionPress: (emoji: string) => void;
  messageId: string;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onReactionPress,
  messageId,
}) => {
  const { user } = useAuthStore();

  if (!reactions || reactions.length === 0) {
    return null;
  }

  const renderReaction = (reaction: Reaction) => {
    const hasUserReacted = reaction.users.some(u => u.id === user?.id);
    
    return (
      <TouchableOpacity
        key={reaction.emoji}
        style={[
          styles.reactionButton,
          hasUserReacted && styles.reactionButtonActive,
        ]}
        onPress={() => onReactionPress(reaction.emoji)}
        activeOpacity={0.7}
      >
        <Text style={styles.emojiText}>{reaction.emoji}</Text>
        <Text style={[
          styles.countText,
          hasUserReacted && styles.countTextActive,
        ]}>
          {reaction.count}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {reactions.map(renderReaction)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 2,
    gap: 6,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  emojiText: {
    fontSize: 14,
    marginRight: 4,
  },
  countText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  countTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
