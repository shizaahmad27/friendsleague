import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { eventsApi, EventRule, EventParticipant, EventItem } from '../services/eventsApi';

type RulesRoute = RouteProp<{ EventRules: { eventId: string } }, 'EventRules'>;

export default function EventRulesScreen() {
  const route = useRoute<RulesRoute>();
  const navigation = useNavigation<any>();
  const { eventId } = route.params;

  const [rules, setRules] = useState<EventRule[]>([]);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<EventRule['category']>('WINS');
  const [assigning, setAssigning] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [evt, r, p] = await Promise.all([
        eventsApi.getEventById(eventId),
        eventsApi.getRules(eventId),
        eventsApi.getParticipants(eventId),
      ]);
      setEvent(evt);
      setRules(r);
      setParticipants(p);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!title.trim() || !points.trim()) return;
    setCreating(true);
    try {
      await eventsApi.createRule(eventId, { title: title.trim(), description: desc.trim() || undefined, points: Number(points), category });
      setTitle(''); setPoints(''); setDesc(''); setCategory('WINS');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create rule');
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId.trim()) { Alert.alert('Select participant'); return; }
    const numeric = Number(points);
    if (!Number.isFinite(numeric) || numeric === 0) { Alert.alert('Invalid points'); return; }
    setAssigning(true);
    try {
      await eventsApi.assignPoints(eventId, { userId: selectedUserId, points: numeric, category, reason: reason.trim() || undefined });
      setPoints(''); setReason('');
      await load();
      navigation.navigate('EventLeaderboard', { eventId });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Rules</Text>
        {event ? (
          event.leagueId ? (
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>Linked to league</Text>
              <TouchableOpacity onPress={() => navigation.navigate('LeagueDetails', { leagueId: event.leagueId })}>
                <Text style={styles.link}>Open League</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.muted}>Standalone event</Text>
          )
        ) : null}
      </View>

      <View style={styles.controls}>
        <TextInput style={styles.input} placeholder="Rule title" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Points" keyboardType="numeric" value={points} onChangeText={setPoints} />
        <TextInput style={styles.input} placeholder="Description (optional)" value={desc} onChangeText={setDesc} />
        <Text style={styles.label}>Category: {category}</Text>
        <View style={styles.chipsRow}>
          {(['WINS','PARTICIPATION','BONUS','PENALTY'] as EventRule['category'][]).map((c) => (
            <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={creating}>
          <Text style={styles.buttonText}>{creating ? 'Creating...' : 'Create Rule'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <>
          <View style={styles.sectionTitleRow}><Text style={styles.sectionTitleText}>Assign Points</Text></View>
          <View style={styles.assignBox}>
            <View style={styles.chipsRow}>
              {participants.map((p) => (
                <TouchableOpacity key={p.userId} style={[styles.chip, selectedUserId === p.userId && styles.chipActive]} onPress={() => setSelectedUserId(p.userId)}>
                  <Text style={[styles.chipText, selectedUserId === p.userId && styles.chipTextActive]}>{p.username}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Points (e.g. 5 or -2)" keyboardType="numeric" value={points} onChangeText={setPoints} />
            <Text style={styles.label}>Category: {category}</Text>
            <View style={styles.chipsRow}>
              {(['WINS','PARTICIPATION','BONUS','PENALTY'] as EventRule['category'][]).map((c) => (
                <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Reason (optional)" value={reason} onChangeText={setReason} />
            <TouchableOpacity style={styles.button} onPress={handleAssign} disabled={assigning}>
              <Text style={styles.buttonText}>{assigning ? 'Assigning...' : 'Assign Points'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionTitleRow}><Text style={styles.sectionTitleText}>Rules</Text></View>
          <FlatList
            data={rules}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={styles.row}><Text style={styles.name}>{item.title} · {item.category} · {item.points} pts</Text></View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 22, fontWeight: '700', color: '#333' },
  muted: { color: '#777', marginTop: 6 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  badge: { backgroundColor: '#007AFF22', color: '#007AFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
  link: { color: '#007AFF', fontWeight: '700' },
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
  name: { color: '#333', fontSize: 16 },
  sectionTitleRow: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitleText: { color: '#333', fontSize: 16, fontWeight: '700' },
  assignBox: { backgroundColor: 'white', margin: 16, padding: 16, borderRadius: 12 },
});


