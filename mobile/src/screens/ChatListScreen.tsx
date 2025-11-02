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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatListScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChats();
    socketService.connect();

    // Socket connection and user room joining is handled globally by useOnlineStatus hook
    // No need to manually manage user rooms here

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
    
    const getMessageIcon = (type: string) => {
      switch (type) {
        case 'IMAGE': return 'image-outline';
        case 'VIDEO': return 'videocam-outline';
        case 'FILE': return 'document-outline';
        case 'VOICE': return 'mic-outline';
        default: return null;
      }
    };

    const messageIcon = lastMessage?.type ? getMessageIcon(lastMessage.type) : null;
    
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => (navigation as any).navigate('Chat', { chatId: item.id })}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isGroupChat ? ['#FF9500', '#FFB84D'] : ['#667eea', '#764ba2']}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>
            {avatarText || '?'}
          </Text>
        </LinearGradient>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.username} numberOfLines={1}>{displayName || 'Unknown'}</Text>
            {isGroupChat && (
              <View style={styles.memberCountContainer}>
                <Ionicons name="people" size={12} color="#666" />
                <Text style={styles.memberCount}>
                  {item.participants.length}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.lastMessageContainer}>
            {messageIcon && (
              <Ionicons name={messageIcon} size={14} color="#999" style={styles.messageIcon} />
            )}
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage ? (
                lastMessage.content || 
                (lastMessage.type === 'IMAGE' ? 'Photo' :
                 lastMessage.type === 'VIDEO' ? 'Video' :
                 lastMessage.type === 'FILE' ? 'File' :
                 lastMessage.type === 'VOICE' ? 'Voice message' : 'No messages yet')
              ) : 'No messages yet'}
            </Text>
          </View>
        </View>
        <View style={styles.chatMeta}>
          <Text style={styles.timestamp}>
            {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.createDirectButton}
              onPress={() => (navigation as any).navigate('StartDirectChat')}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={18} color="white" />
              <Text style={styles.createDirectButtonText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createGroupButton}
              onPress={() => (navigation as any).navigate('CreateGroupChat')}
              activeOpacity={0.8}
            >
              <Ionicons name="people" size={18} color="white" />
              <Text style={styles.createGroupButtonText}>Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      <FlatList
        data={chats}
        renderItem={renderChat}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
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
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  createDirectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  createDirectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  createGroupButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  createGroupButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  username: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  memberCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIcon: {
    marginRight: 6,
  },
  lastMessage: {
    fontSize: 14,
    color: '#777',
    flex: 1,
  },
  chatMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 60,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
    fontWeight: '500',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
  },
});