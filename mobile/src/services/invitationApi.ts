import api from './api';

export interface Invitation {
  id: string;
  code: string;
  inviterId: string;
  inviteeId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
  expiredAt: string;
  createdAt: string;
  updatedAt: string;
  inviter?: {
    id: string;
    username: string;
    avatar?: string;
  };
  invitee?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface UseInviteCodeResponse {
  success: boolean;
  message: string;
  friendshipId?: string;
}

export interface MyInviteCodeResponse {
  code: string;
  username: string;
}

export const invitationApi = {
  // Create invitation (send to specific user)
  async createInvitation(inviteeId: string): Promise<Invitation> {
    const response = await api.post('/invitations', { inviteeId });
    return response.data;
  },

  // Get all invitations for current user
  async getInvitations(): Promise<Invitation[]> {
    const response = await api.get('/invitations');
    return response.data;
  },

  // Get pending invitations for current user
  async getPendingInvitations(): Promise<Invitation[]> {
    const response = await api.get('/invitations/pending');
    return response.data;
  },

  // Accept invitation
  async acceptInvitation(invitationId: string): Promise<Invitation> {
    const response = await api.put(`/invitations/${invitationId}/accept`);
    return response.data;
  },

  // Reject invitation
  async rejectInvitation(invitationId: string): Promise<Invitation> {
    const response = await api.put(`/invitations/${invitationId}/reject`);
    return response.data;
  },

  // Cancel invitation
  async cancelInvitation(invitationId: string): Promise<Invitation> {
    const response = await api.delete(`/invitations/${invitationId}`);
    return response.data;
  },

  // Use invite code
  async useInviteCode(code: string): Promise<UseInviteCodeResponse> {
    const response = await api.post('/invitations/use-code', { code });
    return response.data;
  },

  // Get my invite code
  async getMyInviteCode(): Promise<MyInviteCodeResponse> {
    const response = await api.get('/invitations/my-code');
    return response.data;
  },
};