import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, TextInput } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { leaguesApi, LeagueRule } from '../services/leaguesApi';
import { useAuthStore } from '../store/authStore';

type ReadRouteProp = RouteProp<{ LeagueRulesRead: { leagueId: string } }, 'LeagueRulesRead'>;

export default function LeagueRulesReadScreen() {
  const route = useRoute<ReadRouteProp>();
  const { leagueId } = route.params;
  const { user } = useAuthStore();

  const [rules, setRules] = useState<LeagueRule[]>([] as any);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPoints, setEditPoints] = useState('');
  const [editCategory, setEditCategory] = useState<LeagueRule['category']>('WINS');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, m] = await Promise.all([
        leaguesApi.getRules(leagueId),
        leaguesApi.getMembers(leagueId),
      ]);
      setRules(r);
      setMembers(m);
      const me = m.find((mm: any) => mm.userId === user?.id);
      setCanEdit(!!me?.isAdmin);
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
              {canEdit ? (
                <View style={{ marginTop: 8 }}>
                  {editing === item.id ? (
                    <View>
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
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity style={styles.button} onPress={async () => { await leaguesApi.updateRule(leagueId, item.id, { title: editTitle || undefined, description: editDesc, points: editPoints ? Number(editPoints) : undefined, category: editCategory }); setEditing(null); await load(); }}>
                          <Text style={styles.buttonText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.buttonSecondary} onPress={() => setEditing(null)}>
                          <Text style={styles.buttonSecondaryText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                      <TouchableOpacity onPress={() => { setEditing(item.id); setEditTitle(item.title); setEditDesc(item.description || ''); setEditPoints(String(item.points)); setEditCategory(item.category); }} style={{ alignSelf: 'flex-end',  paddingHorizontal: 10, }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={{ color: '#007AFF', fontWeight: '800', fontSize: 18 }}>✎ Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => (navigation as any).navigate('LeagueAssignPoints', { leagueId })} style={{ alignSelf: 'flex-end', paddingHorizontal: 10 }}>
                        <Text style={{ color: '#34C759', fontWeight: '800', fontSize: 16 }}>➕ Assign</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : null}
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
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8 },
  chipsRow: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#eee', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#007AFF22' },
  chipText: { color: '#555' },
  chipTextActive: { color: '#007AFF', fontWeight: '600' },
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginRight: 12, paddingHorizontal: 16 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  buttonSecondary: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#007AFF', paddingHorizontal: 16 },
  buttonSecondaryText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
});


