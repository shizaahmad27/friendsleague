// mobile/src/screens/StartDirectChatScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usersApi, User } from '../services/usersApi';
import { chatApi } from '../services/chatApi';
import { useAuthStore } from '../store/authStore';

export default function StartDirectChatScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setIsLoading(true);
      const friendsList = await usersApi.getUserFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Failed to load friends:', error);
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async (friend: User) => {
    try {
      setStartingChat(friend.id);
      
      // Check if a direct chat already exists with this friend
      const existingChats = await chatApi.getUserChats();
      const existingChat = existingChats.find(chat => 
        chat.type === 'DIRECT' && 
        chat.participants.some(p => p.user.id === friend.id)
      );

      if (existingChat) {
        // Navigate to existing chat
        (navigation as any).navigate('Chat', { chatId: existingChat.id });
      } else {
        // Create new direct chat
        const newChat = await chatApi.createDirectChat(friend.id);
        (navigation as any).navigate('Chat', { chatId: newChat.id });
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      Alert.alert('Error', 'Failed to start chat');
    } finally {
      setStartingChat(null);
    }
  };

  const renderFriend = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => handleStartChat(item)}
      disabled={startingChat === item.id}
    >
      <View style={styles.friendAvatar}>
        <Text style={styles.friendAvatarText}>
          {item.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.username}</Text>
        <Text style={styles.friendStatus}>
          {item.isOnline ? 'Active now' : `Last seen ${new Date(item.lastSeen).toLocaleDateString()}`}
        </Text>
      </View>
      {startingChat === item.id ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Start Chat</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptySubtext}>Add friends to start chatting!</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  listContainer: {
    padding: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  friendStatus: {
    fontSize: 14,
    color: '#666',
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
