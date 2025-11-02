import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { leaguesApi, LeagueMember } from '../../services/leaguesApi';

type AdminRouteProp = RouteProp<{ LeagueAdmin: { leagueId: string } }, 'LeagueAdmin'>;

export default function LeagueAdminScreen() {
  const route = useRoute<AdminRouteProp>();
  const { leagueId } = route.params;

  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState('');
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leaguesApi.getMembers(leagueId);
      setMembers(data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => { load(); }, [load]);

  const handleGrant = async () => {
    if (!userId.trim()) return;
    setWorking(true);
    try {
      await leaguesApi.grantAdmin(leagueId, userId.trim());
      setUserId('');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to grant admin');
    } finally {
      setWorking(false);
    }
  };

  const handleRevoke = async (uid: string) => {
    setWorking(true);
    try {
      await leaguesApi.revokeAdmin(leagueId, uid);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to revoke admin');
    } finally {
      setWorking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Admins</Text></View>
      <View style={styles.controls}>
        <TextInput style={styles.input} placeholder="User ID to grant admin" value={userId} onChangeText={setUserId} />
        <TouchableOpacity style={styles.button} onPress={handleGrant} disabled={working}>
          {working ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Grant</Text>}
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.userId}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.rowText}>{item.username}</Text>
                {item.isAdmin ? (
                  <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Admin</Text></View>
                ) : null}
              </View>
              {item.isAdmin ? (
                <TouchableOpacity style={styles.remove} onPress={() => handleRevoke(item.userId)}>
                  <Text style={styles.removeText}>Revoke</Text>
                </TouchableOpacity>
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
  controls: { padding: 16 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8 },
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowText: { color: '#333', fontSize: 16 },
  remove: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FF3B30', borderRadius: 8 },
  removeText: { color: 'white', fontWeight: '600' },
  adminBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#007AFF22', borderRadius: 8 },
  adminBadgeText: { color: '#007AFF', fontWeight: '700', fontSize: 12 },
});


