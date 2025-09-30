import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { leaguesApi, LeagueRule, LeagueMember } from '../services/leaguesApi';

type RulesRouteProp = RouteProp<{ LeagueRules: { leagueId: string } }, 'LeagueRules'>;

export default function LeagueRulesScreen() {
  const route = useRoute<RulesRouteProp>();
  const navigation = useNavigation<any>();
  const { leagueId } = route.params;

  const [rules, setRules] = useState<LeagueRule[]>([]);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<LeagueRule['category']>('WINS');
  const [assigning, setAssigning] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [reason, setReason] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPoints, setEditPoints] = useState('');
  const [editCategory, setEditCategory] = useState<LeagueRule['category']>('WINS');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesData, membersData] = await Promise.all([
        leaguesApi.getRules(leagueId),
        leaguesApi.getMembers(leagueId),
      ]);
      setRules(rulesData);
      setMembers(membersData);
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
      const description = (desc ?? '').slice(0, 200);
      await leaguesApi.createRule(leagueId, { title: title.trim(), description, points: Number(points), category });
      setTitle('');
      setPoints('');
      setDesc('');
      setCategory('WINS');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create rule');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async (ruleId: string) => {
    try {
      const payload: any = {};
      if (editTitle.trim()) payload.title = editTitle.trim();
      if (editDesc.trim() || editDesc === '') payload.description = editDesc;
      if (editPoints.trim()) payload.points = Number(editPoints);
      if (editCategory) payload.category = editCategory;
      await leaguesApi.updateRule(leagueId, ruleId, payload);
      setEditing(null);
      setEditTitle(''); setEditDesc(''); setEditPoints(''); setEditCategory('WINS');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update rule');
    }
  };

  const handleAssign = async () => {
    if (!selectedMemberId.trim()) {
      Alert.alert('Select member', 'Please choose a member');
      return;
    }
    const numericPoints = Number(points);
    if (!Number.isFinite(numericPoints) || numericPoints === 0) {
      Alert.alert('Invalid points', 'Enter non-zero points');
      return;
    }
    setAssigning(true);
    try {
      await leaguesApi.assignPoints(leagueId, {
        userId: selectedMemberId,
        points: numericPoints,
        category,
        reason: reason.trim() || undefined,
      });
      setPoints('');
      setReason('');
      await load();
      Alert.alert('Success', 'Points assigned');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to assign points');
    } finally {
      setAssigning(false);
    }
  };

  

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Rules</Text></View>

      <View style={styles.controls}>
        <TextInput style={styles.input} placeholder="Rule title" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Points" keyboardType="numeric" value={points} onChangeText={setPoints} />
        <TextInput style={styles.input} placeholder="Description (optional, max 200)" value={desc} onChangeText={(t) => setDesc(t.slice(0,200))} />
        <Text style={styles.helper}>{desc.length}/200</Text>
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
          ListHeaderComponent={
            <>
              <View style={styles.sectionTitleRow}><Text style={styles.sectionTitleText}>Rules</Text></View>
            </>
          }
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.rowText}>{item.title} · {item.category} · {item.points} pts</Text>
                <TouchableOpacity onPress={() => setEditing(item.id)}>
                  <Text style={{ color: '#007AFF', fontWeight: '700' }}>Edit</Text>
                </TouchableOpacity>
              </View>
              {editing === item.id && (
                <View style={{ marginTop: 12 }}>
                  <TextInput style={styles.input} placeholder="Title" value={editTitle} onChangeText={setEditTitle} />
                  <TextInput style={styles.input} placeholder="Description" value={editDesc} onChangeText={setEditDesc} />
                  <TextInput style={styles.input} placeholder="Points" keyboardType="numeric" value={editPoints} onChangeText={setEditPoints} />
                  <View style={styles.chipsRow}>
                    {(['WINS','PARTICIPATION','BONUS','PENALTY'] as LeagueRule['category'][]).map((c) => (
                      <TouchableOpacity key={c} style={[styles.chip, editCategory === c && styles.chipActive]} onPress={() => setEditCategory(c)}>
                        <Text style={[styles.chipText, editCategory === c && styles.chipTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={styles.button} onPress={() => handleSaveEdit(item.id)}>
                      <Text style={styles.buttonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonSecondary} onPress={() => setEditing(null)}>
                      <Text style={styles.buttonSecondaryText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
  helper: { color: '#999', marginBottom: 8, textAlign: 'right' },
  chipsRow: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#eee', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#007AFF22' },
  chipText: { color: '#555' },
  chipTextActive: { color: '#007AFF', fontWeight: '600' },
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  buttonSecondary: { marginTop: 8, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#007AFF' },
  buttonSecondaryText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12 },
  rowText: { color: '#333', fontSize: 16 },
  sectionTitleRow: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitleText: { color: '#333', fontSize: 16, fontWeight: '700' },
  assignBox: { backgroundColor: 'white', margin: 16, padding: 16, borderRadius: 12 },
  ruleChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e8f0ff', marginRight: 8, marginBottom: 8 },
  ruleChipText: { color: '#007AFF', fontWeight: '600' },
});


