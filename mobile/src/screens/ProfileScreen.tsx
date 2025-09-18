import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../services/usersApi';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuthStore();
  
  // State for friends count
  const [friendsCount, setFriendsCount] = useState(0);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Load friends count
  const loadFriendsCount = async () => {
    if (!user) return;
    
    setIsLoadingFriends(true);
    try {
      const friends = await usersApi.getUserFriends();
      setFriendsCount(friends.length);
    } catch (error) {
      console.error('Failed to load friends count:', error);
      setFriendsCount(0);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  // Load friends count when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadFriendsCount();
    }, [user])
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ]
    );
  };

  const handleEditProfile = () => {
    // TODO: Navigate to edit profile screen
    Alert.alert('Edit Profile', 'Edit profile functionality coming soon!');
  };

  const handleViewLeagues = () => {
    navigation.navigate('Leagues');
  };

  const handleViewFriends = () => {
    navigation.navigate('ActiveFriends');
  };

  const handleInviteFriends = () => {
    navigation.navigate('InviteCode');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user?.avatar || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
        </View>
        <Text style={styles.username}>{user?.username || 'User'}</Text>
        <Text style={styles.email}>{user?.email || 'No email'}</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Leagues</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleViewLeagues}>
            <Text style={styles.actionButtonText}>View All Leagues</Text>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>
          <Text style={styles.sectionSubtext}>You're currently in 0 leagues</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleViewFriends}>
            <Text style={styles.actionButtonText}>View All Friends</Text>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>
          <Text style={styles.sectionSubtext}>
            {isLoadingFriends ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#666" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              `You have ${friendsCount} friend${friendsCount !== 1 ? 's' : ''}`
            )}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Friends</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleInviteFriends}>
            <Text style={styles.actionButtonText}>Invite New Friends</Text>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>
          <Text style={styles.sectionSubtext}>Share FriendsLeague with your friends</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Notifications</Text>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Privacy</Text>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>About</Text>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
  },
  actionButtonArrow: {
    fontSize: 20,
    color: '#999',
  },
  sectionSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
});
