import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import HamburgerMenu from '../components/HamburgerMenu';
import { invitationApi, Invitation } from '../services/invitationApi';
import { usersApi, User } from '../services/usersApi';

export default function FriendsScreen() {
  const navigation = useNavigation();
  
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  // State for invitations
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);

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
      await invitationApi.createInvitation({ inviteeId: userId });
      Alert.alert('Success', `Invitation sent to ${username}!`);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearch(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation');
      console.error('Invitation error:', error);
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

  // Generate shareable link
  const handleGenerateLink = () => {
    // For now, we'll create a simple shareable link
    // In the future, this could be a proper invitation link
    const shareableLink = 'https://friendsleague.com/invite?ref=your-user-id';
    Alert.alert(
      'Shareable Link',
      `Share this link to invite friends:\n\n${shareableLink}`,
      [
        { 
          text: 'Copy Link', 
          onPress: () => {
            Clipboard.setString(shareableLink);
            Alert.alert('Success', 'Link copied to clipboard!');
          }
        },
        { text: 'OK' }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
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
          <Text style={styles.cardTitle}>👥 My Friends</Text>
          <Text style={styles.cardDescription}>
            You haven't added any friends yet. Start building your network!
          </Text>
          <TouchableOpacity 
            style={styles.cardButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Text style={styles.cardButtonText}>
              {showSearch ? 'Hide Search' : 'Add Friends'}
            </Text>
          </TouchableOpacity>
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

        {/* Invitations Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📨 Invitations</Text>
          <Text style={styles.cardDescription}>
            Manage your friend invitations
          </Text>
          <TouchableOpacity 
            style={styles.cardButton}
            onPress={loadInvitations}
            disabled={isLoadingInvitations}
          >
            {isLoadingInvitations ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.cardButtonText}>Load Invitations</Text>
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
});
