// mobile/src/services/chatApi.ts
import api from './api';

export interface Chat {
  id: string;
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
    const response = await api.post('/chat/direct', { friendId });
    return response.data;
  },

  // Get user's chats
  getUserChats: async (): Promise<Chat[]> => {
    const response = await api.get('/chat/chats');
    return response.data;
  },

  // Get chat messages
  getChatMessages: async (chatId: string, page = 1, limit = 50): Promise<Message[]> => {
    const response = await api.get(`/chat/${chatId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Send message
  sendMessage: async (chatId: string, content: string, type = 'TEXT'): Promise<Message> => {
    const response = await api.post(`/chat/${chatId}/messages`, { content, type });
    return response.data;
  },
};