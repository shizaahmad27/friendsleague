import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { eventsApi, EventParticipant } from '../services/eventsApi';

type ParticipantsRoute = RouteProp<{ EventParticipants: { eventId: string } }, 'EventParticipants'>;

export default function EventParticipantsScreen() {
  const route = useRoute<ParticipantsRoute>();
  const { eventId } = route.params;

  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [userId, setUserId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventsApi.getParticipants(eventId);
      setParticipants(data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!userId.trim()) return;
    setAdding(true);
    try {
      await eventsApi.addParticipant(eventId, userId.trim());
      setUserId('');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (uid: string) => {
    Alert.alert('Remove participant', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await eventsApi.removeParticipant(eventId, uid);
          await load();
        } catch (e: any) {
          Alert.alert('Error', e?.response?.data?.message || 'Failed to remove');
        }
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Participants</Text></View>
      <View style={styles.controls}>
        <TextInput style={styles.input} placeholder="User ID" value={userId} onChangeText={setUserId} />
        <TouchableOpacity style={styles.button} onPress={handleAdd} disabled={adding}>
          <Text style={styles.buttonText}>{adding ? 'Adding...' : 'Add'}</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <FlatList
          data={participants}
          keyExtractor={(p) => p.userId}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.name}>{item.username}</Text>
              <TouchableOpacity style={styles.remove} onPress={() => handleRemove(item.userId)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
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
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: '#333', fontSize: 16 },
  remove: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FF3B30', borderRadius: 8 },
  removeText: { color: 'white', fontWeight: '600' },
});


