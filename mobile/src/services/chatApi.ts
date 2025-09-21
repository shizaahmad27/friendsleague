// mobile/src/services/chatApi.ts
import api from './api';

export interface Chat {
  id: string;
  name?: string;
  type: 'DIRECT' | 'GROUP';
  participants: Array<{
    user: {
      id: string;
      username: string;
      avatar?: string;
      isOnline: boolean;
    };
  }>;
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
  senderId: string;
  chatId: string;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export const chatApi = {
  // Create direct chat with a friend
  createDirectChat: async (friendId: string): Promise<Chat> => {
    const response = await api.post('/chats/direct', { friendId });
    return response.data;
  },

  // Get user's chats
  getUserChats: async (): Promise<Chat[]> => {
    const response = await api.get('/chats/chats');
    return response.data;
  },

  // Get chat messages
  getChatMessages: async (chatId: string, page = 1, limit = 50): Promise<Message[]> => {
    const response = await api.get(`/chats/${chatId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Send message
  sendMessage: async (chatId: string, content: string, type = 'TEXT'): Promise<Message> => {
    const response = await api.post(`/chats/${chatId}/messages`, { content, type });
    return response.data;
  },

  // Group Chat APIs
  createGroupChat: async (name: string, description: string, participantIds: string[]): Promise<Chat> => {
    const response = await api.post('/chats/group', { name, description, participantIds });
    return response.data;
  },

  getGroupChatParticipants: async (chatId: string): Promise<Array<{
    user: {
      id: string;
      username: string;
      avatar?: string;
      isOnline: boolean;
    };
  }>> => {
    const response = await api.get(`/chats/${chatId}/participants`);
    return response.data;
  },

  addParticipantsToGroup: async (chatId: string, participantIds: string[]): Promise<any> => {
    const response = await api.post(`/chats/${chatId}/participants`, { participantIds });
    return response.data;
  },

  removeParticipantFromGroup: async (chatId: string, userId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/chats/${chatId}/participants/${userId}`);
    return response.data;
  },

  updateGroupChat: async (chatId: string, name?: string, description?: string): Promise<Chat> => {
    const response = await api.put(`/chats/${chatId}`, { name, description });
    return response.data;
  },
};