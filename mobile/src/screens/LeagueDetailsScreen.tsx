import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { leaguesApi, League } from '../services/leaguesApi';
import { useAuthStore } from '../store/authStore';

type LeagueDetailsRouteProp = RouteProp<{ LeagueDetails: { leagueId: string } }, 'LeagueDetails'>;

export default function LeagueDetailsScreen() {
  const route = useRoute<LeagueDetailsRouteProp>();
  const navigation = useNavigation<any>();
  const { leagueId } = route.params;
  const { user } = useAuthStore();

  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const isMember = !!(league && user && league.members && league.members.some((m) => m.user.id === user.id));

  const loadLeague = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leaguesApi.getLeagueById(leagueId);
      setLeague(data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to load league');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    loadLeague();
  }, [loadLeague]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await leaguesApi.joinLeague(leagueId, inviteCode || undefined);
      await loadLeague();
      Alert.alert('Joined', 'You have joined this league');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to join league');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}> 
        <ActivityIndicator />
      </View>
    );
  }

  if (!league) {
    return (
      <View style={styles.center}>
        <Text style={styles.subtitle}>League not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{league.name}</Text>
        {!!league.description && <Text style={styles.subtitle}>{league.description}</Text>}
      </View>

      {league.rules && league.rules.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Rules</Text>
          {league.rules.slice(0, 3).map((r) => (
            <Text key={r.id} style={styles.ruleLine}>• {r.title} ({r.category}, {r.points} pts)</Text>
          ))}
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LeagueRulesRead', { leagueId })}>
            <Text style={styles.buttonText}>View All Rules</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isMember && (
        <View style={styles.section}>
          {league.isPrivate ? (
            <>
              <Text style={styles.sectionTitle}>Join with invite code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter invite code"
                autoCapitalize="characters"
                value={inviteCode}
                onChangeText={setInviteCode}
                maxLength={8}
              />
              <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={joining}>
                {joining ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Join</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={joining}>
              {joining ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Join League</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LeagueMembers', { leagueId })}>
          <Text style={styles.buttonText}>Members</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LeagueAdmin', { leagueId })}>
          <Text style={styles.buttonText}>Admin</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LeagueRules', { leagueId })}>
          <Text style={styles.buttonText}>Rules {league.rules && league.rules.length ? `(${league.rules.length})` : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LeagueAssignPoints', { leagueId })}>
          <Text style={styles.buttonText}>Assign Points</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LeagueLeaderboard', { leagueId })}>
          <Text style={styles.buttonText}>Leaderboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 4 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 16, color: '#333', marginBottom: 10 },
  ruleLine: { color: '#555', marginBottom: 6 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});


