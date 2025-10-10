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

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      await logout();
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
      <View style={styles.header}>
        <Text style={styles.title}>FriendsLeague</Text>
        <Text style={styles.subtitle}>Welcome back, {user?.username}!</Text>
        <HamburgerMenu onLogout={confirmLogout} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Quick Actions */}
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

        {/* What's Next */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What’s next</Text>
          <Text style={styles.muted}>Check invitations in Friends, assign points in your latest events, or create a new league.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 4 },

  content: { padding: 20, paddingBottom: 120 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  quickCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 12, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: '#f0f0f0' },
  quickIcon: { fontSize: 24, marginBottom: 8 },
  quickTitle: { color: '#333', fontWeight: '600' },

  card: { backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f0f0f0', elevation: 2 },
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

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: 'white' },
  logoutButton: { backgroundColor: '#FF3B30', paddingVertical: 16, borderRadius: 8 },
  logoutButtonText: { color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
