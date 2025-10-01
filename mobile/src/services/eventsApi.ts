import api from './api';

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  leagueId?: string;
  adminId: string;
  startDate: string;
  endDate: string;
  isPrivate: boolean;
  hasScoring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventParticipant {
  userId: string;
  username: string;
  avatar?: string;
  joinedAt?: string;
  totalPoints: number;
}

export interface EventRule {
  id: string;
  title: string;
  description?: string;
  points: number;
  category: 'WINS' | 'PARTICIPATION' | 'BONUS' | 'PENALTY';
  createdAt: string;
}

export interface EventLeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  totalPoints: number;
  rank: number;
}

export const eventsApi = {
  getEvents: async (): Promise<EventItem[]> => {
    const res = await api.get('/events');
    return res.data;
  },
  getLeagueEvents: async (leagueId: string): Promise<EventItem[]> => {
    const res = await api.get(`/events/league/${leagueId}`);
    return res.data;
  },
  getEventById: async (eventId: string): Promise<EventItem> => {
    const res = await api.get(`/events/${eventId}`);
    return res.data;
  },
  createEvent: async (data: {
    title: string;
    description?: string;
    leagueId?: string;
    startDate: string;
    endDate: string;
    maxParticipants?: number;
    isPrivate?: boolean;
    hasScoring?: boolean;
    participantIds?: string[];
  }): Promise<EventItem> => {
    const res = await api.post('/events', data);
    return res.data;
  },
  // Participants
  getParticipants: async (eventId: string): Promise<EventParticipant[]> => {
    const res = await api.get(`/events/${eventId}/participants`);
    return res.data;
  },
  addParticipant: async (eventId: string, userId: string): Promise<void> => {
    await api.post(`/events/${eventId}/participants`, { userId });
  },
  removeParticipant: async (eventId: string, userId: string): Promise<void> => {
    await api.delete(`/events/${eventId}/participants/${userId}`);
  },
  // Rules
  getRules: async (eventId: string): Promise<EventRule[]> => {
    const res = await api.get(`/events/${eventId}/rules`);
    return res.data;
  },
  createRule: async (
    eventId: string,
    data: { title: string; description?: string; points: number; category: EventRule['category'] }
  ): Promise<EventRule> => {
    const res = await api.post(`/events/${eventId}/rules`, data);
    return res.data;
  },
  // Points assignment
  assignPoints: async (
    eventId: string,
    data: { userId: string; points: number; reason?: string; category: EventRule['category']; ruleId?: string }
  ): Promise<void> => {
    await api.post(`/events/${eventId}/points`, data);
  },
  // Leaderboard
  getLeaderboard: async (eventId: string): Promise<EventLeaderboardEntry[]> => {
    const res = await api.get(`/events/${eventId}/leaderboard`);
    return res.data;
  },
};


