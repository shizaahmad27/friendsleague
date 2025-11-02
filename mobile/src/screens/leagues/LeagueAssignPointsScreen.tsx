import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, FlatList } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { leaguesApi, LeagueMember, LeagueRule } from '../../services/leaguesApi';

type AssignRouteProp = RouteProp<{ LeagueAssignPoints: { leagueId: string } }, 'LeagueAssignPoints'>;

export default function LeagueAssignPointsScreen() {
  const route = useRoute<AssignRouteProp>();
  const navigation = useNavigation<any>();
  const { leagueId } = route.params;

  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [rules, setRules] = useState<LeagueRule[]>([] as any);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [points, setPoints] = useState('');
  const [category, setCategory] = useState<LeagueRule['category']>('WINS');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, r] = await Promise.all([
        leaguesApi.getMembers(leagueId),
        leaguesApi.getRules(leagueId),
      ]);
      setMembers(m);
      setRules(r);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async () => {
    if (!selectedMemberId.trim()) { Alert.alert('Select member'); return; }
    const numericPoints = Number(points);
    if (!Number.isFinite(numericPoints) || numericPoints === 0) { Alert.alert('Invalid points'); return; }
    setAssigning(true);
    try {
      await leaguesApi.assignPoints(leagueId, { userId: selectedMemberId, points: numericPoints, category, reason: reason.trim() || undefined });
      setPoints(''); setReason('');
      await load();
      Alert.alert('Success', 'Points assigned');
      navigation.navigate('LeagueLeaderboard', { leagueId });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to assign points');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Assign Points</Text></View>
      <View style={{ padding: 16 }}>
        <Text style={styles.label}>Select member</Text>
        <View style={styles.chipsRow}>
          {members.map((m) => (
            <TouchableOpacity key={m.userId} style={[styles.chip, selectedMemberId === m.userId && styles.chipActive]} onPress={() => setSelectedMemberId(m.userId)}>
              <Text style={[styles.chipText, selectedMemberId === m.userId && styles.chipTextActive]}>{m.username}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Quick select from rules</Text>
        <View style={styles.chipsRow}>
          {rules.slice(0, 8).map((r) => (
            <TouchableOpacity key={r.id} style={styles.ruleChip} onPress={() => { setPoints(String(r.points)); setCategory(r.category); }}>
              <Text style={styles.ruleChipText}>{r.title} (+{r.points})</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={styles.input} placeholder="Points (e.g. 5 or -2)" keyboardType="numeric" value={points} onChangeText={setPoints} />
        <Text style={styles.label}>Category: {category}</Text>
        <View style={styles.chipsRow}>
          {(['WINS','PARTICIPATION','BONUS','PENALTY'] as LeagueRule['category'][]).map((c) => (
            <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.input} placeholder="Reason (optional)" value={reason} onChangeText={setReason} />
        <TouchableOpacity style={styles.button} onPress={handleAssign} disabled={assigning}>
          {assigning ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Assign Points</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 22, fontWeight: '700', color: '#333' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { color: '#666', marginBottom: 8 },
  chipsRow: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#eee', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#007AFF22' },
  chipText: { color: '#555' },
  chipTextActive: { color: '#007AFF', fontWeight: '600' },
  ruleChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e8f0ff', marginRight: 8, marginBottom: 8 },
  ruleChipText: { color: '#007AFF', fontWeight: '600' },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8 },
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});


