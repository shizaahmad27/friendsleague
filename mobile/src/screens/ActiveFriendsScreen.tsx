import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import HamburgerMenu from '../components/HamburgerMenu';
import { usersApi, User } from '../services/usersApi';
import { useAuthStore } from '../store/authStore';

type ActiveFriendsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActiveFriends'>;

export default function ActiveFriendsScreen() {
  const navigation = useNavigation<ActiveFriendsScreenNavigationProp>();
  const { user } = useAuthStore();
  
  // State for friends
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    console.log('Logout from ActiveFriends screen');
  };

  // Load friends
  const loadFriends = async () => {
    setIsLoadingFriends(true);
    try {
      const data = await usersApi.getUserFriends();
      setFriends(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load friends');
      console.error('Load friends error:', error);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadFriends();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadFriends();
    }, [])
  );

  const handleMessageFriend = (friend: User) => {
    // TODO: Navigate to chat with friend
    Alert.alert('Message', `Start a conversation with ${friend.username}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Message', onPress: () => {
        // Navigate to chat screen when implemented
        console.log('Navigate to chat with:', friend.username);
      }}
    ]);
  };

  const handleViewProfile = (friend: User) => {
    // TODO: Navigate to friend's profile
    Alert.alert('Profile', `View ${friend.username}'s profile`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'View Profile', onPress: () => {
        // Navigate to friend profile when implemented
        console.log('Navigate to profile of:', friend.username);
      }}
    ]);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Friends</Text>
        <Text style={styles.subtitle}>
          {friends.length === 0 
            ? "You haven't added any friends yet" 
            : `${friends.length} friend${friends.length !== 1 ? 's' : ''}`
          }
        </Text>
        <HamburgerMenu onLogout={handleLogout} />
      </View>

      <View style={styles.content}>
        {isLoadingFriends ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading friends...</Text>
          </View>
        ) : friends.length > 0 ? (
          <View style={styles.friendsList}>
            {friends.map((friend) => (
              <View key={friend.id} style={styles.friendItem}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>
                    {friend.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendUsername}>{friend.username}</Text>
                    <View style={styles.statusContainer}>
                      <View style={[styles.onlineIndicator, friend.isOnline && styles.onlineIndicatorPulsing]} />
                      <Text style={styles.friendStatus}>
                        {friend.isOnline ? 'Online' : 'Offline'}
                      </Text>
                    </View>
                  <Text style={styles.friendLastSeen}>
                    {friend.isOnline 
                      ? 'Active now' 
                      : `Last seen ${new Date(friend.lastSeen).toLocaleDateString()}`
                    }
                  </Text>
                </View>
                <View style={styles.friendActions}>
                  <TouchableOpacity
                    style={styles.messageButton}
                    onPress={() => handleMessageFriend(friend)}
                  >
                    <Text style={styles.messageButtonText}>Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => handleViewProfile(friend)}
                  >
                    <Text style={styles.profileButtonText}>Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Friends Yet</Text>
            <Text style={styles.emptyStateDescription}>
              Start building your network by inviting friends or using invite codes!
            </Text>
            <TouchableOpacity 
              style={styles.inviteButton}
              onPress={() => navigation.navigate('InviteCode')}
            >
              <Text style={styles.inviteButtonText}>Invite Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.discoverButton}
              onPress={() => navigation.navigate('Friends')}
            >
              <Text style={styles.discoverButtonText}>Discover Friends</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  friendsList: {
    gap: 12,
  },
  friendItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
  },
  friendUsername: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  friendStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  friendLastSeen: {
    fontSize: 12,
    color: '#999',
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  messageButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  messageButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  profileButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  profileButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  inviteButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  discoverButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  discoverButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Online status indicator styles
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginRight: 6,
  },
  onlineIndicatorPulsing: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
