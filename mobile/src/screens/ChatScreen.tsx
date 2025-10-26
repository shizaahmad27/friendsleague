// mobile/src/screens/ChatScreen.tsx
import { useState, useEffect, useRef } from 'react';
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
  Modal,
  Image,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { chatApi, Message, Chat } from '../services/chatApi';
import socketService from '../services/socketService';
import { useAuthStore } from '../store/authStore';
import { MediaPicker } from '../components/MediaPicker';
import { MessageMedia } from '../components/MessageMedia';
import { MessageReactions } from '../components/MessageReactions';
import { ReactionPicker } from '../components/ReactionPicker';
import MessageReplyPreview from '../components/MessageReplyPreview';
import { ChatSettingsModal } from '../components/ChatSettingsModal';
import { MediaGalleryModal } from '../components/MediaGalleryModal';
import { MediaService } from '../services/mediaService';
import { useMediaSelection } from '../hooks/useMediaSelection';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { Ionicons } from '@expo/vector-icons';
import { useReadReceipts } from '../hooks/useReadReceipts';
import { useChatSocket } from '../hooks/useChatSocket';
import { MessageStatus } from '../components/MessageStatus';
import { ReadReceiptsModal } from '../components/ReadReceiptsModal';
import { OnlineStatusIndicator } from '../components/OnlineStatusIndicator';
import { useUserOnlineStatus } from '../hooks/useUserOnlineStatus';

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
  const [isChatSettingsVisible, setIsChatSettingsVisible] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState<Message | null>(null);
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [peerUser, setPeerUser] = useState<{ id: string; username: string; avatar?: string } | null>(null);
  const [chatMeta, setChatMeta] = useState<{ type: Chat['type']; name?: string } | null>(null);
  const [participants, setParticipants] = useState<Array<{ id: string; username: string; avatar?: string }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [lastTap, setLastTap] = useState<number | null>(null);
  const [readReceiptsModalVisible, setReadReceiptsModalVisible] = useState(false);
  const [selectedMessageForReceipts, setSelectedMessageForReceipts] = useState<Message | null>(null);

  // Reusable media callbacks
  const handleMediaSelected = (mediaUrl: string, type: 'IMAGE' | 'VIDEO' | 'FILE' | 'VOICE', localUri?: string) => {
    // Replace provisional with real message after upload
    const tempPrefix = 'temp-';
    setMessages(prev => {
      const idx = prev.findIndex(m => m.mediaUrl === localUri && m.id.startsWith(tempPrefix));
      if (idx === -1) return prev; // if not found, do nothing
      const copy = [...prev];
      copy.splice(idx, 1); // remove provisional
      return copy;
    });
    // Now send the real message once
    sendMessage(mediaUrl, type);
  };

  const handlePreviewSelected = (localUri: string, type: 'IMAGE' | 'VIDEO' | 'FILE' | 'VOICE') => {
    // Insert a provisional message at top (inverted list) with a temp id
    const tempId = `temp-${Date.now()}`;
    const provisional: Message = {
      id: tempId,
      content: '',
      type,
      senderId: user?.id || 'me',
      chatId,
      mediaUrl: localUri,
      createdAt: new Date().toISOString(),
    } as Message;
    setMessages(prev => [provisional, ...prev]);
  };

  // Media selection hook for MediaPicker component
  const mediaSelection = useMediaSelection({
    onMediaSelected: handleMediaSelected,
    onPreviewSelected: handlePreviewSelected,
  });

  // Voice message handler
  const handleVoiceSend = async (audioUrl: string, duration: number, waveformData?: number[]) => {
    // Validate inputs
    if (!audioUrl || typeof audioUrl !== 'string') {
      console.error('ChatScreen: Invalid audioUrl provided to handleVoiceSend');
      return;
    }
    
    if (typeof duration !== 'number' || duration < 0) {
      console.error('ChatScreen: Invalid duration provided to handleVoiceSend');
      return;
    }

    if (!user?.id) {
      console.error('ChatScreen: No user ID available for voice message');
      return;
    }

    // Create provisional message for voice
    const tempId = `temp-${Date.now()}`;
    const provisional: Message = {
      id: tempId,
      content: '', // Empty content for voice messages
      type: 'VOICE',
      senderId: user.id,
      chatId,
      mediaUrl: audioUrl,
      duration: duration, // Store duration in seconds
      waveformData: waveformData, // Store waveform data
      createdAt: new Date().toISOString(),
    } as Message;
    setMessages(prev => [provisional, ...prev]);
    
    try {
      // Send the actual message directly without calling sendMessage to avoid duplicates
      const message = await chatApi.sendMessage(
        chatId, 
        '', // Empty content for voice messages
        'VOICE',
        audioUrl,
        replyingTo?.id
      );

      const messageWithSender = { ...message, senderId: user.id, duration: duration, waveformData: waveformData };

      // Replace provisional message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? messageWithSender : msg
      ));

      socketService.sendMessage(chatId, messageWithSender);
      
      // Clear reply state after sending
      if (replyingTo) {
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('ChatScreen: Error sending voice message:', error);
      // Remove provisional message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };


  // No need for media picker service - we'll use the hook directly



  const flatListRef = useRef<FlatList>(null);
  const typingNames = typingUsers.map(id => usernamesById[id] ?? id);
  const usernamesRef = useRef(usernamesById);

  // Socket event handlers
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

  const handleReactionAdded = (data: { messageId: string; userId: string; emoji: string; reaction: any }) => {
    setMessages(prev => prev.map(message => {
      if (message.id === data.messageId) {
        // Update reactions for this message
        const existingReactions = message.reactions || [];
        const existingReactionIndex = existingReactions.findIndex(r => r.emoji === data.emoji);
        
        if (existingReactionIndex >= 0) {
          // Update existing 
          const updatedReactions = [...existingReactions];
          updatedReactions[existingReactionIndex] = {
            ...updatedReactions[existingReactionIndex],
            count: updatedReactions[existingReactionIndex].count + 1,
            users: [...updatedReactions[existingReactionIndex].users, {
              id: data.userId,
              username: data.reaction.user.username,
              avatar: data.reaction.user.avatar,
            }],
          };
          return { ...message, reactions: updatedReactions };
        } else {
          // Add new reaction
          return {
            ...message,
            reactions: [
              ...existingReactions,
              {
                emoji: data.emoji,
                count: 1,
                users: [{
                  id: data.userId,
                  username: data.reaction.user.username,
                  avatar: data.reaction.user.avatar,
                }],
              },
            ],
          };
        }
      }
      return message;
    }));
  };

  const handleReactionRemoved = (data: { messageId: string; userId: string; emoji: string }) => {
    setMessages(prev => prev.map(message => {
      if (message.id === data.messageId) {
        const existingReactions = message.reactions || [];
        const updatedReactions = existingReactions
          .map(reaction => {
            if (reaction.emoji === data.emoji) {
              const updatedUsers = reaction.users.filter(user => user.id !== data.userId);
              if (updatedUsers.length === 0) {
                return null; // Mark for removal
              }
              return {
                ...reaction,
                count: updatedUsers.length,
                users: updatedUsers,
              };
            }
            return reaction;
          })
          .filter((reaction): reaction is NonNullable<typeof reaction> => reaction !== null);
        
        return { ...message, reactions: updatedReactions };
      }
      return message;
    }));
  };

  // Use custom hooks
  useEffect(() => {
    loadMessages();
  }, [chatId]);

  useChatSocket({
    chatId,
    userId: user?.id || '',
    onNewMessage: handleNewMessage,
    onUserTyping: handleUserTyping,
    onReactionAdded: handleReactionAdded,
    onReactionRemoved: handleReactionRemoved,
  });

  // Socket connection and user room joining is handled globally by useOnlineStatus hook
  // No need to manually manage user rooms here

  const { getMessageStatus, getReadByCount, getReadByUsers } = useReadReceipts({
    chatId,
    messages,
    onMessagesUpdate: setMessages,
  });

  // Online status hook
  const { isUserOnline, getLastSeenTime } = useUserOnlineStatus();

  // Helper function to determine if a message is the last in a consecutive series
  const isLastMessageInSeries = (currentMessage: Message, currentIndex: number): boolean => {
    // Since messages are in reverse chronological order (newest first), 
    // we need to check the PREVIOUS message (lower index) to see if it's from a different sender
    const previousMessage = messages[currentIndex - 1];
    
    // If this is the first message (highest index), it's the last in series
    if (!previousMessage) return true;
    
    // Different sender = end of series
    if (previousMessage.senderId !== currentMessage.senderId) return true;
    
    // Time gap > 5 minutes = end of series
    const timeDiff = new Date(currentMessage.createdAt).getTime() - new Date(previousMessage.createdAt).getTime();
    return timeDiff > 300000; // 5 minutes
  };

  const loadMessages = async () => {
    try {
      const data = await chatApi.getChatMessages(chatId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Gallery functions
  const openGallery = (message: Message) => {
    setFullscreenMessage(message);
  };

  const closeGallery = () => {
    setFullscreenMessage(null);
  };

  const sendMessage = async (mediaUrl?: string, mediaType?: 'IMAGE' | 'VIDEO' | 'FILE' | 'VOICE') => {
    if ((!newMessage.trim() && !mediaUrl) || !user?.id) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const message = await chatApi.sendMessage(
        chatId, 
        messageContent || '', // Send empty string instead of emoji + text
        mediaType || 'TEXT',
        mediaUrl,
        replyingTo?.id
      );

      const messageWithSender = { ...message, senderId: user.id };

      setMessages(prev => [messageWithSender, ...prev]);

      socketService.sendMessage(chatId, messageWithSender);

      socketService.emitTyping(chatId, user.id, false);
      setIsTyping(false);
      
      // Clear reply state after sending
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setNewMessage(messageContent);
    }
  };

  // Reaction handling functions
  const handleReactionPress = (message: Message) => {
    setSelectedMessageForReaction(message);
    setReactionPickerVisible(true);
  };

  const handleDoubleTap = (message: Message) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 300ms window for double tap
    
    if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
      // Double tap detected
      handleReactionPress(message);
      setLastTap(null); // Reset to prevent triple tap
    } else {
      // First tap
      setLastTap(now);
    }
  };

  const handleEmojiSelect = async (emoji: string, message?: Message) => {
    const targetMessage = message || selectedMessageForReaction;
    if (!targetMessage) return;

    try {
      // Check if user already reacted with this emoji
      const existingReaction = targetMessage.reactions?.find(
        r => r.users.some(u => u.id === user?.id) && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        await chatApi.removeReaction(targetMessage.id, emoji);
      } else {
        // Add reaction
        await chatApi.addReaction(targetMessage.id, emoji);
      }

      // Real-time updates will handle the UI updates via socket events
    } catch (error) {
      console.error('Failed to handle reaction:', error);
      Alert.alert('Error', 'Failed to update reaction');
    }
  };

  const handleReactionButtonPress = (emoji: string, messageId: string) => {
    // Find the message that has this reaction
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions?.find(
      r => r.users.some(u => u.id === user?.id) && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      handleEmojiSelect(emoji, message);
    } else {
      // Add reaction (this shouldn't happen from tapping existing reactions, but just in case)
      handleEmojiSelect(emoji, message);
    }
  };

  const handleReplyPress = (message: Message) => {
    setReplyingTo(message);
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
      <View style={[
        styles.messageWrapper,
        isOwnMessage ? styles.ownMessageWrapper : styles.otherMessageWrapper,
      ]}>
        <TouchableOpacity
          style={[
            isMediaMessage ? styles.mediaMessageContainer : styles.messageContainer,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
            !isMediaMessage && (isOwnMessage ? styles.ownMessageBackground : styles.otherMessageBackground),
          ]}
          onPress={() => handleDoubleTap(item)}
          onLongPress={() => handleReactionPress(item)}
          activeOpacity={0.7}
        >
          {/* Reply Preview */}
          {item.replyTo && (
            <MessageReplyPreview 
              replyTo={item.replyTo} 
              onPress={() => {
                // Scroll to the replied message
                const replyIndex = messages.findIndex(msg => msg.id === item.replyTo?.id);
                if (replyIndex !== -1) {
                  flatListRef.current?.scrollToIndex({ index: replyIndex, animated: true });
                }
              }}
            />
          )}
          
          {isMediaMessage && item.mediaUrl ? (
            <MessageMedia
              mediaUrl={item.mediaUrl}
              type={item.type as 'IMAGE' | 'VIDEO' | 'FILE' | 'VOICE'}
              duration={item.duration}
              waveformData={item.waveformData}
              isOwnMessage={isOwnMessage}
              onLongPress={() => handleReactionPress(item)}
              messageId={item.id}
              onReactionPress={() => handleReactionPress(item)}
              onReplyPress={() => handleReplyPress(item)}
              onMediaPress={openGallery}
            />
          ) : null}
          {item.content && (
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                isMediaMessage ? styles.messageTextWithMedia : null,
              ]}
            >
              {item.content}
            </Text>
          )}
          
        </TouchableOpacity>
        
        {/* Message Reactions - Now outside the bubble */}
        {item.reactions && item.reactions.length > 0 && (
          <MessageReactions
            reactions={item.reactions}
            onReactionPress={(emoji) => handleReactionButtonPress(emoji, item.id)}
            messageId={item.id}
          />
        )}

        {/* Message Status - Only for own messages and only on the last message in a series */}
        {isOwnMessage && (() => {
          const currentIndex = messages.findIndex(msg => msg.id === item.id);
          return isLastMessageInSeries(item, currentIndex) ? (
            <MessageStatus
              message={item}
              status={getMessageStatus(item)}
              isGroupChat={chatMeta?.type === 'GROUP'}
              readByCount={chatMeta?.type === 'GROUP' ? getReadByCount(item, participants.length + 1) : undefined}
              readByUsers={chatMeta?.type === 'GROUP' ? getReadByUsers(item) : undefined}
              onPress={() => {
                setSelectedMessageForReceipts(item);
                setReadReceiptsModalVisible(true);
              }}
            />
          ) : null;
        })()}
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
          <View style={styles.headerUserInfo}>
            <Text style={styles.headerUsername} numberOfLines={1}>
              {displayName}
            </Text>
            {/* Online Status Indicator - only show for direct chats */}
            {!isGroup && peerUser && (
              <OnlineStatusIndicator
                isOnline={isUserOnline(peerUser.id)}
                lastSeen={getLastSeenTime(peerUser.id) || undefined}
                showLastSeen={true}
                size="small"
                style={styles.headerOnlineStatus}
              />
            )}
          </View>
          {isGroup && <Text style={styles.headerChevron}>›</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerMenuButton}
          onPress={() => setIsChatSettingsVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#007AFF" />
        </TouchableOpacity>
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
        renderItem={({ item, index }: { item: any; index: number }) => {
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
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted
      />

      {typingUsers.length > 0 && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>
            {typingNames.join(', ')}{' '}
            {typingNames.length === 1 ? 'is' : 'are'} typing...          </Text> 
        </View>
      )}

      {/* Reply Header */}
      {replyingTo && (
        <MessageReplyPreview 
          replyTo={replyingTo} 
          isInHeader={true}
          onClose={() => setReplyingTo(null)}
        />
      )}

      <View style={styles.inputContainer}>
        {/* Always render VoiceRecorder, but conditionally show full-width or inline */}
        <VoiceRecorder
          onVoiceSend={handleVoiceSend}
          disabled={false}
          onRecordingStateChange={setIsRecording}
          isFullWidth={isRecording}
        />
        
        {/* Show normal input when not recording */}
        {!isRecording && (
          <>
            <View style={styles.leftActionsRow}>
              <MediaPicker
                onPreviewSelected={handlePreviewSelected}
                onMediaSelected={handleMediaSelected}
              />
              <TouchableOpacity
                style={styles.inlineIconButton}
                onPress={() => {
                  console.log('Camera icon pressed');
                  Alert.alert('Coming soon', 'Quick camera shortcut');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="camera-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            
            </View>
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
          </>
        )}
      </View>

      {/* Chat Settings Modal */}
      <ChatSettingsModal
        visible={isChatSettingsVisible}
        onClose={() => setIsChatSettingsVisible(false)}
        messages={messages}
        onOpenGallery={openGallery}
        chatId={chatId}
      />

      {/* Fullscreen Media Modal */}
      <MediaGalleryModal
        visible={fullscreenMessage !== null}
        onClose={closeGallery}
        message={fullscreenMessage}
        allMessages={messages}
        onReactionPress={(message: Message) => {
          setSelectedMessageForReaction(message);
          setReactionPickerVisible(true);
        }}
        onReplyPress={handleReplyPress}
      />

      {/* Reaction Picker Modal */}
      <ReactionPicker
        visible={reactionPickerVisible}
        onClose={() => {
          setReactionPickerVisible(false);
          setSelectedMessageForReaction(null);
        }}
        onSelectEmoji={handleEmojiSelect}
      />

      {/* Read Receipts Modal */}
      <ReadReceiptsModal
        visible={readReceiptsModalVisible}
        onClose={() => {
          setReadReceiptsModalVisible(false);
          setSelectedMessageForReceipts(null);
        }}
        message={selectedMessageForReceipts}
      />

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
  headerUserInfo: {
    flex: 1,
  },
  headerOnlineStatus: {
    marginTop: 2,
  },
  headerRightSpacer: {
    width: 40,
  },
  headerMenuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flexGrow: 1,
    padding: 16,
  },
  messageWrapper: {
    marginVertical: 4,
  },
  ownMessageWrapper: {
    alignItems: 'flex-end',
  },
  otherMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  mediaMessageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    // No padding, background, or border radius for media messages
  },
  ownMessage: {
    // Alignment now handled by messageWrapper
  },
  otherMessage: {
    // Alignment now handled by messageWrapper
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
  leftActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
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
    marginLeft: -8,
  },
  inlineIconButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
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
  menuButtonContainer: {
    position: 'absolute',
    left: 15,
    top: 0,
    bottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  menuButton: {
    padding: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});
