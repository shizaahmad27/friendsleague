# Messaging Logic Implementation - Complete Documentation

**Project**: FriendsLeague  
**Version**: 1.0  
**Date**: January 2024  
**Author**: Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [One-on-One Messaging](#one-on-one-messaging)
4. [Group Messaging](#group-messaging)
5. [Real-time Features](#real-time-features)
6. [Backend Implementation](#backend-implementation)
7. [Frontend Implementation](#frontend-implementation)
8. [API Reference](#api-reference)
9. [Code Examples](#code-examples)

---

## Overview

The FriendsLeague app implements a comprehensive messaging system that supports both one-on-one conversations and group chats. The system provides real-time messaging capabilities using WebSockets, message persistence, read receipts, typing indicators, and unread message counts.

### Key Features
- **One-on-One Messaging**: Direct conversations between friends
- **Group Messaging**: Multi-participant group chats with admin controls
- **Real-time Communication**: WebSocket-based instant messaging
- **Message Persistence**: All messages stored in PostgreSQL database
- **Read Receipts**: Track when messages are read by participants
- **Typing Indicators**: Real-time typing status notifications
- **Unread Counts**: Track unread messages per chat
- **Message Types**: Support for text, images, videos, and files
- **Online Status**: Real-time user presence indicators

---

## Database Schema

### Core Models

#### Chat Model
```prisma
model Chat {
  id        String   @id @default(cuid())
  name      String?  // Group chat name (null for direct chats)
  type      ChatType @default(DIRECT)  // DIRECT or GROUP
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  participants ChatParticipant[]  // Users in this chat
  messages     Message[]          // Messages in this chat

  @@map("chats")
}
```

#### ChatParticipant Model
```prisma
model ChatParticipant {
  id         String   @id @default(cuid())
  chatId     String   // Reference to chat
  userId     String   // Reference to user
  joinedAt   DateTime @default(now())    // When user joined
  lastReadAt DateTime @default(now())    // Last time user read messages

  // Relations
  chat Chat @relation(fields: [chatId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([chatId, userId])  // Prevents duplicate participants
  @@map("chat_participants")
}
```

#### Message Model
```prisma
model Message {
  id        String      @id @default(cuid())
  content   String      // Message content
  type      MessageType @default(TEXT)  // TEXT, IMAGE, VIDEO, FILE
  senderId  String      // User who sent the message
  chatId    String      // Chat this message belongs to
  mediaUrl  String?     // URL for media files
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  // Relations
  sender User @relation("MessageSender", fields: [senderId], references: [id], onDelete: Cascade)
  chat   Chat @relation(fields: [chatId], references: [id], onDelete: Cascade)

  @@map("messages")
}
```

#### Enums
```prisma
enum ChatType {
  DIRECT  // One-on-one conversation
  GROUP   // Multi-participant group chat
}

enum MessageType {
  TEXT   // Text message
  IMAGE  // Image file
  VIDEO  // Video file
  FILE   // Other file types
}
```

---

## One-on-One Messaging

### Database Logic

#### Chat Creation
- **Automatic Creation**: Direct chats are created automatically when users start messaging
- **Duplicate Prevention**: System checks for existing direct chat between two users
- **Participant Management**: Exactly two participants (the two users)
- **No Chat Name**: Direct chats don't have names (name field is null)

#### Message Storage
- **Persistent Storage**: All messages stored in database with full metadata
- **Sender Information**: Each message linked to sender user
- **Timestamp Tracking**: Created and updated timestamps for all messages
- **Content Types**: Support for different message types (text, media)

#### Read Receipts
- **Last Read Tracking**: `lastReadAt` field in ChatParticipant tracks when user last read messages
- **Unread Calculation**: Unread count calculated by counting messages after `lastReadAt`
- **Per-User Tracking**: Each participant has their own read status

### Backend Implementation

#### Chat Service Methods

**`createDirectChat(userId1: string, userId2: string)`**
```typescript
async createDirectChat(userId1: string, userId2: string) {
  // Check if chat already exists between these users
  const existingChat = await this.prisma.chat.findFirst({
    where: {
      type: ChatType.DIRECT,
      participants: {
        every: {
          userId: {
            in: [userId1, userId2],
          },
        },
      },
    },
  });

  if (existingChat) {
    return existingChat;  // Return existing chat
  }

  // Create new direct chat with both participants
  const chat = await this.prisma.chat.create({
    data: {
      type: ChatType.DIRECT,
      participants: {
        create: [
          { userId: userId1 },
          { userId: userId2 },
        ],
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isOnline: true,
            },
          },
        },
      },
    },
  });

  return chat;
}
```

**`sendMessage(chatId: string, senderId: string, content: string, type: MessageType)`**
```typescript
async sendMessage(chatId: string, senderId: string, content: string, type: MessageType = MessageType.TEXT) {
  // Create message in database
  const message = await this.prisma.message.create({
    data: {
      content,
      type,
      senderId,
      chatId,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  // Update chat's updatedAt timestamp
  await this.prisma.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });

  return message;
}
```

**`markChatRead(chatId: string, userId: string)`**
```typescript
async markChatRead(chatId: string, userId: string) {
  // Update user's lastReadAt timestamp
  await this.prisma.chatParticipant.update({
    where: { chatId_userId: { chatId, userId } },
    data: { lastReadAt: new Date() },
  });
  
  return { success: true };
}
```

#### API Endpoints

**Create Direct Chat**
```typescript
@Post('direct')
async createDirectChat(
  @Request() req: any,
  @Body() body: { friendId: string },
) {
  return this.chatService.createDirectChat(req.user.id, body.friendId);
}
```

**Send Message**
```typescript
@Post(':chatId/messages')
async sendMessage(
  @Param('chatId') chatId: string,
  @Request() req: any,
  @Body() body: { content: string; type?: string },
) {
  return this.chatService.sendMessage(
    chatId,
    req.user.id,
    body.content,
    (body.type as MessageType) || MessageType.TEXT,
  );
}
```

### Frontend Implementation

#### Chat API Service
```typescript
export const chatApi = {
  // Create direct chat with a friend
  createDirectChat: async (friendId: string): Promise<Chat> => {
    const response = await api.post('/chats/direct', { friendId });
    return response.data;
  },

  // Send message
  sendMessage: async (chatId: string, content: string, type = 'TEXT'): Promise<Message> => {
    const response = await api.post(`/chats/${chatId}/messages`, { content, type });
    return response.data;
  },

  // Mark chat as read
  markChatRead: async (chatId: string): Promise<{ success: boolean }> => {
    const response = await api.put(`/chats/${chatId}/read`);
    return response.data;
  },
};
```

#### Chat Screen Implementation
```typescript
export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // Send message via API
      const message = await chatApi.sendMessage(chatId, messageContent);
      
      // Add message to local state
      const messageWithSender = { ...message, senderId: user.id };
      setMessages(prev => [messageWithSender, ...prev]);

      // Send via WebSocket for real-time delivery
      socketService.sendMessage(chatId, messageWithSender);
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageContent);  // Restore message on error
    }
  };
}
```

---

## Group Messaging

### Database Logic

#### Group Chat Creation
- **Named Chats**: Group chats have names and optional descriptions
- **Multiple Participants**: Support for unlimited participants
- **Admin Management**: Creator becomes admin with management privileges
- **Participant Tracking**: Each participant has join timestamp and read status

#### Group Management
- **Add Participants**: Add new members to existing group chats
- **Remove Participants**: Remove members from group chats
- **Update Group Info**: Modify group name and description
- **Participant List**: Track all current and past participants

### Backend Implementation

#### Group Chat Service Methods

**`createGroupChat(adminId: string, name: string, description: string, participantIds: string[])`**
```typescript
async createGroupChat(adminId: string, name: string, description: string, participantIds: string[]) {
  // Ensure admin is included in participants
  const allParticipantIds = [...new Set([adminId, ...participantIds])];

  const chat = await this.prisma.chat.create({
    data: {
      name,
      type: ChatType.GROUP,
      participants: {
        create: allParticipantIds.map(userId => ({
          userId,
        })),
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isOnline: true,
            },
          },
        },
      },
    },
  });

  return chat;
}
```

**`addParticipantsToGroup(chatId: string, participantIds: string[])`**
```typescript
async addParticipantsToGroup(chatId: string, participantIds: string[]) {
  // Verify chat is a group chat
  const chat = await this.prisma.chat.findUnique({
    where: { id: chatId },
    select: { type: true },
  });

  if (!chat || chat.type !== ChatType.GROUP) {
    throw new Error('Can only add participants to group chats');
  }

  // Add participants (ignore duplicates)
  const participants = await Promise.all(
    participantIds.map(userId =>
      this.prisma.chatParticipant.upsert({
        where: {
          chatId_userId: {
            chatId,
            userId,
          },
        },
        update: {},
        create: {
          chatId,
          userId,
        },
      })
    )
  );

  return participants;
}
```

**`removeParticipantFromGroup(chatId: string, userId: string)`**
```typescript
async removeParticipantFromGroup(chatId: string, userId: string) {
  // Verify chat is a group chat
  const chat = await this.prisma.chat.findUnique({
    where: { id: chatId },
    select: { type: true },
  });

  if (!chat || chat.type !== ChatType.GROUP) {
    throw new Error('Can only remove participants from group chats');
  }

  // Remove participant
  await this.prisma.chatParticipant.delete({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
  });

  return { success: true };
}
```

#### API Endpoints

**Create Group Chat**
```typescript
@Post('group')
async createGroupChat(
  @Request() req: any,
  @Body() body: { name: string; description: string; participantIds: string[] },
) {
  return this.chatService.createGroupChat(
    req.user.id,
    body.name,
    body.description,
    body.participantIds,
  );
}
```

**Add Participants**
```typescript
@Post(':chatId/participants')
async addParticipantsToGroup(
  @Param('chatId') chatId: string,
  @Body() body: { participantIds: string[] },
) {
  return this.chatService.addParticipantsToGroup(chatId, body.participantIds);
}
```

### Frontend Implementation

#### Group Chat Creation Screen
```typescript
export default function CreateGroupChatScreen() {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedFriends.length === 0) {
      Alert.alert('Error', 'Please select at least one friend');
      return;
    }

    try {
      const chat = await chatApi.createGroupChat(
        groupName.trim(),
        description.trim(),
        selectedFriends
      );
      
      // Navigate to the new group chat
      navigation.navigate('Chat', { chatId: chat.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to create group chat');
    }
  };
}
```

#### Group Chat Settings Screen
```typescript
export default function GroupChatSettingsScreen() {
  const [participants, setParticipants] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);

  const handleAddMembers = async (selectedFriends: string[]) => {
    try {
      await chatApi.addParticipantsToGroup(chatId, selectedFriends);
      loadGroupData();  // Refresh participant list
      setShowAddMembers(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add members');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await chatApi.removeParticipantFromGroup(chatId, userId);
      loadGroupData();  // Refresh participant list
    } catch (error) {
      Alert.alert('Error', 'Failed to remove member');
    }
  };
}
```

---

## Real-time Features

### WebSocket Implementation

#### Backend Gateway
```typescript
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>();  // socketId -> userId

  async handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  async handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      this.server.emit('user:offline', { userId });
    }
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(
    @MessageBody() data: { chatId: string; userId: string}, 
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.chatId);
    this.connectedUsers.set(client.id, data.userId);
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @MessageBody() data: { chatId: string; message: any },
    @ConnectedSocket() client: Socket, 
  ) {
    // Broadcast message to all users in the chat
    this.server.to(data.chatId).emit('newMessage', data.message);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { chatId: string; userId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.chatId).emit('user:typing', {
      userId: data.userId,
      isTyping: data.isTyping,
    });
  }
}
```

#### Frontend Socket Service
```typescript
class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    const { user, accessToken } = useAuthStore.getState();
    if (!user || !accessToken) return;

    this.socket = io('http://192.168.0.110:3000', {
      auth: {
        token: accessToken,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });
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

  emitTyping(chatId: string, userId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { chatId, userId, isTyping });
    }
  }
}
```

### Typing Indicators

#### Implementation
```typescript
// Frontend: Handle typing events
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

// Listen for typing events from other users
useEffect(() => {
  const handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
    if (data.userId !== user?.id) {
      setTypingUsers(prev => 
        data.isTyping 
          ? [...prev.filter(id => id !== data.userId), data.userId]
          : prev.filter(id => id !== data.userId)
      );
    }
  };

  socketService.onUserTyping(handleUserTyping);
  return () => socketService.offUserTyping(handleUserTyping);
}, [user?.id]);
```

---

## Backend Implementation

### Chat Service Complete Implementation

```typescript
@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // Get user's chats with unread counts
  async getUserChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true,
              },
            },
          },
          where: {
            userId: { not: userId },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Calculate unread counts
    const chatsWithUnreadCount = await Promise.all(
      chats.map(async (chat) => {
        const participant = await this.prisma.chatParticipant.findUnique({
          where: { chatId_userId: { chatId: chat.id, userId } },
        });
        const lastReadAt = participant?.lastReadAt ?? new Date(0);
        const unreadCount = await this.prisma.message.count({
          where: {
            chatId: chat.id,
            senderId: { not: userId },
            createdAt: { gt: lastReadAt },
          },
        });
        return { ...chat, unreadCount };
      })
    );

    return chatsWithUnreadCount;
  }

  // Get chat messages with pagination
  async getChatMessages(chatId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    return this.prisma.message.findMany({
      where: {
        chatId: chatId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });
  }
}
```

---

## Frontend Implementation

### Chat List Screen

```typescript
export default function ChatListScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChats();
    socketService.connect();

    // Listen for new messages to update chat list
    socketService.onNewMessage((message) => {
      loadChats();
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const loadChats = async () => {
    try {
      const data = await chatApi.getUserChats();
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderChat = ({ item }: { item: Chat }) => {
    const isGroupChat = item.type === 'GROUP';
    const otherParticipant = item.participants.find(p => p.user.id !== user?.id);
    const displayName = isGroupChat ? item.name : otherParticipant?.user.username;
    const unreadCount = item.unreadCount || 0;
    const lastMessage = item.lastMessage ?? item.messages?.[0] ?? null;
    
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', { chatId: item.id })}
      >
        <View style={[styles.avatar, isGroupChat && styles.groupAvatar]}>
          <Text style={styles.avatarText}>
            {displayName?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.username}>{displayName}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage?.content || 'No messages yet'}
          </Text>
        </View>
        <View style={styles.chatMeta}>
          <Text style={styles.timestamp}>
            {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : ''}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
}
```

---

## API Reference

### Chat Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/chats/direct` | Create direct chat | Yes |
| GET | `/chats/chats` | Get user's chats | Yes |
| GET | `/chats/:chatId/messages` | Get chat messages | Yes |
| POST | `/chats/:chatId/messages` | Send message | Yes |
| PUT | `/chats/:chatId/read` | Mark chat as read | Yes |
| POST | `/chats/group` | Create group chat | Yes |
| GET | `/chats/:chatId/participants` | Get group participants | Yes |
| POST | `/chats/:chatId/participants` | Add participants | Yes |
| DELETE | `/chats/:chatId/participants/:userId` | Remove participant | Yes |
| PUT | `/chats/:chatId` | Update group info | Yes |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `joinChat` | Client → Server | Join a chat room |
| `sendMessage` | Client → Server | Send message to chat |
| `typing` | Client → Server | Send typing status |
| `newMessage` | Server → Client | Receive new message |
| `user:typing` | Server → Client | Receive typing status |
| `user:offline` | Server → Client | User went offline |

---

## Code Examples

### Complete Message Flow

#### 1. Create Direct Chat
```typescript
// Frontend: Start conversation with friend
const handleMessageFriend = async (friend: User) => {
  try {
    const chat = await chatApi.createDirectChat(friend.id);
    navigation.navigate('Chat', { chatId: chat.id });
  } catch (error) {
    Alert.alert('Error', 'Failed to start conversation');
  }
};
```

#### 2. Send Message
```typescript
// Frontend: Send message
const sendMessage = async () => {
  if (!newMessage.trim() || !user?.id) return;

  const messageContent = newMessage.trim();
  setNewMessage('');

  try {
    // Save to database
    const message = await chatApi.sendMessage(chatId, messageContent);
    
    // Add to local state
    setMessages(prev => [message, ...prev]);

    // Send via WebSocket
    socketService.sendMessage(chatId, message);
  } catch (error) {
    setNewMessage(messageContent);  // Restore on error
  }
};
```

#### 3. Real-time Message Reception
```typescript
// Frontend: Listen for new messages
useEffect(() => {
  const handleNewMessage = (message: Message) => {
    if (message.chatId === chatId) {
      setMessages(prev => [message, ...prev]);
    }
  };

  socketService.onNewMessage(handleNewMessage);
  return () => socketService.offNewMessage(handleNewMessage);
}, [chatId]);
```

#### 4. Mark as Read
```typescript
// Frontend: Mark chat as read when opened
useEffect(() => {
  const markAsRead = async () => {
    try {
      await chatApi.markChatRead(chatId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  markAsRead();
}, [chatId]);
```

---

## Conclusion

This messaging system provides a robust, scalable foundation for real-time communication in the FriendsLeague app. The implementation supports both one-on-one and group messaging with comprehensive features including read receipts, typing indicators, and unread counts. The system is designed to handle high message volumes and provides a smooth user experience with real-time updates.

### Key Strengths
- **Real-time Communication**: WebSocket-based instant messaging
- **Message Persistence**: All messages stored in PostgreSQL
- **Scalable Architecture**: Clean separation between direct and group chats
- **User Experience**: Typing indicators, read receipts, unread counts
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error management

---

**Document Information**
- **Last Updated**: January 2024
- **Version**: 1.0
- **Status**: Complete
- **Review Required**: Yes
