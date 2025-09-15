import api from './api';

export interface Invitation {
  id: string;
  inviterId: string;
  inviteeId: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  inviter: {
    id: string;
    username: string;
    avatar?: string;
  };
  invitee?: {
    id: string;
    username: string;
    avatar?: string;
  } | null;
}

export interface CreateInvitationData {
  inviteeId: string;
}

export const invitationApi = {
  // Create invitation
  createInvitation: async (data: CreateInvitationData): Promise<Invitation> => {
    const response = await api.post('/invitations', data);
    return response.data;
  },

  // Get all invitations for current user
  getInvitations: async (): Promise<Invitation[]> => {
    const response = await api.get('/invitations');
    return response.data;
  },

  // Get pending invitations
  getPendingInvitations: async (): Promise<Invitation[]> => {
    const response = await api.get('/invitations/pending');
    return response.data;
  },

  // Accept invitation
  acceptInvitation: async (invitationId: string): Promise<Invitation> => {
    const response = await api.put(`/invitations/${invitationId}/accept`);
    return response.data;
  },

  // Reject invitation
  rejectInvitation: async (invitationId: string): Promise<Invitation> => {
    const response = await api.put(`/invitations/${invitationId}/reject`);
    return response.data;
  },

  // Cancel invitation
  cancelInvitation: async (invitationId: string): Promise<Invitation> => {
    const response = await api.delete(`/invitations/${invitationId}`);
    return response.data;
  },
};
