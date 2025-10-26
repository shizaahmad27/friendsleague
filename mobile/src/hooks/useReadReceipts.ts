import { useEffect, useCallback } from 'react';
import { chatApi, Message } from '../services/chatApi';
import socketService from '../services/socketService';
import { useAuthStore } from '../store/authStore';

interface UseReadReceiptsProps {
  chatId: string;
  messages: Message[];
  onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => void;
}

export const useReadReceipts = ({ chatId, messages, onMessagesUpdate }: UseReadReceiptsProps) => {
  const { user } = useAuthStore();

  // Mark messages as read when chat opens
  useEffect(() => {
    const markAsRead = async () => {
      if (!user?.id || messages.length === 0) return;

      // Get all unread message IDs (messages sent by others that don't have user's read receipt)
      const unreadMessageIds = messages
        .filter(msg => 
          msg.senderId !== user.id && 
          !msg.readReceipts?.some(receipt => receipt.userId === user.id)
        )
        .map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        try {
          await chatApi.markMessagesAsRead(chatId, unreadMessageIds);
          // Also mark chat as read for unread count
          await chatApi.markChatRead(chatId);
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      }
    };

    markAsRead();
  }, [chatId, messages.length, user?.id]);

  // Listen for read receipt updates via socket
  useEffect(() => {
    const handleMessagesRead = (data: { userId: string; messageIds: string[]; readAt: string }) => {
      onMessagesUpdate(prev => prev.map(message => {
        if (data.messageIds.includes(message.id)) {
          const existingReceipts = message.readReceipts || [];
          const hasReceipt = existingReceipts.some(r => r.userId === data.userId);
          
          if (!hasReceipt) {
            return {
              ...message,
              readReceipts: [
                ...existingReceipts,
                {
                  userId: data.userId,
                  readAt: data.readAt,
                  user: { id: data.userId, username: '', avatar: undefined },
                },
              ],
            };
          }
        }
        return message;
      }));
    };

    socketService.onMessagesRead(handleMessagesRead);
    return () => socketService.offMessagesRead(handleMessagesRead);
  }, [onMessagesUpdate]);

  const getMessageStatus = useCallback((message: Message): 'sent' | 'delivered' | 'read' => {
    if (!user?.id || message.senderId !== user.id) return 'sent';
    
    const readReceipts = message.readReceipts || [];
    
    if (readReceipts.length > 0) {
      return 'read';
    }
    
    // Consider delivered if message was created (simplified - could add delivery tracking)
    return 'delivered';
  }, [user?.id]);

  const getReadByCount = useCallback((message: Message, totalParticipants: number): { read: number; total: number } => {
    const readCount = (message.readReceipts || []).length;
    // Exclude sender from total
    return { read: readCount, total: totalParticipants - 1 };
  }, []);

  return {
    getMessageStatus,
    getReadByCount,
  };
};
