import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import StoriesSection from '../components/StoriesSection';
import { leaguesApi, League } from '../services/leaguesApi';
import { eventsApi, EventItem } from '../services/eventsApi';
import { Story } from '../types';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  // Mock stories data
  const mockStories: Story[] = useMemo(() => [
    {
      id: 'own-story',
      userId: user?.id || '',
      username: user?.username || 'You',
      isOwnStory: true,
      hasNewStory: false,
    },
    {
      id: 'story-1',
      userId: 'user-1',
      username: 'Emma',
      hasNewStory: true,
      isOwnStory: false,
    },
    {
      id: 'story-2',
      userId: 'user-2',
      username: 'Alex',
      hasNewStory: true,
      isOwnStory: false,
    },
    {
      id: 'story-3',
      userId: 'user-3',
      username: 'Sarah',
      hasNewStory: false,
      isOwnStory: false,
    },
    {
      id: 'story-4',
      userId: 'user-4',
      username: 'Mike',
      hasNewStory: true,
      isOwnStory: false,
    },
  ], [user?.id, user?.username]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
    } catch (error) {
      console.error('Logout error:', error);
      logout();
    }
  };

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: handleLogout },
    ]);
  };

  const inviteFriends = () => {
    navigation.navigate('Friends');
  };

  const load = async () => {
    setLoading(true);
    try {
      const [ls, es] = await Promise.all([
        leaguesApi.getLeagues().catch(() => []),
        eventsApi.getEvents().catch(() => []),
      ]);
      setLeagues(ls || []);
      setEvents(es || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const recentLeagues = useMemo(() => leagues.slice(0, 3), [leagues]);
  const recentEvents = useMemo(() => events.slice(0, 3), [events]);

  const handleAddStory = () => {
    // Placeholder for future story creation feature
    Alert.alert('Coming Soon', 'Story creation feature will be available soon!');
  };

  const handleStoryPress = (story: Story) => {
    // Placeholder for future story viewing feature
    Alert.alert('Story', `Viewing ${story.username}'s story`);
  };

  const handleNotificationPress = () => {
    // Placeholder for future notifications feature
    Alert.alert('Coming Soon', 'Notifications feature will be available soon!');
  };

  const handleSearchPress = () => {
    // Placeholder for future search feature
    Alert.alert('Coming Soon', 'Search feature will be available soon!');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="flash" size={24} color="#007AFF" />
          </View>
          <Text style={styles.appTitle}>FriendsLeague</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.headerIcon, { marginRight: 12 }]} 
            onPress={handleSearchPress}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIcon} 
            onPress={handleNotificationPress}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stories Section */}
        <StoriesSection
          stories={mockStories}
          onStoryPress={handleStoryPress}
          onAddStoryPress={handleAddStory}
        />
        {/* Quick Actions */}
        <View style={styles.quickRowContainer}>
          <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('LeagueCreate')}>
            <Text style={styles.quickIcon}>🏆</Text>
            <Text style={styles.quickTitle}>Create League</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('EventCreate')}>
            <Text style={styles.quickIcon}>📅</Text>
            <Text style={styles.quickTitle}>Create Event</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Messages')}>
            <Text style={styles.quickIcon}>💬</Text>
            <Text style={styles.quickTitle}>New Chat</Text>
          </TouchableOpacity>
          </View>
        </View>

        {/* Recent Leagues */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>My Leagues</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Leagues')}>
              <Text style={styles.link}>See all</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingRow}><ActivityIndicator /><Text style={styles.loadingText}> Loading...</Text></View>
          ) : recentLeagues.length === 0 ? (
            <Text style={styles.muted}>No leagues yet. Create one to get started.</Text>
          ) : (
            recentLeagues.map(l => (
              <View key={l.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{l.name}</Text>
                  {!!l.description && <Text style={styles.itemSub}>{l.description}</Text>}
                </View>
                {!l.isPrivate && <Text style={styles.badgePublic}>Public</Text>}
                <TouchableOpacity style={styles.smallButton} onPress={() => navigation.navigate('LeagueDetails', { leagueId: l.id })}>
                  <Text style={styles.smallButtonText}>Open</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Recent Events */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Recent Events</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Events')}>
              <Text style={styles.link}>See all</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingRow}><ActivityIndicator /><Text style={styles.loadingText}> Loading...</Text></View>
          ) : recentEvents.length === 0 ? (
            <Text style={styles.muted}>No events yet. Create one to get started.</Text>
          ) : (
            recentEvents.map(e => (
              <View key={e.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{e.title}</Text>
                  {!!e.description && <Text style={styles.itemSub}>{e.description}</Text>}
                </View>
                {e.leagueId ? (
                  <Text style={styles.badgeLink}>League</Text>
                ) : (
                  <Text style={styles.badgeMuted}>Standalone</Text>
                )}
                <TouchableOpacity style={styles.smallButton} onPress={() => navigation.navigate('EventDetails', { eventId: e.id })}>
                  <Text style={styles.smallButtonText}>Open</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Invite Friends */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Invite Friends</Text>
          </View>
          <Text style={styles.muted}>Grow your network and compete together.</Text>
          <TouchableOpacity style={styles.cardButton} onPress={inviteFriends}>
            <Text style={styles.cardButtonText}>Open Friends</Text>
          </TouchableOpacity>
        </View>

    
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  content: { paddingBottom: 120 },
  quickRowContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  quickCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 12, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: '#f0f0f0' },
  quickIcon: { fontSize: 24, marginBottom: 8 },
  quickTitle: { color: '#333', fontWeight: '600' },

  card: { backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 16, marginHorizontal: 20, borderWidth: 1, borderColor: '#f0f0f0', elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  link: { color: '#007AFF', fontWeight: '700' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  muted: { color: '#777' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  loadingText: { marginLeft: 6, color: '#666' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  itemTitle: { color: '#333', fontWeight: '600' },
  itemSub: { color: '#666', fontSize: 12 },
  smallButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginLeft: 8 },
  smallButtonText: { color: 'white', fontWeight: '700' },
  badgePublic: { backgroundColor: '#34C75922', color: '#34C759', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, overflow: 'hidden', marginRight: 8 },
  badgeLink: { backgroundColor: '#007AFF22', color: '#007AFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, overflow: 'hidden', marginRight: 8 },
  badgeMuted: { backgroundColor: '#f0f0f0', color: '#666', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, overflow: 'hidden', marginRight: 8 },

  cardButton: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'flex-start', marginTop: 12 },
  cardButtonText: { color: 'white', fontWeight: '700' },
});
