import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { leaguesApi, LeagueRule } from '../services/leaguesApi';

type ReadRouteProp = RouteProp<{ LeagueRulesRead: { leagueId: string } }, 'LeagueRulesRead'>;

export default function LeagueRulesReadScreen() {
  const route = useRoute<ReadRouteProp>();
  const { leagueId } = route.params;

  const [rules, setRules] = useState<LeagueRule[]>([] as any);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leaguesApi.getRules(leagueId);
      setRules(data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>League Rules</Text></View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.ruleCard}>
              <Text style={styles.ruleTitle}>{item.title}</Text>
              {!!item.description && <Text style={styles.ruleDesc}>{item.description}</Text>}
              <Text style={styles.ruleMeta}>{item.category} · {item.points} pts</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 22, fontWeight: '700', color: '#333' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  ruleCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12 },
  ruleTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  ruleDesc: { color: '#555', marginBottom: 6, lineHeight: 20 },
  ruleMeta: { color: '#007AFF', fontWeight: '600' },
});


