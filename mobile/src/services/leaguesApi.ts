import api from './api';

export interface League {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  inviteCode?: string;
  createdAt: string;
  updatedAt: string;
}

export const leaguesApi = {
  getLeagues: async (): Promise<League[]> => {
    const res = await api.get('/leagues');
    return res.data;
  },
  getLeagueById: async (leagueId: string): Promise<League> => {
    const res = await api.get(`/leagues/${leagueId}`);
    return res.data;
  },
  createLeague: async (data: { name: string; description?: string; isPrivate?: boolean }): Promise<League> => {
    const res = await api.post('/leagues', data);
    return res.data;
  },
  joinLeague: async (leagueId: string, inviteCode?: string): Promise<League> => {
    const res = await api.post(`/leagues/${leagueId}/join`, { inviteCode });
    return res.data;
  },
};


