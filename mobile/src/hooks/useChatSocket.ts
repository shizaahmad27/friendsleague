import { useEffect } from 'react';
import socketService from '../services/socketService';
import { Message } from '../services/chatApi';

interface UseChatSocketProps {
  chatId: string;
  userId: string;
  onNewMessage: (message: Message) => void;
  onUserTyping: (data: { userId: string; isTyping: boolean }) => void;
  onReactionAdded: (data: any) => void;
  onReactionRemoved: (data: any) => void;
  onEphemeralViewed: (data: { messageId: string; viewedBy: string; viewedAt: string }) => void;
}

export const useChatSocket = ({
  chatId,
  userId,
  onNewMessage,
  onUserTyping,
  onReactionAdded,
  onReactionRemoved,
  onEphemeralViewed,
}: UseChatSocketProps) => {
  useEffect(() => {
    socketService.connect();
    socketService.joinChat(chatId, userId);
    socketService.joinUser(userId); // Join user's personal room for ephemeralViewed events

    console.log(`🔌 User ${userId} joined chat ${chatId} and personal room ${userId}`);
    
    // Log socket connection status for debugging
    setTimeout(() => {
      socketService.logRoomMembership();
    }, 1000);
    
    socketService.onNewMessage(onNewMessage);
    socketService.onUserTyping(onUserTyping);
    socketService.onReactionAdded(onReactionAdded);
    socketService.onReactionRemoved(onReactionRemoved);
    socketService.onEphemeralViewed(onEphemeralViewed);

    const sock = socketService.getSocket();
    const onReconnect = () => {
      console.log(`🔄 Reconnecting: User ${userId} rejoining chat ${chatId} and personal room ${userId}`);
      socketService.joinChat(chatId, userId);
      socketService.joinUser(userId); // Rejoin user room on reconnect
    };
    if (sock) {
      sock.on('connect', onReconnect);
    }

    return () => {
      socketService.emitTyping(chatId, userId, false);
      socketService.offNewMessage(onNewMessage);
      socketService.offUserTyping(onUserTyping);
      socketService.offReactionAdded(onReactionAdded);
      socketService.offReactionRemoved(onReactionRemoved);
      socketService.offEphemeralViewed(onEphemeralViewed);
      if (sock) {
        sock.off('connect', onReconnect);
      }
    };
  }, [chatId, userId, onNewMessage, onUserTyping, onReactionAdded, onReactionRemoved, onEphemeralViewed]);
};
