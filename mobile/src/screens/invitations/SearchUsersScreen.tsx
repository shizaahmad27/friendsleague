import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { invitationApi } from '../../services/invitationApi';
import { usersApi, User } from '../../services/usersApi';
import ScreenHeader from '../../components/layout/ScreenHeader';
import { theme } from '../../constants/colors';

type SearchUsersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SearchUsers'>;

export default function SearchUsersScreen() {
  const navigation = useNavigation<SearchUsersScreenNavigationProp>();
  const { user } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [invitingUsers, setInvitingUsers] = useState<Set<string>>(new Set());
  const [friends, setFriends] = useState<User[]>([]);
  const [matchedFriends, setMatchedFriends] = useState<User[]>([]);

  // Load friends and suggestions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFriends();
      if (searchQuery.trim().length < 2) {
        loadSuggestions();
      }
    }, [])
  );

  // Load friends
  const loadFriends = async () => {
    try {
      const data = await usersApi.getUserFriends();
      setFriends(data);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  // Load suggested users
  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const data = await usersApi.getSuggestedUsers(10);
      setSuggestions(data);
    } catch (error) {
      console.error('Load suggestions error:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Search users by username
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setMatchedFriends([]);
      if (searchQuery.trim().length < 2) {
        loadSuggestions();
      }
      return;
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setMatchedFriends([]);
      loadSuggestions();
      return;
    }

    setIsSearching(true);
    try {
      const results = await usersApi.searchUsers(searchQuery.trim());
      
      // Separate friends from non-friends
      const friendIds = friends.map(friend => friend.id);
      const filteredResults = results.filter(searchUser => 
        !friendIds.includes(searchUser.id) && searchUser.id !== user?.id
      );
      
      // Find friends that match the search
      const matched = friends.filter(friend => 
        friend.username.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
      
      setSearchResults(filteredResults);
      setMatchedFriends(matched);
      
      // If no search results, show suggestions
      if (filteredResults.length === 0 && matched.length === 0) {
        loadSuggestions();
      }
    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Send invitation to user
  const handleSendInvitation = async (userId: string, username: string) => {
    try {
      setInvitingUsers((prev) => new Set(prev).add(userId));
      await invitationApi.createInvitation(userId);
      Alert.alert('Success', `Invitation sent to ${username}!`);
      // Refresh after sending invitation
      loadFriends();
      if (searchQuery.trim().length < 2) {
        loadSuggestions();
      } else {
        handleSearch();
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send invitation'
      );
    } finally {
      setInvitingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const renderUserItem = ({ item, isFriend = false }: { item: User; isFriend?: boolean }) => {
    const isInviting = invitingUsers.has(item.id);
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => !isFriend && handleSendInvitation(item.id, item.username)}
        disabled={isInviting || isFriend}
      >
        <View style={styles.userAvatar}>
          {item.avatar ? (
            <Text style={styles.userAvatarText}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          ) : (
            <Text style={styles.userAvatarText}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          {item.mutualFriendsCount !== undefined && item.mutualFriendsCount > 0 ? (
            <Text style={styles.mutualFriendsText}>
              {item.mutualFriendsCount === 1 
                ? '1 mutual friend' 
                : `${item.mutualFriendsCount} mutual friends`}
            </Text>
          ) : item.mutualFriendsCount === 0 ? (
            <Text style={styles.mutualFriendsText}>You might know</Text>
          ) : (
            <View style={styles.statusContainer}>
              <View style={[styles.onlineIndicator, item.isOnline && styles.onlineIndicatorPulsing]} />
              <Text style={styles.userStatus}>
                {item.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          )}
        </View>
        {isFriend ? (
          <View style={styles.friendBadge}>
            <Ionicons name="checkmark-circle" size={20} color={theme.success} />
            <Text style={styles.friendBadgeText}>Friend</Text>
          </View>
        ) : isInviting ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => handleSendInvitation(item.id, item.username)}
          >
            <Text style={styles.inviteButtonText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={theme.borderSecondary} />
      <Text style={styles.emptyStateText}>No users found</Text>
      <Text style={styles.emptyStateSubtext}>Try searching with a different term</Text>
    </View>
  );

  const hasSearchQuery = searchQuery.trim().length >= 2;
  const showSuggestions = !hasSearchQuery || (searchResults.length === 0 && matchedFriends.length === 0);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Search Users" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={theme.secondaryText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={theme.placeholderText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            setSearchResults([]);
            setMatchedFriends([]);
            loadSuggestions();
          }}>
            <Ionicons name="close-circle" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        )}
        {isSearching && (
          <ActivityIndicator size="small" color={theme.primary} style={styles.searchLoader} />
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* My Friends Section (when searching) */}
        {hasSearchQuery && matchedFriends.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My friends</Text>
            </View>
            {matchedFriends.map((friend) => (
              <View key={friend.id}>
                {renderUserItem({ item: friend, isFriend: true })}
              </View>
            ))}
          </View>
        )}

        {/* Search Results Section */}
        {hasSearchQuery && (
          <View style={styles.section}>
            {matchedFriends.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Add friends</Text>
              </View>
            )}
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <View key={user.id}>
                  {renderUserItem({ item: user })}
                </View>
              ))
            ) : !isSearching && matchedFriends.length === 0 ? (
              renderEmptyState()
            ) : null}
          </View>
        )}

        {/* Suggested Users Section */}
        {showSuggestions && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Suggested users</Text>
            </View>
            
            {isLoadingSuggestions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.loadingText}>Loading suggestions...</Text>
              </View>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <View key={suggestion.id}>
                  {renderUserItem({ item: suggestion })}
                </View>
              ))
            ) : (
              <View style={styles.suggestionsEmptyState}>
                <Ionicons name="people-outline" size={48} color={theme.borderSecondary} />
                <Text style={styles.emptyStateText}>No suggestions available</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try connecting with more people to get personalized suggestions
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.primaryText,
  },
  searchLoader: {
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
  mutualFriendsText: {
    fontSize: 13,
    color: theme.secondaryText,
  },
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
  userStatus: {
    fontSize: 13,
    color: theme.secondaryText,
  },
  inviteButton: {
    backgroundColor: theme.warning,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteButtonText: {
    color: theme.primaryTextOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  friendBadgeText: {
    color: theme.success,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  suggestionsEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.secondaryText,
  },
});
