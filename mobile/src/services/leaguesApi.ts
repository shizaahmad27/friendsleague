import api from './api';

export interface League {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  inviteCode?: string;
  adminId?: string;
  members?: Array<{ user: { id: string; username: string; avatar?: string } }>;
  rules?: Array<{ id: string; title: string; description?: string; points: number; category: 'WINS' | 'PARTICIPATION' | 'BONUS' | 'PENALTY' }>; 
  createdAt: string;
  updatedAt: string;
}

export interface LeagueMember {
  userId: string;
  username: string;
  avatar?: string;
  isAdmin: boolean;
  joinedAt: string;
  totalPoints: number;
}

export interface LeagueRule {
  id: string;
  title: string;
  description?: string;
  points: number;
  category: 'WINS' | 'PARTICIPATION' | 'BONUS' | 'PENALTY';
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  totalPoints: number;
  rank: number;
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
  // Members
  getMembers: async (leagueId: string): Promise<LeagueMember[]> => {
    const res = await api.get(`/leagues/${leagueId}/members`);
    return res.data;
  },
  addMember: async (leagueId: string, userId: string): Promise<void> => {
    await api.post(`/leagues/${leagueId}/members`, { userId });
  },
  removeMember: async (leagueId: string, userId: string): Promise<void> => {
    await api.delete(`/leagues/${leagueId}/members/${userId}`);
  },
  // Admin delegation
  grantAdmin: async (leagueId: string, userId: string): Promise<void> => {
    await api.post(`/leagues/${leagueId}/admins/${userId}`);
  },
  revokeAdmin: async (leagueId: string, userId: string): Promise<void> => {
    await api.delete(`/leagues/${leagueId}/admins/${userId}`);
  },
  // Rules
  getRules: async (leagueId: string): Promise<LeagueRule[]> => {
    const res = await api.get(`/leagues/${leagueId}/rules`);
    return res.data;
  },
  createRule: async (leagueId: string, data: { title: string; description?: string; points: number; category: LeagueRule['category']; }): Promise<LeagueRule> => {
    const res = await api.post(`/leagues/${leagueId}/rules`, data);
    return res.data;
  },
  updateRule: async (leagueId: string, ruleId: string, data: Partial<{ title: string; description?: string; points: number; category: LeagueRule['category']; }>): Promise<LeagueRule> => {
    const res = await api.put(`/leagues/${leagueId}/rules/${ruleId}`, data);
    return res.data;
  },
  // Points assignment
  assignPoints: async (leagueId: string, data: { userId: string; points: number; reason?: string; category: LeagueRule['category']; ruleId?: string; }): Promise<void> => {
    await api.post(`/leagues/${leagueId}/points`, data);
  },
  // Leaderboard
  getLeaderboard: async (leagueId: string): Promise<LeaderboardEntry[]> => {
    const res = await api.get(`/leagues/${leagueId}/leaderboard`);
    return res.data;
  },
};


