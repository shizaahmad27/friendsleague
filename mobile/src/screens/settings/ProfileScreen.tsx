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
  Share,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { usersApi } from '../../services/usersApi';
import { leaguesApi, League } from '../../services/leaguesApi';
import { invitationApi } from '../../services/invitationApi';
import { theme } from '../../constants/colors';
import ScreenHeader from '../../components/layout/ScreenHeader';
import * as Clipboard from 'expo-clipboard';

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
  const [inviteCode, setInviteCode] = useState<string>('');
  const [isLoadingInviteCode, setIsLoadingInviteCode] = useState(false);

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

  // Load invite code
  const loadInviteCode = async () => {
    if (!user) return;
    
    setIsLoadingInviteCode(true);
    try {
      const result = await invitationApi.getMyInviteCode();
      setInviteCode(result.code);
    } catch (error) {
      console.error('Failed to load invite code:', error);
      setInviteCode('');
    } finally {
      setIsLoadingInviteCode(false);
    }
  };

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadFriendsCount();
      loadLeaguesData();
      loadInviteCode();
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
    navigation.navigate('EditProfile');
  };

  const handleShareProfile = async () => {
    if (!user) return;

    try {
      const username = user.username || 'User';
      const userHandle = `@${username.toLowerCase().replace(/\s+/g, '_')}`;
      
      // Create shareable message similar to Instagram
      const message = `Check out ${username}'s profile on FriendsLeague!\n\n${userHandle}${user.bio ? `\n\n${user.bio}` : ''}\n\nDownload FriendsLeague to connect!`;
      
      // For now, we'll share the username and message
      // If you add deep linking later, you can include: `https://friendleague.onrender.com/profile/${user.id}`
      
      const result = await Share.share({
        message: message,
        title: `Share ${username}'s Profile`,
      }, {
        // Android only
        dialogTitle: `Share ${username}'s Profile`,
      });

      if (result.action === Share.sharedAction) {
        // User shared successfully (optional - we don't need to show alert per cursor rules)
      } else if (result.action === Share.dismissedAction) {
        // User dismissed the share sheet (no action needed)
      }
    } catch (error: any) {
      console.error('Error sharing profile:', error);
      Alert.alert('Error', 'Failed to share profile. Please try again.');
    }
  };

  const handleViewLeagues = () => {
    navigation.navigate('Leagues');
  };

  const handleViewFriends = () => {
    navigation.navigate('ActiveFriends');
  };

  const handleCopyInviteCode = async () => {
    if (!inviteCode || isLoadingInviteCode) return;
    
    try {
      await Clipboard.setStringAsync(inviteCode);
      // Success - no alert per cursor rules
    } catch (error) {
      Alert.alert('Error', 'Failed to copy invite code');
      console.error('Copy error:', error);
    }
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
      <ScreenHeader 
        title="Profile" 
        showMenu={true}
        onMenuPress={() => setMenuVisible(true)}
      />

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
                navigation.navigate('HelpSupport');
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
          
          <Text style={styles.username}>
            {user?.username || 'User'} <Text style={styles.userHandle}>(@{user?.username?.toLowerCase().replace(/\s+/g, '_') || 'user'})</Text>
          </Text>
          
          {/* Invite Code */}
          {user && (
            <TouchableOpacity 
              style={styles.inviteCodeContainer}
              onPress={handleCopyInviteCode}
              activeOpacity={0.7}
              disabled={isLoadingInviteCode || !inviteCode}
            >
              <Ionicons name="ticket-outline" size={14} color={theme.secondaryText} />
              <Text style={styles.inviteCodeLabel}>Invite Code:</Text>
              <Text style={styles.inviteCode}>
                {isLoadingInviteCode ? 'Loading...' : inviteCode || 'N/A'}
              </Text>
              {!isLoadingInviteCode && inviteCode && (
                <Ionicons name="copy-outline" size={14} color={theme.secondaryText} />
              )}
            </TouchableOpacity>
          )}
          
          {/* Contact Info */}
          {(user?.email || user?.phoneNumber) && (
            <View style={styles.contactInfo}>
              {user?.email && (
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={14} color="#666" />
                  <Text style={styles.contactText}>{user.email}</Text>
                </View>
              )}
              {user?.email && user?.phoneNumber && (
                <Text style={styles.contactSeparator}>•</Text>
              )}
              {user?.phoneNumber && (
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={14} color="#666" />
                  <Text style={styles.contactText}>{user.phoneNumber}</Text>
                </View>
              )}
            </View>
          )}
          
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
    backgroundColor: theme.background,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: theme.background,
    borderRadius: 12,
    minWidth: 200,
    shadowColor: theme.shadow,
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
    borderBottomColor: theme.border,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: theme.primaryText,
    flex: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 4,
  },
  logoutMenuItemText: {
    fontSize: 15,
    color: theme.error,
    fontWeight: '600',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileHeaderBanner: {
    backgroundColor: theme.backgroundSecondary,
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
    borderColor: theme.border,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primaryText,
    marginBottom: 8,
  },
  userHandle: {
    fontSize: 16,
    color: theme.secondaryText,
    fontWeight: 'normal',
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.backgroundTertiary,
    borderRadius: 16,
    alignSelf: 'center',
    gap: 6,
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: theme.secondaryText,
    fontWeight: '500',
  },
  inviteCode: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 13,
    color: theme.secondaryText,
    marginLeft: 4,
  },
  contactSeparator: {
    fontSize: 13,
    color: theme.secondaryText,
    marginHorizontal: 8,
  },
  bio: {
    fontSize: 14,
    color: theme.secondaryText,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 20,
  },
  bioPlaceholder: {
    fontSize: 14,
    color: theme.tertiaryText,
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
    backgroundColor: theme.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: theme.primaryTextOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    backgroundColor: theme.background,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: theme.borderSecondary,
  },
  shareButtonText: {
    color: theme.primaryText,
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
    borderColor: theme.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primaryText,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: theme.secondaryText,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.border,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
    color: theme.tertiaryText,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.primary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.primary,
  },
  tabContent: {
    minHeight: 200,
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryText,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: theme.secondaryText,
    textAlign: 'center',
    marginBottom: 24,
  },
  loader: {
    marginVertical: 40,
  },
  primaryButton: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'center',
  },
  primaryButtonText: {
    color: theme.primaryTextOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  leagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundTertiary,
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
    color: theme.primaryText,
    marginBottom: 4,
  },
  leagueCardDescription: {
    fontSize: 13,
    color: theme.secondaryText,
  },
});
