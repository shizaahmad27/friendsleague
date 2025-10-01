import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { RefreshControl, FlatList } from 'react-native';
import { leaguesApi, League } from '../services/leaguesApi';
import { useNavigation } from '@react-navigation/native';
import HamburgerMenu from '../components/HamburgerMenu';

export default function LeaguesScreen() {
  const navigation = useNavigation();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<'ALL' | 'MY' | 'PUBLIC'>('ALL');

  const loadLeagues = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leaguesApi.getLeagues();
      setLeagues(data);
    } catch (e) {
      console.error('Failed to load leagues', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLeagues();
  }, [loadLeagues]);

  const filteredLeagues = useMemo(() => {
    if (filter === 'PUBLIC') return leagues.filter(l => !l.isPrivate);
    // 'MY' assumes getLeagues already returns only leagues the user is in
    return leagues;
  }, [leagues, filter]);

  const handleLogout = () => {
    // This will be handled by the parent component
    console.log('Logout from Leagues screen');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leagues</Text>
        <Text style={styles.subtitle}>Manage your competitive leagues</Text>
        <HamburgerMenu onLogout={handleLogout} />
      </View>

      <View style={styles.content}>
        {filter === 'PUBLIC' && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Browsing public leagues. Tap a card to view details and join.</Text>
          </View>
        )}
        <View style={styles.filtersRow}>
          <TouchableOpacity style={[styles.chip, filter === 'ALL' && styles.chipActive]} onPress={() => setFilter('ALL')}>
            <Text style={[styles.chipText, filter === 'ALL' && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, filter === 'MY' && styles.chipActive]} onPress={() => setFilter('MY')}>
            <Text style={[styles.chipText, filter === 'MY' && styles.chipTextActive]}>My</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, filter === 'PUBLIC' && styles.chipActive]} onPress={() => setFilter('PUBLIC')}>
            <Text style={[styles.chipText, filter === 'PUBLIC' && styles.chipTextActive]}>Public</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={filteredLeagues}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadLeagues(); }} />}
          ListEmptyComponent={!loading ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🏆 My Leagues</Text>
              <Text style={styles.cardDescription}>
                You haven't joined any leagues yet. Create or join a league to get started!
              </Text>
            </View>
          ) : null}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {!item.isPrivate && <Text style={styles.badgePublic}>Public</Text>}
              </View>
              {!!item.description && (
                <Text style={styles.cardDescription}>{item.description}</Text>
              )}
              <TouchableOpacity style={styles.cardButton} onPress={() => (navigation as any).navigate('LeagueDetails', { leagueId: item.id })}>
                <Text style={styles.cardButtonText}>Open</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.bottomCreateButton} 
            onPress={() => (navigation as any).navigate('LeagueCreate')}
          >
            <Text style={styles.bottomCreateButtonText}>+ Create League</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 96,
  },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  banner: { backgroundColor: '#007AFF11', borderColor: '#007AFF22', borderWidth: 1, padding: 12, borderRadius: 12, marginBottom: 12 },
  bannerText: { color: '#007AFF', fontWeight: '600' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#f0f0f0', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#007AFF22' },
  chipText: { color: '#444' },
  chipTextActive: { color: '#007AFF', fontWeight: '700' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  bottomCreateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  bottomCreateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgePublic: { backgroundColor: '#34C75922', color: '#34C759', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
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
