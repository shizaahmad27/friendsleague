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
import HamburgerMenu from '../components/HamburgerMenu';
import { leaguesApi, League } from '../services/leaguesApi';
import { eventsApi, EventItem } from '../services/eventsApi';

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
      {/* Modern Header with Gradient Background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{user?.username}!</Text>
          </View>
          <HamburgerMenu onLogout={confirmLogout} variant="light" />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions with Icons */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickRow}>
            <TouchableOpacity 
              style={[styles.quickCard, styles.quickCardPrimary]} 
              onPress={() => navigation.navigate('LeagueCreate')}
              activeOpacity={0.7}
            >
              <View style={styles.quickIconContainer}>
                <Ionicons name="trophy" size={28} color="#007AFF" />
              </View>
              <Text style={styles.quickTitle}>League</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickCard, styles.quickCardSecondary]} 
              onPress={() => navigation.navigate('EventCreate')}
              activeOpacity={0.7}
            >
              <View style={styles.quickIconContainer}>
                <Ionicons name="calendar" size={28} color="#34C759" />
              </View>
              <Text style={styles.quickTitle}>Event</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickCard, styles.quickCardTertiary]} 
              onPress={() => navigation.navigate('Messages')}
              activeOpacity={0.7}
            >
              <View style={styles.quickIconContainer}>
                <Ionicons name="chatbubbles" size={28} color="#FF9500" />
              </View>
              <Text style={styles.quickTitle}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Leagues */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="trophy-outline" size={22} color="#007AFF" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>My Leagues</Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Leagues')}
              activeOpacity={0.6}
            >
              <Text style={styles.link}>See all</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 12 }} />
              <Text style={styles.loadingText}>Loading leagues...</Text>
            </View>
          ) : recentLeagues.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No leagues yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first league to compete with friends</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('LeagueCreate')}
              >
                <Text style={styles.emptyStateButtonText}>Create League</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentLeagues.map(l => (
              <TouchableOpacity
                key={l.id}
                style={styles.itemCard}
                onPress={() => navigation.navigate('LeagueDetails', { leagueId: l.id })}
                activeOpacity={0.7}
              >
                <View style={styles.itemContent}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{l.name}</Text>
                    {!!l.description && (
                      <Text style={styles.itemSub} numberOfLines={1}>
                        {l.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.itemActions}>
                    {!l.isPrivate && (
                      <View style={[styles.badgePublic, { marginRight: 8 }]}>
                        <Text style={styles.badgeText}>Public</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Events */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="calendar-outline" size={22} color="#34C759" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Recent Events</Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Events')}
              activeOpacity={0.6}
            >
              <Text style={styles.link}>See all</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 12 }} />
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : recentEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No events yet</Text>
              <Text style={styles.emptyStateSubtext}>Create an event to start competing</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('EventCreate')}
              >
                <Text style={styles.emptyStateButtonText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentEvents.map(e => (
              <TouchableOpacity
                key={e.id}
                style={styles.itemCard}
                onPress={() => navigation.navigate('EventDetails', { eventId: e.id })}
                activeOpacity={0.7}
              >
                <View style={styles.itemContent}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{e.title}</Text>
                    {!!e.description && (
                      <Text style={styles.itemSub} numberOfLines={1}>
                        {e.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.itemActions}>
                    {e.leagueId ? (
                      <View style={[styles.badgeLink, { marginRight: 8 }]}>
                        <Text style={styles.badgeText}>League</Text>
                      </View>
                    ) : (
                      <View style={[styles.badgeMuted, { marginRight: 8 }]}>
                        <Text style={styles.badgeTextMuted}>Standalone</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Invite Friends */}
        <View style={styles.inviteCard}>
          <View style={styles.inviteContent}>
            <View style={styles.inviteIconContainer}>
              <Ionicons name="people" size={32} color="#fff" />
            </View>
            <View style={styles.inviteTextContainer}>
              <Text style={styles.inviteTitle}>Invite Friends</Text>
              <Text style={styles.inviteSubtext}>Grow your network and compete together</Text>
            </View>
            <TouchableOpacity 
              style={styles.inviteButton} 
              onPress={inviteFriends}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-forward" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats or What's Next */}
        {recentLeagues.length > 0 || recentEvents.length > 0 ? (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={20} color="#007AFF" style={{ marginRight: 12 }} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>What's next</Text>
                <Text style={styles.infoText}>
                  Check invitations, assign points, or create something new
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#007AFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 4,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickCardPrimary: {
    borderTopWidth: 3,
    borderTopColor: '#007AFF',
  },
  quickCardSecondary: {
    borderTopWidth: 3,
    borderTopColor: '#34C759',
  },
  quickCardTertiary: {
    borderTopWidth: 3,
    borderTopColor: '#FF9500',
  },
  quickIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickTitle: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
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
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  link: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 15,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  itemCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  itemSub: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgePublic: {
    backgroundColor: '#34C75922',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeLink: {
    backgroundColor: '#007AFF22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeMuted: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextMuted: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  inviteCard: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  inviteContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  inviteTextContainer: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  inviteSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  inviteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#e8f4fd',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
