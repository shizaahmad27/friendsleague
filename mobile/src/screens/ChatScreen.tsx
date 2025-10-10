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
  Modal,
  Image,
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
import { MediaService } from '../services/mediaService';
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
  const [isChatSettingsVisible, setIsChatSettingsVisible] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState<Message | null>(null);
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
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

    const handleReactionAdded = (data: { messageId: string; userId: string; emoji: string; reaction: any }) => {
      setMessages(prev => prev.map(message => {
        if (message.id === data.messageId) {
          // Update reactions for this message
          const existingReactions = message.reactions || [];
          const existingReactionIndex = existingReactions.findIndex(r => r.emoji === data.emoji);
          
          if (existingReactionIndex >= 0) {
            // Update existing reaction
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

    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);
    socketService.onReactionAdded(handleReactionAdded);
    socketService.onReactionRemoved(handleReactionRemoved);

    // Re-join on reconnect to keep room subscription
    const sock = socketService.getSocket();
    const onReconnect = () => socketService.joinChat(chatId, user.id);
    sock?.on('connect', onReconnect);

    return () => {
      socketService.emitTyping(chatId, user.id, false);
      socketService.offNewMessage(handleNewMessage);
      socketService.offUserTyping(handleUserTyping);
      socketService.offReactionAdded(handleReactionAdded);
      socketService.offReactionRemoved(handleReactionRemoved);
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

  const handleEmojiSelect = async (emoji: string) => {
    if (!selectedMessageForReaction) return;

    try {
      // Check if user already reacted with this emoji
      const existingReaction = selectedMessageForReaction.reactions?.find(
        r => r.users.some(u => u.id === user?.id) && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        await chatApi.removeReaction(selectedMessageForReaction.id, emoji);
      } else {
        // Add reaction
        await chatApi.addReaction(selectedMessageForReaction.id, emoji);
      }

      // Real-time updates will handle the UI updates via socket events
    } catch (error) {
      console.error('Failed to handle reaction:', error);
      Alert.alert('Error', 'Failed to update reaction');
    }
  };

  const handleReactionButtonPress = (emoji: string) => {
    if (!selectedMessageForReaction) return;
    handleEmojiSelect(emoji);
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
      <TouchableOpacity
        style={[
          isMediaMessage ? styles.mediaMessageContainer : styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
          !isMediaMessage && (isOwnMessage ? styles.ownMessageBackground : styles.otherMessageBackground),
        ]}
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
            type={item.type as 'IMAGE' | 'VIDEO' | 'FILE'}
            isOwnMessage={isOwnMessage}
            onLongPress={() => handleReactionPress(item)}
            messageId={item.id}
            onReactionPress={() => handleReactionPress(item)}
            onReplyPress={() => handleReplyPress(item)}
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
        
        {/* Message Reactions */}
        {item.reactions && item.reactions.length > 0 && (
          <MessageReactions
            reactions={item.reactions}
            onReactionPress={handleReactionButtonPress}
            messageId={item.id}
          />
        )}
      </TouchableOpacity>
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

      {/* Reply Header */}
      {replyingTo && (
        <MessageReplyPreview 
          replyTo={replyingTo} 
          isInHeader={true}
          onClose={() => setReplyingTo(null)}
        />
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

      {/* Chat Settings Modal */}
      <Modal
        visible={isChatSettingsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsChatSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.chatSettingsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chat Settings</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsChatSettingsVisible(false)}
              >
                <Ionicons name="close" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.mediaSections}>
              {/* Images Section */}
              <View style={styles.mediaSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Images</Text>
                  <TouchableOpacity style={styles.showMoreButton}>
                    <Text style={styles.showMoreText}>Show more</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.mediaGrid}>
                  {messages
                    .filter(msg => msg.type === 'IMAGE' && msg.mediaUrl)
                    .slice(0, 6)
                    .map((msg, index) => (
                      <TouchableOpacity 
                        key={msg.id} 
                        style={styles.mediaItem}
                        onPress={() => setFullscreenMessage(msg)}
                      >
                        <Image source={{ uri: msg.mediaUrl }} style={styles.mediaThumbnail} />
                      </TouchableOpacity>
                    ))}
                </View>
              </View>

              {/* Videos Section */}
              <View style={styles.mediaSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Videos</Text>
                  <TouchableOpacity style={styles.showMoreButton}>
                    <Text style={styles.showMoreText}>Show more</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.mediaGrid}>
                  {messages
                    .filter(msg => msg.type === 'VIDEO' && msg.mediaUrl)
                    .slice(0, 6)
                    .map((msg, index) => (
                      <TouchableOpacity 
                        key={msg.id} 
                        style={styles.mediaItem}
                        onPress={() => setFullscreenMessage(msg)}
                      >
                        <View style={styles.videoThumbnail}>
                          <Ionicons name="play-circle" size={30} color="white" />
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>

              {/* Files Section */}
              <View style={styles.mediaSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Files</Text>
                  <TouchableOpacity style={styles.showMoreButton}>
                    <Text style={styles.showMoreText}>Show more</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.filesList}>
                  {messages
                    .filter(msg => msg.type === 'FILE' && msg.mediaUrl)
                    .slice(0, 5)
                    .map((msg, index) => (
                      <TouchableOpacity 
                        key={msg.id} 
                        style={styles.fileItem}
                        onPress={() => setFullscreenMessage(msg)}
                      >
                        <View style={styles.fileIcon}>
                          <Ionicons name="document" size={20} color="#007AFF" />
                        </View>
                        <Text style={styles.fileName} numberOfLines={1}>
                          File {index + 1}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Media Modal */}
      <Modal
        visible={fullscreenMessage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenMessage(null)}
      >
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity
            style={styles.fullscreenCloseButton}
            onPress={() => setFullscreenMessage(null)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          {fullscreenMessage && fullscreenMessage.mediaUrl && (
            <>
              {fullscreenMessage.type === 'IMAGE' && (
                <Image
                  source={{ uri: fullscreenMessage.mediaUrl }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              )}
              {fullscreenMessage.type === 'VIDEO' && (
                <View style={styles.fullscreenVideoContainer}>
                  <Ionicons name="play-circle" size={80} color="white" />
                  <Text style={styles.fullscreenVideoText}>Video Preview</Text>
                  <Text style={styles.fullscreenVideoSubtext}>Tap to play in fullscreen</Text>
                </View>
              )}
              {fullscreenMessage.type === 'FILE' && (
                <View style={styles.fullscreenFileContainer}>
                  <Ionicons name="document" size={80} color="#007AFF" />
                  <Text style={styles.fullscreenFileText}>File Preview</Text>
                  <Text style={styles.fullscreenFileSubtext}>Tap to download or open</Text>
                </View>
              )}
            </>
          )}
          
          {/* Action Buttons Toolbar */}
          {fullscreenMessage && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={async () => {
                  try {
                    console.log('Share button pressed');
                    if (fullscreenMessage?.mediaUrl) {
                      const result = await MediaService.shareMedia(fullscreenMessage.mediaUrl);
                      if (result.method === 'clipboard') {
                        Alert.alert('Success', 'Image URL copied to clipboard!');
                      }
                      // No alert needed for successful share via Web Share API
                    }
                  } catch (error) {
                    console.error('Failed to share media:', error);
                    Alert.alert('Error', 'Failed to share media');
                  }
                }}
              >
                <Ionicons name="share-outline" size={28} color="#007AFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  console.log('React button pressed');
                  setSelectedMessageForReaction(fullscreenMessage);
                  setReactionPickerVisible(true);
                }}
              >
                <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  setFullscreenMessage(null);
                  handleReplyPress(fullscreenMessage);
                }}
              >
                <Ionicons name="arrow-undo-outline" size={28} color="#007AFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={async () => {
                  try {
                    console.log('Save button pressed');
                    if (fullscreenMessage?.mediaUrl) {
                      await MediaService.saveMediaToLibrary(fullscreenMessage.mediaUrl);
                      Alert.alert('Success', 'Image saved to your photo library!');
                    }
                  } catch (error) {
                    console.error('Failed to save media:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Failed to save image to library';
                    if (errorMessage.includes('copied to clipboard')) {
                      Alert.alert(
                        'Development Mode', 
                        'In Expo Go, images can\'t be saved directly. This will work properly when the app is built and installed on your device! For now, the image URL has been copied to your clipboard.'
                      );
                    } else {
                      Alert.alert('Error', errorMessage);
                    }
                  }
                }}
              >
                <Ionicons name="download-outline" size={28} color="#007AFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Reaction Picker Modal */}
      <ReactionPicker
        visible={reactionPickerVisible}
        onClose={() => {
          setReactionPickerVisible(false);
          setSelectedMessageForReaction(null);
        }}
        onSelectEmoji={handleEmojiSelect}
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatSettingsModal: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  mediaSections: {
    flex: 1,
    padding: 20,
  },
  mediaSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  showMoreButton: {
    padding: 4,
  },
  showMoreText: {
    color: '#007AFF',
    fontSize: 16,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2c2c2e',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filesList: {
    gap: 10,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileName: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  // Fullscreen image styles
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    width: '100%',
    height: '100%',
  },
  fullscreenVideoText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  fullscreenVideoSubtext: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 8,
  },
  fullscreenFileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    width: '100%',
    height: '100%',
  },
  fullscreenFileText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  fullscreenFileSubtext: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 8,
  },
  // Action buttons styles
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 40, // Extra padding for home indicator
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
});
