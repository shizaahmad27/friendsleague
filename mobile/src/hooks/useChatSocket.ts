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
}

export const useChatSocket = ({
  chatId,
  userId,
  onNewMessage,
  onUserTyping,
  onReactionAdded,
  onReactionRemoved,
}: UseChatSocketProps) => {
  useEffect(() => {
    socketService.connect();
    socketService.joinChat(chatId, userId);

    socketService.onNewMessage(onNewMessage);
    socketService.onUserTyping(onUserTyping);
    socketService.onReactionAdded(onReactionAdded);
    socketService.onReactionRemoved(onReactionRemoved);

    const sock = socketService.getSocket();
    const onReconnect = () => socketService.joinChat(chatId, userId);
    if (sock) {
      sock.on('connect', onReconnect);
    }

    return () => {
      socketService.emitTyping(chatId, userId, false);
      socketService.offNewMessage(onNewMessage);
      socketService.offUserTyping(onUserTyping);
      socketService.offReactionAdded(onReactionAdded);
      socketService.offReactionRemoved(onReactionRemoved);
      if (sock) {
        sock.off('connect', onReconnect);
      }
    };
  }, [chatId, userId, onNewMessage, onUserTyping, onReactionAdded, onReactionRemoved]);
};
