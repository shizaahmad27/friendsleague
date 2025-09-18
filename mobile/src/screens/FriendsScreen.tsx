import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import HamburgerMenu from '../components/HamburgerMenu';
import { invitationApi, Invitation } from '../services/invitationApi';
import { usersApi, User } from '../services/usersApi';
import { useAuthStore } from '../store/authStore';

type FriendsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Friends'>;

export default function FriendsScreen() {
  const navigation = useNavigation<FriendsScreenNavigationProp>();
  const { user } = useAuthStore();
  
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  // State for invitations
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  
  // State for friends
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    // This will be handled by the parent component
    console.log('Logout from Friends screen');
  };

  // Search users by username
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a username to search');
      return;
    }

    setIsSearching(true);
    try {
      const results = await usersApi.searchUsers(searchQuery.trim());
      setSearchResults(results);
      setShowSearch(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to search users');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Send invitation to user
  const handleSendInvitation = async (userId: string, username: string) => {
    try {
      await invitationApi.createInvitation(userId);
      Alert.alert('Success', `Invitation sent to ${username}!`);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearch(false);
      // Refresh invitations after sending
      loadInvitations();
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation');
      console.error('Invitation error:', error);
    }
  };

  // Accept invitation
  const handleAcceptInvitation = async (invitationId: string, username: string) => {
    try {
      await invitationApi.acceptInvitation(invitationId);
      Alert.alert('Success', `You are now friends with ${username}!`);
      // Refresh both friends and invitations
      loadFriends();
      loadInvitations();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept invitation');
      console.error('Accept invitation error:', error);
    }
  };

  // Reject invitation
  const handleRejectInvitation = async (invitationId: string, username: string) => {
    try {
      await invitationApi.rejectInvitation(invitationId);
      Alert.alert('Success', `Invitation from ${username} rejected`);
      // Refresh invitations
      loadInvitations();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject invitation');
      console.error('Reject invitation error:', error);
    }
  };

  // Load invitations
  const loadInvitations = async () => {
    setIsLoadingInvitations(true);
    try {
      const data = await invitationApi.getInvitations();
      setInvitations(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load invitations');
      console.error('Load invitations error:', error);
    } finally {
      setIsLoadingInvitations(false);
    }
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
      await Promise.all([loadFriends(), loadInvitations()]);
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
      loadInvitations();
    }, [])
  );

  // Generate shareable link
  const handleGenerateLink = () => {
    if (!user) {
      Alert.alert('Error', 'User not found. Please try logging in again.');
      return;
    }

    const userId = user.id;
    const username = user.username;
    
    // For development/testing: Use Expo deep link format
    const expoDeepLink = `exp://192.168.1.100:8081/--/invite?ref=${userId}&inviter=${encodeURIComponent(username)}`;
    
    // For production: Use proper app store links with deep linking
    const appStoreLink = `https://apps.apple.com/app/friendsleague/id1234567890?invite=${userId}`;
    const playStoreLink = `https://play.google.com/store/apps/details?id=com.friendsleague.app&invite=${userId}`;
    
    // Create a universal link that works for both platforms
    const universalLink = `https://friendsleague.app/invite?ref=${userId}&inviter=${encodeURIComponent(username)}`;
    
    Alert.alert(
      'Invite Friends to FriendsLeague',
      `Share this information to invite friends:\n\nYour Username: ${username}\nYour Invite Code: ${userId.substring(0, 8).toUpperCase()}\n\nChoose how to share:`,
      [
        { 
          text: 'Copy Username & Code', 
          onPress: async () => {
            const shareText = `Join me on FriendsLeague! My username is ${username} and my invite code is ${userId.substring(0, 8).toUpperCase()}. Download the app and use this code to connect with me!`;
            await Clipboard.setStringAsync(shareText);
            Alert.alert('Success', 'Username and invite code copied to clipboard!');
          }
        },
        { 
          text: 'Copy Deep Link (Dev)', 
          onPress: async () => {
            await Clipboard.setStringAsync(expoDeepLink);
            Alert.alert('Success', 'Development deep link copied! (Only works in Expo Go)');
          }
        },
        { 
          text: 'Copy Universal Link', 
          onPress: async () => {
            await Clipboard.setStringAsync(universalLink);
            Alert.alert('Success', 'Universal link copied! (Works when app is published)');
          }
        },
        { text: 'Cancel' }
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <Text style={styles.subtitle}>Connect with your friends</Text>
        <HamburgerMenu onLogout={handleLogout} />
      </View>

      <View style={styles.content}>
        {/* Search Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔍 Find Friends</Text>
          <Text style={styles.cardDescription}>
            Search for friends by username
          </Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter username..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.searchButton} 
              onPress={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Results */}
          {showSearch && (
            <View style={styles.searchResults}>
              {searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <View key={user.id} style={styles.userItem}>
                    <View style={styles.userInfo}>
                      <Text style={styles.username}>{user.username}</Text>
                      <Text style={styles.userStatus}>
                        {user.isOnline ? '🟢 Online' : '⚫ Offline'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.inviteButton}
                      onPress={() => handleSendInvitation(user.id, user.username)}
                    >
                      <Text style={styles.inviteButtonText}>Invite</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.noResults}>No users found</Text>
              )}
            </View>
          )}
        </View>

        {/* My Friends Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 My Friends ({friends.length})</Text>
          <Text style={styles.cardDescription}>
            {friends.length === 0 
              ? "You haven't added any friends yet. Start building your network!"
              : "Your friends on FriendsLeague"
            }
          </Text>
          
          {isLoadingFriends ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading friends...</Text>
            </View>
          ) : friends.length > 0 ? (
            <View style={styles.friendsList}>
              {friends.map((friend) => (
                <View key={friend.id} style={styles.friendItem}>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendUsername}>{friend.username}</Text>
                    <Text style={styles.friendStatus}>
                      {friend.isOnline ? '🟢 Online' : '⚫ Offline'}
                    </Text>
                  </View>
                  <View style={styles.friendActions}>
                    <TouchableOpacity style={styles.messageButton}>
                      <Text style={styles.messageButtonText}>Message</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
          
      
        </View>

        {/* Invite Friends Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 Invite Friends</Text>
          <Text style={styles.cardDescription}>
            Invite friends to join FriendsLeague
          </Text>
          <TouchableOpacity 
            style={styles.cardButton}
            onPress={handleGenerateLink}
          >
            <Text style={styles.cardButtonText}>Generate Link</Text>
          </TouchableOpacity>
        </View>

        {/* Use Invite Code Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔗 Use Invite Code</Text>
          <Text style={styles.cardDescription}>
            Have a friend's invite code? Enter it here to connect with them.
          </Text>
          <TouchableOpacity 
            style={styles.cardButton}
            onPress={() => navigation.navigate('InviteCode')}
          >
            <Text style={styles.cardButtonText}>Enter Invite Code</Text>
          </TouchableOpacity>
        </View>

        {/* Invitations Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📨 Invitations ({invitations.length})</Text>
          <Text style={styles.cardDescription}>
            Manage your friend invitations
          </Text>
          
          {isLoadingInvitations ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading invitations...</Text>
            </View>
          ) : invitations.length > 0 ? (
            <View style={styles.invitationsList}>
              {invitations.map((invitation) => (
                <View key={invitation.id} style={styles.invitationItem}>
                  <View style={styles.invitationInfo}>
                    <Text style={styles.invitationUsername}>
                      {invitation.inviter?.username || 'Unknown User'}
                    </Text>
                    <Text style={styles.invitationStatus}>
                      Status: {invitation.status}
                    </Text>
                    <Text style={styles.invitationDate}>
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {invitation.status === 'PENDING' && invitation.inviteeId === user?.id && (
                    <View style={styles.invitationActions}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAcceptInvitation(invitation.id, invitation.inviter?.username || 'Unknown')}
                      >
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleRejectInvitation(invitation.id, invitation.inviter?.username || 'Unknown')}
                      >
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noInvitations}>No invitations found</Text>
          )}
          
          <TouchableOpacity 
            style={styles.cardButton}
            onPress={loadInvitations}
            disabled={isLoadingInvitations}
          >
            {isLoadingInvitations ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.cardButtonText}>Refresh Invitations</Text>
            )}
          </TouchableOpacity>
        </View>
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
  card: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  cardButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cardButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // New styles for search functionality
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  searchResults: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  inviteButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  // Friends list styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  friendsList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendInfo: {
    flex: 1,
  },
  friendUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  friendStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  messageButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  messageButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  // Invitations styles
  invitationsList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  invitationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  invitationInfo: {
    flex: 1,
  },
  invitationUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  invitationStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  invitationDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  noInvitations: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
