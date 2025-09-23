// mobile/src/screens/ChatScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { chatApi, Message } from '../services/chatApi';
import socketService from '../services/socketService';
import { useAuthStore } from '../store/authStore';

type ChatScreenRouteProp = RouteProp<{ Chat: { chatId: string } }, 'Chat'>;

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const { chatId } = route.params;
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [usernamesById, setUsernamesById] = useState<Record<string, string>>({});

  const flatListRef = useRef<FlatList>(null);
  const typingNames = typingUsers.map(id => usernamesById[id] ?? id);
  const usernamesRef = useRef(usernamesById);


  useEffect(() => {
    loadMessages();
    if (!user?.id) return;

    // Ensure socket connected before joining/listening
    socketService.connect();

    socketService.joinChat(chatId, user.id);

    const handleNewMessage = (message: Message) => {
      if (message.chatId === chatId) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === message.id);
          return exists ? prev : [message, ...prev];
        });
      }
    };

    const handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
      
      if (data.isTyping) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);

      } else {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);

    // Re-join on reconnect to keep room subscription
    const sock = socketService.getSocket();
    const onReconnect = () => socketService.joinChat(chatId, user.id);
    sock?.on('connect', onReconnect);

    return () => {
      socketService.emitTyping(chatId, user.id, false);
      socketService.offNewMessage(handleNewMessage);
      socketService.offUserTyping(handleUserTyping);
      sock?.off('connect', onReconnect);
    };
  }, [chatId, user?.id]);

  const loadMessages = async () => {
    try {
      const data = await chatApi.getChatMessages(chatId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const message = await chatApi.sendMessage(chatId, messageContent);

      const messageWithSender = { ...message, senderId: user.id };

      setMessages(prev => [messageWithSender, ...prev]);

      socketService.sendMessage(chatId, messageWithSender);

      socketService.emitTyping(chatId, user.id, false);
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setNewMessage(messageContent);
    }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);

    if (!user?.id) return;

    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      socketService.emitTyping(chatId, user.id, true);
    } else if (text.length === 0 && isTyping) {
      setIsTyping(false);
      socketService.emitTyping(chatId, user.id, false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
          ]}
        >
          {item.content}
        </Text>
        <Text
          style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
          ]}
        >
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  useEffect(() => { usernamesRef.current = usernamesById; }, [usernamesById]);

  // Preload usernames from chat participants
  useEffect(() => {
    chatApi.getGroupChatParticipants(chatId)
      .then(parts => {
        const map = Object.fromEntries(parts.map(p => [p.user.id, p.user.username]));
        setUsernamesById(prev => ({ ...map, ...prev }));
      })
      .catch(() => {});
  }, [chatId]);

  // Hydrate usernames map from messages that include sender
  useEffect(() => {
    if (messages.length === 0) return;
    const entries: Array<[string, string]> = [];
    for (const m of messages) {
      if (m.sender && m.sender.id && m.sender.username) {
        entries.push([m.sender.id, m.sender.username]);
      }
    }
    if (entries.length > 0) {
      const map = Object.fromEntries(entries);
      setUsernamesById(prev => ({ ...map, ...prev }));
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        inverted
      />

      {typingUsers.length > 0 && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>
            {typingNames.join(', ')}{' '}
            {typingNames.length === 1 ? 'is' : 'are'} typing...          </Text> 
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMessageTime: {
    color: '#999',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
