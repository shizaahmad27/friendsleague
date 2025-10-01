import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { RefreshControl, FlatList } from 'react-native';
import { eventsApi, EventItem } from '../services/eventsApi';
import { useNavigation } from '@react-navigation/native';
import HamburgerMenu from '../components/HamburgerMenu';
import { leaguesApi } from '../services/leaguesApi';

export default function EventsScreen() {
  const navigation = useNavigation();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | 'ALL'>('ALL');

  const leagueNameById = useMemo(() => {
    const map: Record<string, string> = {};
    leagues.forEach(l => { map[l.id] = l.name; });
    return map;
  }, [leagues]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ev, lg] = await Promise.all([
        eventsApi.getEvents(),
        leaguesApi.getLeagues().catch(() => []),
      ]);
      setEvents(ev);
      setLeagues((lg || []).map((l: any) => ({ id: l.id, name: l.name })));
    } catch (e) {
      console.error('Failed to load events', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredEvents = useMemo(() => {
    if (selectedLeagueId === 'ALL') return events;
    if (selectedLeagueId === 'STANDALONE') return events.filter(e => !e.leagueId);
    return events.filter(e => e.leagueId === selectedLeagueId);
  }, [events, selectedLeagueId]);

  const handleLogout = () => {
    console.log('Logout from Events screen');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>Organize and join events</Text>
        <HamburgerMenu onLogout={handleLogout} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.createFloating} onPress={() => (navigation as any).navigate('EventCreate')}>
          <Text style={styles.createFloatingText}>+ Create Event</Text>
        </TouchableOpacity>

        <View style={styles.filtersRow}>
          <TouchableOpacity style={[styles.chip, selectedLeagueId === 'ALL' && styles.chipActive]} onPress={() => setSelectedLeagueId('ALL')}>
            <Text style={[styles.chipText, selectedLeagueId === 'ALL' && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, selectedLeagueId === 'STANDALONE' && styles.chipActive]} onPress={() => setSelectedLeagueId('STANDALONE')}>
            <Text style={[styles.chipText, selectedLeagueId === 'STANDALONE' && styles.chipTextActive]}>Standalone</Text>
          </TouchableOpacity>
          {leagues.map(l => (
            <TouchableOpacity key={l.id} style={[styles.chip, selectedLeagueId === l.id && styles.chipActive]} onPress={() => setSelectedLeagueId(l.id)}>
              <Text style={[styles.chipText, selectedLeagueId === l.id && styles.chipTextActive]}>{l.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={!loading ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🎉 Upcoming Events</Text>
              <Text style={styles.cardDescription}>
                No events yet. Create an event to get started!
              </Text>
              <TouchableOpacity style={styles.cardButton} onPress={() => (navigation as any).navigate('EventCreate')}>
                <Text style={styles.cardButtonText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.leagueId ? (
                  <Text style={styles.badge}>{leagueNameById[item.leagueId] || 'League'}</Text>
                ) : (
                  <Text style={styles.badgeMuted}>Standalone</Text>
                )}
              </View>
              {!!item.description && (
                <Text style={styles.cardDescription}>{item.description}</Text>
              )}
              <TouchableOpacity style={styles.cardButton} onPress={() => (navigation as any).navigate('EventDetails', { eventId: item.id })}>
                <Text style={styles.cardButtonText}>Open</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </View>
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
  createFloating: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    zIndex: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  createFloatingText: { color: 'white', fontWeight: '700' },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#f0f0f0', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#007AFF22' },
  chipText: { color: '#444' },
  chipTextActive: { color: '#007AFF', fontWeight: '700' },
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
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { backgroundColor: '#007AFF22', color: '#007AFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
  badgeMuted: { backgroundColor: '#f0f0f0', color: '#666', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
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
});
