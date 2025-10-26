// mobile/src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect() {
    if (this.socket?.connected) return;

    const { user, accessToken } = useAuthStore.getState();
    if (!user || !accessToken) return;

    this.socket = io('https://friendleague.onrender.com', {
      transports: ['websocket'],
      path: '/socket.io',
      auth: {
        token: accessToken,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('Disconnected from server:', reason);
      this.isConnected = false;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinChat(chatId: string, userId: string) {
    if (this.socket) {
      this.socket.emit('joinChat', { chatId, userId });
    }
  }

  sendMessage(chatId: string, message: any) {
    if (this.socket) {
      this.socket.emit('sendMessage', { chatId, message });
    }
  }

  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('newMessage', callback);
    }
  }

  offNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.off('newMessage', callback);
    }
  }

  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    if (this.socket) {
      this.socket.on('user:typing', callback);
    }
  }

  offUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    if (this.socket) {
      this.socket.off('user:typing', callback);
    }
  }

  emitTyping(chatId: string, userId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { chatId, userId, isTyping });
    }
  }

  onReactionAdded(callback: (data: { messageId: string; userId: string; emoji: string; reaction: any }) => void) {
    if (this.socket) {
      this.socket.on('reactionAdded', callback);
    }
  }

  offReactionAdded(callback: (data: { messageId: string; userId: string; emoji: string; reaction: any }) => void) {
    if (this.socket) {
      this.socket.off('reactionAdded', callback);
    }
  }

  onReactionRemoved(callback: (data: { messageId: string; userId: string; emoji: string }) => void) {
    if (this.socket) {
      this.socket.on('reactionRemoved', callback);
    }
  }

  offReactionRemoved(callback: (data: { messageId: string; userId: string; emoji: string }) => void) {
    if (this.socket) {
      this.socket.off('reactionRemoved', callback);
    }
  }

  onMessagesRead(callback: (data: { userId: string; messageIds: string[]; readAt: string }) => void) {
    if (this.socket) {
      this.socket.on('messagesRead', callback);
    }
  }

  offMessagesRead(callback: (data: { userId: string; messageIds: string[]; readAt: string }) => void) {
    if (this.socket) {
      this.socket.off('messagesRead', callback);
    }
  }

  onNewChat(callback: (chat: any) => void) {
    if (this.socket) {
      this.socket.on('newChat', callback);
    }
  }

  offNewChat(callback: (chat: any) => void) {
    if (this.socket) {
      this.socket.off('newChat', callback);
    }
  }

  onUnreadCountUpdate(callback: (data: { userId: string; unreadCount: number }) => void) {
    if (this.socket) {
      this.socket.on('unreadCountUpdate', callback);
    }
  }

  offUnreadCountUpdate(callback: (data: { userId: string; unreadCount: number }) => void) {
    if (this.socket) {
      this.socket.off('unreadCountUpdate', callback);
    }
  }

  joinUser(userId: string) {
    if (this.socket) {
      this.socket.emit('joinUser', { userId });
    }
  }

  leaveUser(userId: string) {
    if (this.socket) {
      this.socket.emit('leaveUser', { userId });
    }
  }

  onUserOnline(callback: (data: { userId: string; timestamp: string }) => void) {
    if (this.socket) {
    
      this.socket.on('user:online', (data) => {
      
        callback(data);
      });
    }
  }

  offUserOnline(callback: (data: { userId: string; timestamp: string }) => void) {
    if (this.socket) {
      this.socket.off('user:online', callback);
    }
  }

  onUserOffline(callback: (data: { userId: string; timestamp: string }) => void) {
    if (this.socket) {
      this.socket.on('user:offline', callback);
    }
  }

  offUserOffline(callback: (data: { userId: string; timestamp: string }) => void) {
    if (this.socket) {
      this.socket.off('user:offline', callback);
    }
  }

  // Privacy setting change listeners
  onPrivacyGlobalChanged(callback: (data: { userId: string; showOnlineStatus: boolean; timestamp: string }) => void) {
    if (this.socket) {
      this.socket.on('privacy:global-changed', callback);
    }
  }

  offPrivacyGlobalChanged(callback: (data: { userId: string; showOnlineStatus: boolean; timestamp: string }) => void) {
    if (this.socket) {
      this.socket.off('privacy:global-changed', callback);
    }
  }

  onPrivacyFriendChanged(callback: (data: { userId: string; targetUserId: string; hideOnlineStatus: boolean; timestamp: string }) => void) {
    if (this.socket) {
      this.socket.on('privacy:friend-changed', callback);
    }
  }

  offPrivacyFriendChanged(callback: (data: { userId: string; targetUserId: string; hideOnlineStatus: boolean; timestamp: string }) => void) {
    if (this.socket) {
      this.socket.off('privacy:friend-changed', callback);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
