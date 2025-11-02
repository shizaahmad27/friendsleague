import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { eventsApi } from '../../services/eventsApi';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { leaguesApi } from '../../services/leaguesApi';

type CreateRouteProp = RouteProp<{ EventCreate: { leagueId?: string } }, 'EventCreate'>;

export default function EventCreateScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<CreateRouteProp>();
  const passedLeagueId = route.params?.leagueId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [leagueId, setLeagueId] = useState<string | undefined>(passedLeagueId);
  const [isPrivate, setIsPrivate] = useState(false);
  const [hasScoring, setHasScoring] = useState(true);
  const [linkToLeague, setLinkToLeague] = useState<boolean>(!!passedLeagueId);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!linkToLeague) return;
      setLoadingLeagues(true);
      try {
        const data = await leaguesApi.getLeagues();
        if (!mounted) return;
        setLeagues((data || []).map((l: any) => ({ id: l.id, name: l.name })));
        if (!leagueId && data && data.length > 0) setLeagueId(data[0].id);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoadingLeagues(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [linkToLeague]);

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (linkToLeague && !leagueId) return false;
    return true;
  }, [title, linkToLeague, leagueId]);

  const handleCreate = async () => {
    if (!canSubmit) return;
    try {
      const now = new Date();
      const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const event = await eventsApi.createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        leagueId: linkToLeague ? leagueId : undefined,
        startDate: now.toISOString(),
        endDate: later.toISOString(),
        isPrivate,
        hasScoring,
      });
      navigation.navigate('EventDetails', { eventId: event.id });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create event');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Create Event</Text></View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TextInput 
          style={styles.input} 
          placeholder="Title" 
          value={title} 
          onChangeText={setTitle}
          editable={true}
          selectTextOnFocus={true}
          autoComplete="off"
          textContentType="none"
          autoCorrect={false}
          autoCapitalize="sentences"
          importantForAutofill="no"
        />
        <TextInput 
          style={styles.input} 
          placeholder="Description (optional)" 
          value={description} 
          onChangeText={setDescription}
          editable={true}
          selectTextOnFocus={true}
          autoComplete="off"
          textContentType="none"
          autoCorrect={false}
          autoCapitalize="sentences"
          importantForAutofill="no"
        />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Event Type</Text>
          <View style={styles.chipsRow}>
            <TouchableOpacity style={[styles.chip, !linkToLeague && styles.chipActive]} onPress={() => setLinkToLeague(false)}>
              <Text style={[styles.chipText, !linkToLeague && styles.chipTextActive]}>Standalone</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, linkToLeague && styles.chipActive]} onPress={() => setLinkToLeague(true)}>
              <Text style={[styles.chipText, linkToLeague && styles.chipTextActive]}>Link to League</Text>
            </TouchableOpacity>
          </View>

          {linkToLeague && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.label}>Choose League</Text>
              {loadingLeagues ? (
                <ActivityIndicator />
              ) : leagues.length === 0 ? (
                <Text style={styles.muted}>You are not in any leagues yet.</Text>
              ) : (
                <View style={styles.chipsRow}>
                  {leagues.map(l => (
                    <TouchableOpacity key={l.id} style={[styles.chip, leagueId === l.id && styles.chipActive]} onPress={() => setLeagueId(l.id)}>
                      <Text style={[styles.chipText, leagueId === l.id && styles.chipTextActive]}>{l.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.label}>Private</Text>
          <Switch value={isPrivate} onValueChange={setIsPrivate} />
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Has Scoring</Text>
          <Switch value={hasScoring} onValueChange={setHasScoring} />
        </View>
        <TouchableOpacity style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={handleCreate} disabled={!canSubmit}>
          <Text style={styles.buttonText}>{!canSubmit ? 'Fill required fields' : 'Create'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 22, fontWeight: '700', color: '#333' },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8, color: '#333', fontSize: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  label: { color: '#333' },
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  buttonDisabled: { backgroundColor: '#9ec6ff' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { color: '#333', fontWeight: '700', marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#f0f0f0', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#007AFF22' },
  chipText: { color: '#444' },
  chipTextActive: { color: '#007AFF', fontWeight: '700' },
  muted: { color: '#777' },
});


