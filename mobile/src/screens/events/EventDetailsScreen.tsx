import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Modal, Share } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { eventsApi, EventItem } from '../../services/eventsApi';

type DetailsRouteProp = RouteProp<{ EventDetails: { eventId: string } }, 'EventDetails'>;

export default function EventDetailsScreen() {
  const route = useRoute<DetailsRouteProp>();
  const navigation = useNavigation<any>();
  const { eventId } = route.params;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

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
    <>
      <View style={styles.container}>
        <View style={styles.header}><Text style={styles.title}>{event.title}</Text></View>
        <View style={{ padding: 16 }}>
          {!!event.description && <Text style={styles.sub}>{event.description}</Text>}
          <Text style={styles.meta}>Privacy: {event.isPrivate ? 'Private' : 'Public'}</Text>
          <Text style={styles.meta}>Scoring: {event.hasScoring ? 'Enabled' : 'Simple list'}</Text>
          {event.leagueId ? (
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>Linked to league</Text>
              <TouchableOpacity onPress={() => navigation.navigate('LeagueDetails', { leagueId: event.leagueId })}>
                <Text style={styles.link}>Open League</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.muted}>Standalone event</Text>
          )}
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EventParticipants', { eventId })}>
            <Text style={styles.buttonText}>Participants</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EventRules', { eventId })}>
            <Text style={styles.buttonText}>Rules & Assign Points</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EventLeaderboard', { eventId })}>
            <Text style={styles.buttonText}>Leaderboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={async () => {
            try {
              const inv = await eventsApi.createInvitation(eventId, {} as any);
              setInviteCode(inv.code);
              setInviteModalVisible(true);
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || 'Failed to generate invite');
            }
          }}>
            <Text style={styles.buttonSecondaryText}>📤 Share / Invite</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Not implemented', 'Scoring UI TBD')}>
            <Text style={styles.buttonText}>{event.hasScoring ? 'Open Scoreboard' : 'Open List'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Modal visible={inviteModalVisible} transparent animationType="fade" onRequestClose={() => setInviteModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Invite Code</Text>
            <Text style={styles.modalCode}>{inviteCode || '—'}</Text>
            <Text style={styles.modalSub}>Share this code. Non-friends must sign up then use the code in Invite Code screen.</Text>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.smallBtn, styles.smallBtnPrimary]} onPress={async () => {
                try {
                  await Share.share({ message: `Join my FriendsLeague event! Use invite code: ${inviteCode}` });
                } catch {}
              }}>
                <Text style={styles.smallBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, styles.smallBtnOutline]} onPress={() => setInviteModalVisible(false)}>
                <Text style={[styles.smallBtnText, styles.smallBtnOutlineText]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 22, fontWeight: '700', color: '#333' },
  sub: { color: '#666' },
  meta: { color: '#333', marginTop: 8 },
  muted: { color: '#777', marginTop: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  badge: { backgroundColor: '#007AFF22', color: '#007AFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
  link: { color: '#007AFF', fontWeight: '700' },
  buttonSecondary: { backgroundColor: 'white', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#007AFF' },
  buttonSecondaryText: { color: '#007AFF', fontSize: 16, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: 'white', padding: 20, borderRadius: 16, width: '84%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  modalCode: { fontSize: 24, fontWeight: '800', color: '#007AFF', textAlign: 'center', marginVertical: 8 },
  modalSub: { color: '#666', textAlign: 'center' },
  modalActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  smallBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  smallBtnPrimary: { backgroundColor: '#007AFF' },
  smallBtnOutline: { backgroundColor: 'white', borderWidth: 1, borderColor: '#007AFF' },
  smallBtnText: { color: 'white', fontWeight: '700' },
  smallBtnOutlineText: { color: '#007AFF' },
});


