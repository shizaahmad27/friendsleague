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
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { usersApi } from '../../services/usersApi';
import { leaguesApi, League } from '../../services/leaguesApi';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

type ProfileTab = 'Activity' | 'Achievements' | 'Leagues';

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<ProfileTab>('Activity');
  const [friendsCount, setFriendsCount] = useState(0);
  const [leaguesCount, setLeaguesCount] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);

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

  // Load leagues count and calculate total points
  const loadLeaguesData = async () => {
    setIsLoadingLeagues(true);
    setIsLoadingPoints(true);
    try {
      const leaguesData = await leaguesApi.getLeagues();
      setLeagues(leaguesData);
      setLeaguesCount(leaguesData.length);
      
      // Calculate total points across all leagues
      let pointsTotal = 0;
      for (const league of leaguesData) {
        try {
          const leaderboard = await leaguesApi.getLeaderboard(league.id);
          const userEntry = leaderboard.find(m => m.userId === user?.id);
          if (userEntry) {
            pointsTotal += userEntry.totalPoints;
          }
        } catch (error) {
          // Skip leagues where we can't get leaderboard
          console.error(`Failed to get points for league ${league.id}:`, error);
        }
      }
      setTotalPoints(pointsTotal);
    } catch (error) {
      console.error('Failed to load leagues data:', error);
      setLeaguesCount(0);
      setTotalPoints(0);
    } finally {
      setIsLoadingLeagues(false);
      setIsLoadingPoints(false);
    }
  };

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadFriendsCount();
      loadLeaguesData();
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
    Alert.alert('Edit Profile', 'Edit profile functionality coming soon!');
  };

  const handleShareProfile = () => {
    Alert.alert('Share Profile', 'Share profile functionality coming soon!');
  };

  const handleViewLeagues = () => {
    navigation.navigate('Leagues');
  };

  const handleViewFriends = () => {
    navigation.navigate('ActiveFriends');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Activity':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.emptyStateText}>No recent activity</Text>
            <Text style={styles.emptyStateSubtext}>Your activities will appear here</Text>
          </View>
        );
      case 'Achievements':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.emptyStateText}>No achievements yet</Text>
            <Text style={styles.emptyStateSubtext}>Unlock achievements as you participate in leagues and events</Text>
          </View>
        );
      case 'Leagues':
        return (
          <View style={styles.tabContent}>
            {isLoadingLeagues ? (
              <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
            ) : leagues.length === 0 ? (
              <>
                <Text style={styles.emptyStateText}>No leagues yet</Text>
                <Text style={styles.emptyStateSubtext}>Join or create a league to get started</Text>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={() => navigation.navigate('LeagueCreate')}
                >
                  <Text style={styles.primaryButtonText}>Create League</Text>
                </TouchableOpacity>
              </>
            ) : (
              <ScrollView>
                {leagues.map((league) => (
                  <TouchableOpacity
                    key={league.id}
                    style={styles.leagueCard}
                    onPress={() => navigation.navigate('LeagueDetails', { leagueId: league.id })}
                  >
                    <View style={styles.leagueCardContent}>
                      <Text style={styles.leagueCardTitle}>{league.name}</Text>
                      {league.description && (
                        <Text style={styles.leagueCardDescription} numberOfLines={2}>
                          {league.description}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                Alert.alert('Settings', 'Settings functionality coming soon!');
              }}
            >
              <Ionicons name="settings-outline" size={20} color="#333" style={styles.menuIcon} />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('PrivacySettings');
              }}
            >
              <Ionicons name="shield-outline" size={20} color="#333" style={styles.menuIcon} />
              <Text style={styles.menuItemText}>Privacy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                Alert.alert('Help & Support', 'Help & Support functionality coming soon!');
              }}
            >
              <Ionicons name="help-circle-outline" size={20} color="#333" style={styles.menuIcon} />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleLogout();
              }}
            >
              <Text style={styles.logoutMenuItemText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeaderBanner}>
          <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user?.avatar || 'https://via.placeholder.com/120' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraButton} onPress={handleEditProfile}>
              <Ionicons name="camera" size={16} color="#333" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.username}>{user?.username || 'User'}</Text>
          <Text style={styles.userHandle}>@{user?.username?.toLowerCase().replace(/\s+/g, '_') || 'user'}</Text>
          
          {/* Bio */}
          {user?.bio ? (
            <Text style={styles.bio}>{user.bio}</Text>
          ) : (
            <TouchableOpacity onPress={handleEditProfile}>
              <Text style={styles.bioPlaceholder}>Add a bio to tell people about yourself</Text>
            </TouchableOpacity>
          )}
          
          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShareProfile}>
              <Text style={styles.shareButtonText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={handleViewFriends}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>
              {isLoadingFriends ? '...' : friendsCount.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>FRIENDS</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={handleViewLeagues}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>
              {isLoadingLeagues ? '...' : leaguesCount}
            </Text>
            <Text style={styles.statLabel}>LEAGUES</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {isLoadingPoints ? '...' : totalPoints.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>POINTS</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Activity' && styles.activeTab]}
            onPress={() => setActiveTab('Activity')}
          >
            <Text style={[styles.tabText, activeTab === 'Activity' && styles.activeTabText]}>
              Activity
            </Text>
            {activeTab === 'Activity' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Achievements' && styles.activeTab]}
            onPress={() => setActiveTab('Achievements')}
          >
            <Text style={[styles.tabText, activeTab === 'Achievements' && styles.activeTabText]}>
              Achievements
            </Text>
            {activeTab === 'Achievements' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Leagues' && styles.activeTab]}
            onPress={() => setActiveTab('Leagues')}
          >
            <Text style={[styles.tabText, activeTab === 'Leagues' && styles.activeTabText]}>
              Leagues
            </Text>
            {activeTab === 'Leagues' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 6,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
  },
  logoutMenuItemText: {
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '600',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileHeaderBanner: {
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#f0f0f0',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 20,
  },
  bioPlaceholder: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  shareButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // Active tab styling handled by text and indicator
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#007AFF',
  },
  tabContent: {
    minHeight: 200,
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  loader: {
    marginVertical: 40,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  leagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  leagueCardContent: {
    flex: 1,
    marginRight: 12,
  },
  leagueCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  leagueCardDescription: {
    fontSize: 13,
    color: '#666',
  },
});
