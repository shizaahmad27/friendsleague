# Ephemeral Viewed Status Real-Time Sync Issue - Comprehensive Debug

## Problem Description

When User A views an ephemeral photo/video sent by User B:
- ✅ User A's chat screen correctly shows "📷 Photo (viewed)" 
- ❌ User B's chat screen does NOT update to show that User A has viewed their message
- ❌ User B must exit and re-enter the chat to see the viewed status

## Expected Behavior

Both users should see the viewed status update in real-time:
- User A (viewer): "📷 Photo (viewed)" ✅ (working)
- User B (sender): "📷 Photo (viewed)" ❌ (not working)

## Current Implementation Analysis

### Backend (✅ Appears Correct)
**File:** `backend/src/chat/chat.service.ts` (lines 342-354)

```typescript
// Emit socket event to notify all participants about the viewed status
this.chatGateway.server.to(message.chatId).emit('ephemeralViewed', {
    messageId,
    viewedBy: userId,
    viewedAt: updatedMessage.ephemeralViewedAt,
});

// Also emit to sender's personal room for immediate notification
this.chatGateway.server.to(message.senderId).emit('ephemeralViewed', {
    messageId,
    viewedBy: userId,
    viewedAt: updatedMessage.ephemeralViewedAt,
});
```

**Analysis:** Backend emits to both chat room AND sender's personal room.

### Frontend Socket Service (✅ Appears Correct)
**File:** `mobile/src/services/socketService.ts` (lines 66-76)

```typescript
onEphemeralViewed(callback: (data: { messageId: string; viewedBy: string; viewedAt: string }) => void) {
  if (this.socket) {
    this.socket.on('ephemeralViewed', callback);
  }
}

offEphemeralViewed(callback: (data: { messageId: string; viewedBy: string; viewedAt: string }) => void) {
  if (this.socket) {
    this.socket.off('ephemeralViewed', callback);
  }
}
```

**Analysis:** Socket service correctly registers/unregisters listeners.

### Frontend Chat Socket Hook (✅ Recently Fixed)
**File:** `mobile/src/hooks/useChatSocket.ts` (lines 24-55)

```typescript
useEffect(() => {
  socketService.connect();
  socketService.joinChat(chatId, userId);
  socketService.joinUser(userId); // Join user's personal room for ephemeralViewed events

  socketService.onEphemeralViewed(onEphemeralViewed);
  // ... other listeners

  const onReconnect = () => {
    socketService.joinChat(chatId, userId);
    socketService.joinUser(userId); // Rejoin user room on reconnect
  };
  // ...
}, [chatId, userId, onNewMessage, onUserTyping, onReactionAdded, onReactionRemoved, onEphemeralViewed]);
```

**Analysis:** Hook joins both chat room AND personal room.

### Frontend Chat Screen Handler (✅ Appears Correct)
**File:** `mobile/src/screens/ChatScreen.tsx` (lines 295-306)

```typescript
const handleEphemeralViewed = useCallback((data: { messageId: string; viewedBy: string; viewedAt: string }) => {
  console.log('Ephemeral message viewed:', data);
  setMessages(prev => prev.map(msg => 
    msg.id === data.messageId 
      ? { 
          ...msg, 
          ephemeralViewedAt: data.viewedAt,
          ephemeralViewedBy: data.viewedBy
        }
      : msg
  ));
}, []);
```

**Analysis:** Handler correctly updates message state.

## Debugging Steps Required

### 1. Verify Socket Room Membership

**Check if User B is actually joined to their personal room:**

Add logging to verify room membership:

```typescript
// In useChatSocket.ts
useEffect(() => {
  socketService.connect();
  socketService.joinChat(chatId, userId);
  socketService.joinUser(userId);
  
  console.log(`User ${userId} joined chat ${chatId} and personal room ${userId}`);
  
  // ... rest of the code
}, [chatId, userId, ...]);
```

### 2. Verify Socket Event Reception

**Add comprehensive logging to track event flow:**

```typescript
// In ChatScreen.tsx - enhance handleEphemeralViewed
const handleEphemeralViewed = useCallback((data: { messageId: string; viewedBy: string; viewedAt: string }) => {
  console.log('🔍 EphemeralViewed event received:', {
    messageId: data.messageId,
    viewedBy: data.viewedBy,
    viewedAt: data.viewedAt,
    currentUserId: user?.id,
    chatId: chatId
  });
  
  setMessages(prev => prev.map(msg => {
    if (msg.id === data.messageId) {
      console.log('📝 Updating message:', msg.id, 'from', msg.ephemeralViewedAt, 'to', data.viewedAt);
      return { 
        ...msg, 
        ephemeralViewedAt: data.viewedAt,
        ephemeralViewedBy: data.viewedBy
      };
    }
    return msg;
  }));
}, [user?.id, chatId]);
```

### 3. Verify Backend Socket Emission

