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
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import HamburgerMenu from '../components/HamburgerMenu';
import { leaguesApi, League } from '../services/leaguesApi';
import { eventsApi, EventItem } from '../services/eventsApi';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>FriendsLeague</Text>
            <Text style={styles.subtitle}>Welcome back, {user?.username}!</Text>
          </View>
          <HamburgerMenu onLogout={confirmLogout} />
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity 
            style={styles.quickCard} 
            onPress={() => navigation.navigate('LeagueCreate')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E8E']}
              style={styles.quickCardGradient}
            >
              <Ionicons name="trophy" size={28} color="white" />
              <Text style={styles.quickTitle}>Create League</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickCard} 
            onPress={() => navigation.navigate('EventCreate')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#4ECDC4', '#6EDDD6']}
              style={styles.quickCardGradient}
            >
              <Ionicons name="calendar" size={28} color="white" />
              <Text style={styles.quickTitle}>Create Event</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickCard} 
            onPress={() => navigation.navigate('Messages')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#45B7D1', '#6BC5D9']}
              style={styles.quickCardGradient}
            >
              <Ionicons name="chatbubbles" size={28} color="white" />
              <Text style={styles.quickTitle}>New Chat</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Leagues */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="trophy-outline" size={22} color="#667eea" />
              <Text style={styles.cardTitle}>My Leagues</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Leagues')} activeOpacity={0.7}>
              <Text style={styles.link}>See all →</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#667eea" />
              <Text style={styles.loadingText}> Loading...</Text>
            </View>
          ) : recentLeagues.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No leagues yet</Text>
              <Text style={styles.emptyStateSubtext}>Create one to get started!</Text>
            </View>
          ) : (
            recentLeagues.map(l => (
              <TouchableOpacity 
                key={l.id} 
                style={styles.itemRow}
                onPress={() => navigation.navigate('LeagueDetails', { leagueId: l.id })}
                activeOpacity={0.7}
              >
                <View style={styles.itemContent}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{l.name}</Text>
                    {!!l.description && <Text style={styles.itemSub} numberOfLines={1}>{l.description}</Text>}
                  </View>
                  <View style={styles.itemBadges}>
                    {!l.isPrivate && (
                      <View style={styles.badgePublic}>
                        <Ionicons name="globe-outline" size={12} color="#34C759" />
                        <Text style={styles.badgePublicText}>Public</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Events */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="calendar-outline" size={22} color="#4ECDC4" />
              <Text style={styles.cardTitle}>Recent Events</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Events')} activeOpacity={0.7}>
              <Text style={styles.link}>See all →</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#4ECDC4" />
              <Text style={styles.loadingText}> Loading...</Text>
            </View>
          ) : recentEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No events yet</Text>
              <Text style={styles.emptyStateSubtext}>Create one to get started!</Text>
            </View>
          ) : (
            recentEvents.map(e => (
              <TouchableOpacity 
                key={e.id} 
                style={styles.itemRow}
                onPress={() => navigation.navigate('EventDetails', { eventId: e.id })}
                activeOpacity={0.7}
              >
                <View style={styles.itemContent}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{e.title}</Text>
                    {!!e.description && <Text style={styles.itemSub} numberOfLines={1}>{e.description}</Text>}
                  </View>
                  <View style={styles.itemBadges}>
                    {e.leagueId ? (
                      <View style={styles.badgeLink}>
                        <Ionicons name="link-outline" size={12} color="#007AFF" />
                        <Text style={styles.badgeLinkText}>League</Text>
                      </View>
                    ) : (
                      <View style={styles.badgeMuted}>
                        <Text style={styles.badgeMutedText}>Standalone</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Invite Friends */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.inviteCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.inviteCardContent}>
            <Ionicons name="people" size={32} color="white" />
            <Text style={styles.inviteCardTitle}>Invite Friends</Text>
            <Text style={styles.inviteCardSubtext}>Grow your network and compete together</Text>
            <TouchableOpacity 
              style={styles.inviteButton} 
              onPress={inviteFriends}
              activeOpacity={0.8}
            >
              <Text style={styles.inviteButtonText}>Open Friends</Text>
              <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* What's Next */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What’s next</Text>
          <Text style={styles.muted}>Check invitations in Friends, assign points in your latest events, or create a new league.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: 'white', 
    textAlign: 'left',
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: 16, 
    color: 'rgba(255, 255, 255, 0.9)', 
    textAlign: 'left', 
    marginTop: 4,
  },

  content: { padding: 20, paddingBottom: 40 },
  quickRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 24,
    gap: 12,
  },
  quickCard: { 
    flex: 1, 
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickCardGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quickTitle: { 
    color: 'white', 
    fontWeight: '700', 
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },

  card: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  link: { 
    color: '#667eea', 
    fontWeight: '600',
    fontSize: 15,
  },
  cardTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  muted: { 
    color: '#777',
    fontSize: 15,
    lineHeight: 22,
  },
  loadingRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: { 
    marginLeft: 10, 
    color: '#666',
    fontSize: 15,
  },
  itemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: { 
    color: '#1a1a1a', 
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  itemSub: { 
    color: '#777', 
    fontSize: 13,
  },
  itemBadges: {
    flexDirection: 'row',
    gap: 6,
    marginRight: 8,
  },
  badgePublic: { 
    backgroundColor: '#E8F5E9', 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12,
    gap: 4,
  },
  badgePublicText: {
    color: '#34C759', 
    fontSize: 12,
    fontWeight: '600',
  },
  badgeLink: { 
    backgroundColor: '#E3F2FD', 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12,
    gap: 4,
  },
  badgeLinkText: {
    color: '#007AFF', 
    fontSize: 12,
    fontWeight: '600',
  },
  badgeMuted: { 
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12,
  },
  badgeMutedText: {
    color: '#666', 
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
  },
  inviteCard: {
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  inviteCardContent: {
    padding: 24,
    alignItems: 'center',
  },
  inviteCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  inviteCardSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  inviteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inviteButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
