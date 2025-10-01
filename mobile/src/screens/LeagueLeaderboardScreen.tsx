import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import { leaguesApi, LeaderboardEntry } from '../services/leaguesApi';

type LeaderboardRouteProp = RouteProp<{ LeagueLeaderboard: { leagueId: string } }, 'LeagueLeaderboard'>;

export default function LeagueLeaderboardScreen() {
  const route = useRoute<LeaderboardRouteProp>();
  const { leagueId } = route.params;
  const navigation = useNavigation<any>();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leaguesApi.getLeaderboard(leagueId);
      setEntries(data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.link} onPress={() => navigation.navigate('LeagueAssignPoints', { leagueId })}>+ Assign Points</Text>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : entries.length === 0 ? (
        <View style={styles.center}><Text style={styles.sub}>No points yet. Assign points to see rankings.</Text></View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.userId}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>#{item.rank}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.username}</Text>
                <Text style={styles.sub}>Total: {item.totalPoints} pts</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '700', color: '#333' },
  link: { color: '#007AFF', fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  rank: { width: 40, fontWeight: '700', color: '#007AFF' },
  name: { color: '#333', fontSize: 16, fontWeight: '600' },
  sub: { color: '#666', marginTop: 2 },
});


