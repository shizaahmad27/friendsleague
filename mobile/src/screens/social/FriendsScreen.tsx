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
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { invitationApi, Invitation } from '../../services/invitationApi';
import { usersApi, User } from '../../services/usersApi';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../constants/colors';
import ScreenHeader from '../../components/layout/ScreenHeader';

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
  const [invitationsCleared, setInvitationsCleared] = useState(false);
  
  // State for friends
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for suggestions
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Search users by username
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a username to search');
      return;
    }

    if (searchQuery.trim().length < 2) {
      Alert.alert('Error', 'Please enter at least 2 characters to search');
      return;
    }

    console.log('Searching for username:', searchQuery.trim());
    setIsSearching(true);
    try {
      const results = await usersApi.searchUsers(searchQuery.trim());
      console.log('Search results:', results);
      
      // Filter out current friends and self from search results
      const friendIds = friends.map(friend => friend.id);
      const filteredResults = results.filter(searchUser => 
        !friendIds.includes(searchUser.id) && searchUser.id !== user?.id
      );
      
      console.log('Filtered results (excluding friends):', filteredResults);
      setSearchResults(filteredResults);
      setShowSearch(true);
    } catch (error: any) {
      console.error('Search error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      Alert.alert('Error', 'Failed to search users');
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
    // Don't reload if invitations were manually cleared
    if (invitationsCleared) {
      return;
    }
    
    setIsLoadingInvitations(true);
    try {
      const data = await invitationApi.getInvitations();
      console.log('Loaded invitations:', data);
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
      setInvitationsCleared(false); // Reset cleared state on refresh
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
      loadSuggestions();
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

  // Handle choose from contacts
  const handleChooseFromContacts = () => {
    Alert.alert('Coming Soon', 'Contact integration will be available in a future update!');
  };

  // Handle use invite code
  const handleUseInviteCode = () => {
    navigation.navigate('InviteCode');
  };

  // Handle search by name
  const handleSearchByName = () => {
    // Navigate to search screen or show search inline
    setShowSearch(true);
  };

  // Load suggestions (placeholder for now)
  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      // TODO: Implement suggestions API when available
      // For now, return empty array
      setSuggestions([]);
    } catch (error) {
      console.error('Load suggestions error:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <ScreenHeader 
        title="Find your friends" 
        rightIcon="qr-code-outline"
        onRightIconPress={() => navigation.navigate('QRCode')}
      />

      <View style={styles.content}>
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleChooseFromContacts}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={24} color="#FFD700" />
            <Text style={styles.actionButtonText}>Choose from contacts</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleUseInviteCode}
            activeOpacity={0.7}
          >
            <Ionicons name="key-outline" size={24} color={theme.primary} />
            <Text style={styles.actionButtonText}>Use invite code</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSearchByName}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={24} color={theme.primary} />
            <Text style={styles.actionButtonText}>Search by name</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleGenerateLink}
            activeOpacity={0.7}
          >
            <Ionicons name="link-outline" size={24} color={theme.primary} />
            <Text style={styles.actionButtonText}>Share follow link</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Search Results (shown when searching) */}
        {showSearch && (
          <View style={styles.searchSection}>
            <View style={styles.searchHeader}>
              <Text style={styles.sectionTitle}>Search Users</Text>
              <TouchableOpacity 
                style={styles.closeSearchButton}
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearch(false);
                }}
              >
                <Ionicons name="close" size={20} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor={theme.placeholderText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity 
                style={[styles.searchButton, (isSearching || searchQuery.trim().length < 2) && styles.searchButtonDisabled]} 
                onPress={handleSearch}
                disabled={isSearching || searchQuery.trim().length < 2}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color={theme.primaryTextOnPrimary} />
                ) : (
                  <Ionicons name="search" size={20} color={theme.primaryTextOnPrimary} />
                )}
              </TouchableOpacity>
            </View>

            {searchResults.length > 0 ? (
              <View style={styles.searchResultsList}>
                {searchResults.map((user) => (
                  <View key={user.id} style={styles.userItem}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {user.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.username}>{user.username}</Text>
                      <View style={styles.statusContainer}>
                        <View style={[styles.onlineIndicator, user.isOnline && styles.onlineIndicatorPulsing]} />
                        <Text style={styles.userStatus}>
                          {user.isOnline ? 'Online' : 'Offline'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.inviteButton}
                      onPress={() => handleSendInvitation(user.id, user.username)}
                    >
                      <Text style={styles.inviteButtonText}>Invite</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : searchQuery.trim().length >= 2 && !isSearching ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={theme.borderSecondary} />
                <Text style={styles.emptyStateText}>No users found</Text>
                <Text style={styles.emptyStateSubtext}>Try searching with a different term</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Friend Invitations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friend invitations</Text>
          
          {isLoadingInvitations ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
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
                      {invitation.status === 'PENDING' 
                        ? 'Waiting for your response' 
                        : `Status: ${invitation.status}`
                      }
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
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={48} color={theme.borderSecondary} />
              <Text style={styles.emptyStateText}>No invitations</Text>
            </View>
          )}
        </View>

        {/* Friend Suggestions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friend suggestions</Text>
          
          {isLoadingSuggestions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={styles.loadingText}>Loading suggestions...</Text>
            </View>
          ) : suggestions.length > 0 ? (
            <View style={styles.suggestionsList}>
              {suggestions.map((suggestion) => (
                <View key={suggestion.id} style={styles.suggestionItem}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {suggestion.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>{suggestion.username}</Text>
                    <View style={styles.statusContainer}>
                      <View style={[styles.onlineIndicator, suggestion.isOnline && styles.onlineIndicatorPulsing]} />
                      <Text style={styles.userStatus}>
                        {suggestion.isOnline ? 'Online' : 'Offline'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={() => handleSendInvitation(suggestion.id, suggestion.username)}
                  >
                    <Text style={styles.inviteButtonText}>Invite</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={theme.borderSecondary} />
              <Text style={styles.emptyStateText}>No suggestions available</Text>
              <Text style={styles.emptyStateSubtext}>
                Try connecting with more people to get personalized suggestions
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Action buttons
  actionButtonsContainer: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.primaryText,
    marginLeft: 12,
  },
  // Sections
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 16,
  },
  // Search section
  searchSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeSearchButton: {
    padding: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.primaryText,
  },
  searchButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  searchButtonDisabled: {
    backgroundColor: theme.borderSecondary,
  },
  searchResultsList: {
    marginTop: 16,
  },
  // User items
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: theme.primaryTextOnPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primaryText,
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 13,
    color: theme.secondaryText,
  },
  inviteButton: {
    backgroundColor: theme.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteButtonText: {
    color: theme.primaryTextOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.secondaryText,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.tertiaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: theme.secondaryText,
    fontSize: 14,
  },
  // Invitations
  invitationsList: {
    marginTop: 8,
  },
  invitationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationUsername: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primaryText,
    marginBottom: 4,
  },
  invitationStatus: {
    fontSize: 13,
    color: theme.secondaryText,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: theme.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: theme.primaryTextOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: theme.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: theme.primaryTextOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Suggestions
  suggestionsList: {
    marginTop: 8,
  },
  // Status indicators
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.secondaryText,
  },
  onlineIndicatorPulsing: {
    backgroundColor: theme.success,
  },
});
