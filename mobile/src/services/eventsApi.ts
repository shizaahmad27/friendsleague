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
};


