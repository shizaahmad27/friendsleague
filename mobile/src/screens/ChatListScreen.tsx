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
import { useAuthStore } from '../store/authStore';

export default function ChatListScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChats();
    socketService.connect();

    // Join user to their personal room for receiving updates
    if (user?.id) {
      socketService.joinUser(user.id);
    }

    // Listen for new messages
    socketService.onNewMessage((message) => {
      // Update chat list when new message arrives
      loadChats();
    });

    // Listen for new chats
    socketService.onNewChat((newChat) => {
      setChats(prevChats => {
        // Check if chat already exists
        const existingChat = prevChats.find(chat => chat.id === newChat.id);
        if (existingChat) {
          return prevChats;
        }
        // Add new chat to the beginning of the list
        return [newChat, ...prevChats];
      });
    });

    // Listen for unread count updates
    socketService.onUnreadCountUpdate((data) => {
      if (data.userId === user?.id) {
        // Update unread count in chat list
        loadChats(); // Refresh to get updated counts
      }
    });

    return () => {
      if (user?.id) {
        socketService.leaveUser(user.id);
      }
      socketService.disconnect();
    };
  }, [user?.id]);

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
    const otherParticipant = item.participants.find(p => p.user.id !== user?.id);
    const displayName = isGroupChat ? item.name : otherParticipant?.user.username;
    const avatarText = isGroupChat ? item.name?.charAt(0).toUpperCase() : otherParticipant?.user.username?.charAt(0).toUpperCase();
    const unreadCount = item.unreadCount || 0;
    const lastMessage: any = (item as any).lastMessage ?? (item as any).messages?.[0] ?? null;
    
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
            {lastMessage ? (
              lastMessage.content || 
              (lastMessage.type === 'IMAGE' ? '📷 Bilde' :
               lastMessage.type === 'VIDEO' ? '🎥 Video' :
               lastMessage.type === 'FILE' ? '📄 Fil' :
               lastMessage.type === 'VOICE' ? '🎤 Lydmelding' : 'Ingen meldinger ennå')
            ) : 'Ingen meldinger ennå'}
          </Text>
        </View>
        <View style={styles.chatMeta}>
          <Text style={styles.timestamp}>
            {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
          {unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : null}
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
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
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