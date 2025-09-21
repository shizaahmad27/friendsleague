// mobile/src/screens/ChatListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { chatApi, Chat } from '../services/chatApi';
import socketService from '../services/socketService';

export default function ChatListScreen() {
  const navigation = useNavigation();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChats();
    socketService.connect();

    // Listen for new messages
    socketService.onNewMessage((message) => {
      // Update chat list when new message arrives
      loadChats();
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const loadChats = async () => {
    try {
      const data = await chatApi.getUserChats();
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const renderChat = ({ item }: { item: Chat }) => {
    const isGroupChat = item.type === 'GROUP';
    const otherParticipant = item.participants.find(p => p.user.id !== 'current-user-id');
    const displayName = isGroupChat ? item.name : otherParticipant?.user.username;
    const avatarText = isGroupChat ? item.name?.charAt(0).toUpperCase() : otherParticipant?.user.username.charAt(0).toUpperCase();
    const onlineCount = isGroupChat ? item.participants.filter(p => p.user.isOnline).length : (otherParticipant?.user.isOnline ? 1 : 0);
    
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => (navigation as any).navigate('Chat', { chatId: item.id })}    
        >
        <View style={[styles.avatar, isGroupChat && styles.groupAvatar]}>
          <Text style={styles.avatarText}>
            {avatarText}
          </Text>
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.username}>{displayName}</Text>
            {isGroupChat && (
              <Text style={styles.memberCount}>
                {item.participants.length} members
              </Text>
            )}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage?.content || 'No messages yet'}
          </Text>
        </View>
        <View style={styles.chatMeta}>
          <Text style={styles.timestamp}>
            {item.lastMessage ? new Date(item.lastMessage.createdAt).toLocaleTimeString() : ''}
          </Text>
          {onlineCount > 0 && (
            <View style={styles.onlineIndicator}>
              <Text style={styles.onlineCount}>{onlineCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity
          style={styles.createGroupButton}
          onPress={() => (navigation as any).navigate('CreateGroupChat')}
        >
          <Text style={styles.createGroupButtonText}>+ Group</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={chats}
        renderItem={renderChat}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation with a friend!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createGroupButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createGroupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  chatMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  onlineIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  groupAvatar: {
    backgroundColor: '#FF9500',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});