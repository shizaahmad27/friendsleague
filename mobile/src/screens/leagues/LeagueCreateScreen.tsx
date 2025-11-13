import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { leaguesApi } from '../../services/leaguesApi';
import ScreenHeader from '../../components/layout/ScreenHeader';

export default function LeagueCreateScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length >= 3;

  const handleCreate = async () => {
    if (!canSubmit) {
      Alert.alert('Validation', 'Name must be at least 3 characters');
      return;
    }
    setSubmitting(true);
    try {
      const league = await leaguesApi.createLeague({ name: name.trim(), description: description.trim() || undefined, isPrivate });
      Alert.alert('Success', 'League created', [
        { text: 'Open', onPress: () => navigation.navigate('LeagueDetails', { leagueId: league.id }) },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create league');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Create League" />

      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="League name"
          value={name}
          onChangeText={setName}
          maxLength={50}
          editable={true}
          selectTextOnFocus={true}
          autoComplete="off"
          textContentType="none"
          autoCorrect={false}
          autoCapitalize="words"
          importantForAutofill="no"
        />

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="What is this league about?"
          value={description}
          onChangeText={setDescription}
          maxLength={200}
          multiline
          editable={true}
          selectTextOnFocus={true}
          autoComplete="off"
          textContentType="none"
          autoCorrect={false}
          autoCapitalize="sentences"
          importantForAutofill="no"
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Private league</Text>
          <Switch value={isPrivate} onValueChange={setIsPrivate} />
        </View>

        <TouchableOpacity style={[styles.button, !canSubmit && styles.buttonDisabled]} disabled={!canSubmit || submitting} onPress={handleCreate}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  form: { padding: 20 },
  label: { fontSize: 14, color: '#333', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#333',
    fontSize: 16,
  },
  multiline: { height: 100, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { backgroundColor: '#9ec6ff' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});


