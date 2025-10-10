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
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { chatApi, Message, Chat } from '../services/chatApi';
import socketService from '../services/socketService';
import { useAuthStore } from '../store/authStore';
import { MediaPicker } from '../components/MediaPicker';
import { MessageMedia } from '../components/MessageMedia';
import { Ionicons } from '@expo/vector-icons';

type ChatScreenRouteProp = RouteProp<{ Chat: { chatId: string } }, 'Chat'>;

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const { chatId } = route.params;
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [usernamesById, setUsernamesById] = useState<Record<string, string>>({});
  const [peerUser, setPeerUser] = useState<{ id: string; username: string; avatar?: string } | null>(null);
  const [chatMeta, setChatMeta] = useState<{ type: Chat['type']; name?: string } | null>(null);
  const [participants, setParticipants] = useState<Array<{ id: string; username: string; avatar?: string }>>([]);

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

  // Mark chat as read when opening
  useEffect(() => {
    (async () => {
      try {
        await chatApi.markChatRead(chatId);
      } catch {}
    })();
  }, [chatId]);

  const loadMessages = async () => {
    try {
      const data = await chatApi.getChatMessages(chatId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async (mediaUrl?: string, mediaType?: 'IMAGE' | 'VIDEO' | 'FILE') => {
    if ((!newMessage.trim() && !mediaUrl) || !user?.id) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const message = await chatApi.sendMessage(
        chatId, 
        messageContent || '', // Send empty string instead of emoji + text
        mediaType || 'TEXT',
        mediaUrl
      );

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
    const isMediaMessage = item.mediaUrl && item.type !== 'TEXT';

    return (
      <View
        style={[
          isMediaMessage ? styles.mediaMessageContainer : styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
          !isMediaMessage && (isOwnMessage ? styles.ownMessageBackground : styles.otherMessageBackground),
        ]}
      >
        {isMediaMessage && item.mediaUrl ? (
          <MessageMedia
            mediaUrl={item.mediaUrl}
            type={item.type as 'IMAGE' | 'VIDEO' | 'FILE'}
            isOwnMessage={isOwnMessage}
          />
        ) : null}
        {item.content && (
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              isMediaMessage && styles.messageTextWithMedia,
            ]}
          >
            {item.content}
          </Text>
        )}
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
        // determine peer (the other user in a direct chat; in group, pick none)
        if (user?.id) {
          const others = parts.map(p => p.user).filter(u => u.id !== user.id);
          if (others.length > 0) {
            const first = others[0];
            setPeerUser({ id: first.id, username: first.username, avatar: first.avatar });
            setParticipants(others);
            // Heuristic: if more than 1 other participant, treat as group
            if (others.length > 1) {
              setChatMeta(prev => ({ ...(prev || { type: 'GROUP' }), type: 'GROUP' }));
            } else {
              setChatMeta(prev => ({ ...(prev || { type: 'DIRECT' }), type: 'DIRECT' }));
            }
          }
        }
      })
      .catch(() => {});
  }, [chatId]);

  // Try to load chat name/type from chats list (if available)
  useEffect(() => {
    chatApi.getUserChats()
      .then(chats => {
        const c = chats.find(x => x.id === chatId);
        if (c) {
          setChatMeta({ type: c.type, name: c.name });
        }
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

  const renderHeader = () => {
    const isGroup = chatMeta?.type === 'GROUP' || participants.length > 1;
    const displayName = isGroup
      ? chatMeta?.name || participants.slice(0, 3).map(p => p.username).join(', ')
      : (peerUser?.username || 'Chat');

    return (
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerTitleContainer}
          onPress={() => (navigation as any).navigate('GroupChatSettings', { chatId })}
          disabled={!isGroup}
          activeOpacity={0.7}
        >
          {isGroup ? (
            <View style={styles.groupAvatarContainer}>
              <View style={styles.groupAvatarMain}>
                <Text style={styles.headerAvatarText}>
                  {(participants[0]?.username?.charAt(0) || 'G').toUpperCase()}
                </Text>
              </View>
              {participants[1] && (
                <View style={[styles.groupAvatarSmall, { left: -8, top: 4 }]}>
                  <Text style={styles.groupAvatarSmallText}>
                    {participants[1].username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {participants[2] && (
                <View style={[styles.groupAvatarSmall, { right: -8, top: 4 }]}>
                  <Text style={styles.groupAvatarSmallText}>
                    {participants[2].username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {(peerUser?.username?.charAt(0) || '?').toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.headerUsername} numberOfLines={1}>
            {displayName}
          </Text>
          {isGroup && <Text style={styles.headerChevron}>›</Text>}
        </TouchableOpacity>
        <View style={styles.headerRightSpacer} />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {renderHeader()}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item, index }) => {
          const currentTs = new Date(item.createdAt).getTime();
          const prev = messages[index + 1]; // list is inverted
          const prevTs = prev ? new Date(prev.createdAt).getTime() : null;
          const showTimestamp = !prevTs || currentTs - prevTs >= 15 * 60 * 1000;

          return (
            <>
              {renderMessage({ item })}
              {showTimestamp && (
                <View style={styles.timeSeparatorContainer}>
                  <Text style={styles.timeSeparatorText}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )}
            </>
          );
        }}
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
        <MediaPicker
          onMediaSelected={(mediaUrl, type) => sendMessage(mediaUrl, type)}
        />
        <View style={styles.textInputWrapper}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={styles.sendIconButton}
            onPress={() => sendMessage()}
            disabled={!newMessage.trim()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="arrow-up-circle"
              size={28}
              color={newMessage.trim() ? '#007AFF' : '#ccc'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: '#007AFF',
    lineHeight: 28,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 36,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarContainer: {
    width: 42,
    height: 42,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarMain: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarSmall: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarSmallText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerChevron: {
    marginLeft: 4,
    fontSize: 18,
    color: '#999',
  },
  headerUsername: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  headerRightSpacer: {
    width: 40,
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
  mediaMessageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    // No padding, background, or border radius for media messages
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  ownMessageBackground: {
    backgroundColor: '#007AFF',
  },
  otherMessageBackground: {
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
  timeSeparatorContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginVertical: 8,
  },
  timeSeparatorText: {
    fontSize: 12,
    color: '#555',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 26,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    maxHeight: 100,
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingRight: 6,
    marginRight: 8,
  },
  sendIconButton: {
    paddingLeft: 6,
    paddingVertical: 4,
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
  messageTextWithMedia: {
    marginTop: 8,
  },
});
