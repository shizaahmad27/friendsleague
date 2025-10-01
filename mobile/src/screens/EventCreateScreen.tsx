import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, Alert } from 'react-native';
import { eventsApi } from '../services/eventsApi';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';

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

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      const now = new Date();
      const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const event = await eventsApi.createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        leagueId,
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
      <View style={{ padding: 16 }}>
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
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Private</Text>
          <Switch value={isPrivate} onValueChange={setIsPrivate} />
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Has Scoring</Text>
          <Switch value={hasScoring} onValueChange={setHasScoring} />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>Create</Text>
        </TouchableOpacity>
      </View>
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
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});


