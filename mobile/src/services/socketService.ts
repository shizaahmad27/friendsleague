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

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