**Add logging to backend to confirm events are being emitted:**

```typescript
// In chat.service.ts - enhance markEphemeralAsViewed
async markEphemeralAsViewed(messageId: string, userId: string) {
  // ... existing code ...

  // Emit socket event to notify all participants about the viewed status
  console.log(`📡 Emitting ephemeralViewed to chat room: ${message.chatId}`);
  this.chatGateway.server.to(message.chatId).emit('ephemeralViewed', {
      messageId,
      viewedBy: userId,
      viewedAt: updatedMessage.ephemeralViewedAt,
  });
  
  // Also emit to sender's personal room for immediate notification
  console.log(`📡 Emitting ephemeralViewed to sender room: ${message.senderId}`);
  this.chatGateway.server.to(message.senderId).emit('ephemeralViewed', {
      messageId,
      viewedBy: userId,
      viewedAt: updatedMessage.ephemeralViewedAt,
  });

  return updatedMessage;
}
```

### 4. Check Socket Connection Status

**Verify socket is connected and rooms are joined:**

```typescript
// In socketService.ts - add debugging methods
getConnectionStatus() {
  return {
    connected: this.socket?.connected,
    id: this.socket?.id,
    rooms: this.socket?.rooms || []
  };
}

logRoomMembership() {
  console.log('Socket status:', this.getConnectionStatus());
}
```

### 5. Test Socket Event Flow

**Create a test to verify the complete flow:**

1. **User A** sends ephemeral message to **User B**
2. **User B** views the message
3. **Check logs** for:
   - Backend emission to both rooms
   - User A receiving the event
   - User A's message state updating

## Potential Issues to Investigate

### Issue 1: Socket Room Management
- User B might not be properly joined to their personal room
- Room membership might be lost on reconnection
- Multiple socket connections might interfere

### Issue 2: Event Handler Registration
- `onEphemeralViewed` callback might not be properly registered
- Callback might be overwritten by other components
- Event listener might be removed prematurely

### Issue 3: Message State Update
- `setMessages` might not trigger re-render
- Message might not be found in the state
- State update might be overridden by other updates

### Issue 4: Socket Event Timing
- Event might be received before component is ready
- Event might be received after component unmounts
- Race condition between different socket events

### Issue 5: Backend Room Emission
- `message.senderId` might be incorrect
- Room might not exist on server
- Socket gateway might not be properly configured

## Debugging Commands

### Frontend Debugging
```typescript
// Add to ChatScreen component
useEffect(() => {
  console.log('Current messages:', messages.map(m => ({
    id: m.id,
    isEphemeral: m.isEphemeral,
    ephemeralViewedAt: m.ephemeralViewedAt,
    ephemeralViewedBy: m.ephemeralViewedBy
  })));
}, [messages]);
```

### Backend Debugging
```typescript
// Add to chat.gateway.ts
@SubscribeMessage('joinUser')
handleJoinUser(client: Socket, data: { userId: string }) {
  console.log(`User ${data.userId} joined personal room`);
  client.join(data.userId);
}

@SubscribeMessage('joinChat')
handleJoinChat(client: Socket, data: { chatId: string; userId: string }) {
  console.log(`User ${data.userId} joined chat ${data.chatId}`);
  client.join(data.chatId);
}
```

## Expected Debug Output

### Successful Flow Logs:
```
📡 Emitting ephemeralViewed to chat room: chat123
📡 Emitting ephemeralViewed to sender room: user456
🔍 EphemeralViewed event received: { messageId: "msg789", viewedBy: "user123", viewedAt: "2024-01-01T12:00:00Z", currentUserId: "user456", chatId: "chat123" }
📝 Updating message: msg789 from null to 2024-01-01T12:00:00Z
```

### Failed Flow Indicators:
- Missing "📡 Emitting ephemeralViewed to sender room" log
- Missing "🔍 EphemeralViewed event received" log for sender
- "📝 Updating message" log shows no change
- Socket connection status shows disconnected

## Files to Modify for Debugging

1. `mobile/src/screens/ChatScreen.tsx` - Add comprehensive logging
2. `mobile/src/hooks/useChatSocket.ts` - Add room membership logging
3. `mobile/src/services/socketService.ts` - Add connection status methods
4. `backend/src/chat/chat.service.ts` - Add emission logging
5. `backend/src/chat/chat.gateway.ts` - Add room join logging

## Next Steps

1. **Add all debugging logs** to track the complete event flow
2. **Test with two devices/users** to see which step fails
3. **Check browser/device console** for error messages
4. **Verify socket connection** is stable throughout the process
5. **Confirm room membership** is maintained during the flow

## Success Criteria

The issue is resolved when:
- ✅ User A views ephemeral message
- ✅ User B's chat screen immediately updates to show "viewed" status
- ✅ No need to exit/re-enter chat to see the update
- ✅ Real-time synchronization works consistently
