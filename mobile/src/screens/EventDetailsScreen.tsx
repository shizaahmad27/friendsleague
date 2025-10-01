import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { eventsApi, EventItem } from '../services/eventsApi';

type DetailsRouteProp = RouteProp<{ EventDetails: { eventId: string } }, 'EventDetails'>;

export default function EventDetailsScreen() {
  const route = useRoute<DetailsRouteProp>();
  const navigation = useNavigation<any>();
  const { eventId } = route.params;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventsApi.getEventById(eventId);
      setEvent(data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!event) return <View style={styles.center}><Text style={styles.sub}>Event not found</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>{event.title}</Text></View>
      <View style={{ padding: 16 }}>
        {!!event.description && <Text style={styles.sub}>{event.description}</Text>}
        <Text style={styles.meta}>Privacy: {event.isPrivate ? 'Private' : 'Public'}</Text>
        <Text style={styles.meta}>Scoring: {event.hasScoring ? 'Enabled' : 'Simple list'}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EventParticipants', { eventId })}>
          <Text style={styles.buttonText}>Participants</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EventRules', { eventId })}>
          <Text style={styles.buttonText}>Rules & Assign Points</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EventLeaderboard', { eventId })}>
          <Text style={styles.buttonText}>Leaderboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Not implemented', 'Scoring UI TBD')}>
          <Text style={styles.buttonText}>{event.hasScoring ? 'Open Scoreboard' : 'Open List'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 22, fontWeight: '700', color: '#333' },
  sub: { color: '#666' },
  meta: { color: '#333', marginTop: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});


