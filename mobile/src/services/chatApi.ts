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
  mediaUrl?: string;
  replyToId?: string;
  createdAt: string;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: Array<{
      id: string;
      username: string;
      avatar?: string;
    }>;
  }>;
  sender?: {
    id: string;
    username: string;
    avatar?: string;
  };
  replyTo?: Message;
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
  sendMessage: async (chatId: string, content: string, type = 'TEXT', mediaUrl?: string, replyToId?: string): Promise<Message> => {
    const response = await api.post(`/chats/${chatId}/messages`, { content, type, mediaUrl, replyToId });
    return response.data;
  },

  // Get presigned URL for media upload
  getPresignedUrl: async (fileName: string, fileType: string, fileSize: number): Promise<{
    uploadUrl: string;
    mediaUrl: string;
    key: string;
  }> => {
    const response = await api.post('/upload/presigned-url', { fileName, fileType, fileSize });
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
  markChatRead: async (chatId: string): Promise<{ success: boolean }> => {
    const response = await api.put(`/chats/${chatId}/read`);
    return response.data;
  },

  // Message Reaction Methods
  addReaction: async (messageId: string, emoji: string): Promise<any> => {
    const response = await api.post(`/chats/messages/${messageId}/reactions`, { emoji });
    return response.data;
  },

  removeReaction: async (messageId: string, emoji: string): Promise<{ success: boolean }> => {
    const encodedEmoji = encodeURIComponent(emoji);
    const response = await api.delete(`/chats/messages/${messageId}/reactions/${encodedEmoji}`);
    return response.data;
  },

  getReactions: async (messageId: string): Promise<any[]> => {
    const response = await api.get(`/chats/messages/${messageId}/reactions`);
    return response.data;
  },
};