import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { leaguesApi, LeagueRule } from '../services/leaguesApi';

type RulesRouteProp = RouteProp<{ LeagueRules: { leagueId: string } }, 'LeagueRules'>;

export default function LeagueRulesScreen() {
  const route = useRoute<RulesRouteProp>();
  const { leagueId } = route.params;

  const [rules, setRules] = useState<LeagueRule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState('');
  const [category, setCategory] = useState<LeagueRule['category']>('WINS');

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

  const handleCreate = async () => {
    if (!title.trim() || !points.trim()) return;
    setCreating(true);
    try {
      await leaguesApi.createRule(leagueId, { title: title.trim(), points: Number(points), category });
      setTitle('');
      setPoints('');
      setCategory('WINS');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create rule');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Rules</Text></View>

      <View style={styles.controls}>
        <TextInput style={styles.input} placeholder="Rule title" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Points" keyboardType="numeric" value={points} onChangeText={setPoints} />
        <Text style={styles.label}>Category: {category}</Text>
        <View style={styles.chipsRow}>
          {(['WINS','PARTICIPATION','BONUS','PENALTY'] as LeagueRule['category'][]).map((c) => (
            <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={creating}>
          {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Rule</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rowText}>{item.title} · {item.category} · {item.points} pts</Text>
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
  controls: { padding: 16 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8 },
  label: { color: '#666', marginBottom: 8 },
  chipsRow: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#eee', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#007AFF22' },
  chipText: { color: '#555' },
  chipTextActive: { color: '#007AFF', fontWeight: '600' },
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12 },
  rowText: { color: '#333', fontSize: 16 },
});


