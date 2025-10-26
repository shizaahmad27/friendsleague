# Ephemeral Viewed Status Debug Test Plan

## 🎯 Objective
Test the complete event flow for ephemeral message viewed status synchronization between users.

## 🔧 Debugging Features Added

### Frontend Logging
1. **Socket Room Membership** (`useChatSocket.ts`)
   - Logs when user joins chat and personal room
   - Logs reconnection events
   - Shows socket connection status

2. **Event Reception** (`ChatScreen.tsx`)
   - Comprehensive logging of `ephemeralViewed` events
   - Tracks message state updates
   - Shows current message state with ephemeral status

3. **Socket Service** (`socketService.ts`)
   - Added connection status methods
   - Room membership logging

### Backend Logging
1. **Chat Service** (`chat.service.ts`)
   - Logs socket emissions to chat room and sender room
   - Shows which rooms events are sent to

2. **Chat Gateway** (`chat.gateway.ts`)
   - Enhanced logging for room joins
   - Shows when users join chat and personal rooms

## 🧪 Test Procedure

### Step 1: Setup
1. **Start Backend Server**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start Mobile App** (2 instances)
   ```bash
   cd mobile
   npm start
   # Run on 2 different devices/simulators
   ```

### Step 2: Test Flow
1. **User A** and **User B** both open the same chat
2. **User A** sends an ephemeral photo/video to **User B**
3. **User B** views the ephemeral message
4. **Check logs** for the complete event flow

### Step 3: Expected Log Sequence

#### Successful Flow:
```
# Backend logs:
🏠 User userA joined chat chat123
👤 User userA joined their personal room and is now online
🏠 User userB joined chat chat123
👤 User userB joined their personal room and is now online

# When User B views ephemeral message:
📡 Emitting ephemeralViewed to chat room: chat123
📡 Emitting ephemeralViewed to sender room: userA

# Frontend logs (User A - sender):
🔌 User userA joined chat chat123 and personal room userA
🔌 Socket status: { connected: true, id: "socket123" }
🔍 EphemeralViewed event received: { messageId: "msg789", viewedBy: "userB", viewedAt: "2024-01-01T12:00:00Z", currentUserId: "userA", chatId: "chat123" }
📝 Updating message: msg789 from null to 2024-01-01T12:00:00Z
📊 Current messages state: [array of messages with updated ephemeral status]

# Frontend logs (User B - viewer):
🔌 User userB joined chat chat123 and personal room userB
🔌 Socket status: { connected: true, id: "socket456" }
🔍 EphemeralViewed event received: { messageId: "msg789", viewedBy: "userB", viewedAt: "2024-01-01T12:00:00Z", currentUserId: "userB", chatId: "chat123" }
📝 Updating message: msg789 from null to 2024-01-01T12:00:00Z
```

#### Failed Flow Indicators:
- Missing "📡 Emitting ephemeralViewed to sender room" log
- Missing "🔍 EphemeralViewed event received" log for sender
- "📝 Updating message" log shows no change
- Socket connection status shows disconnected

## 🔍 Debugging Checklist

### Check These Issues:
1. **Socket Connection**
   - Are both users connected to socket?
   - Are they joined to their personal rooms?

2. **Event Emission**
   - Is backend emitting to both chat room AND sender room?
   - Are the room IDs correct?

3. **Event Reception**
   - Is sender receiving the `ephemeralViewed` event?
   - Is the event handler being called?

4. **State Update**
   - Is the message state being updated?
   - Is the UI re-rendering with new state?

## 🚨 Common Issues to Look For

### Issue 1: Room Membership
- User not joined to personal room
- Room membership lost on reconnection
- Multiple socket connections interfering

### Issue 2: Event Handler Registration
- `onEphemeralViewed` callback not registered
- Callback overwritten by other components
- Event listener removed prematurely

### Issue 3: Message State Update
- `setMessages` not triggering re-render
- Message not found in state
- State update overridden by other updates

### Issue 4: Socket Event Timing
- Event received before component ready
- Event received after component unmounts
- Race condition between socket events

## 📱 Testing Commands

### Frontend Debug Commands
```javascript
// In browser console or React Native debugger:
// Check socket connection
socketService.getConnectionStatus()

// Check current messages
console.log('Messages:', messages)

// Manually trigger ephemeral viewed
socketService.getSocket().emit('ephemeralViewed', {
  messageId: 'test123',
  viewedBy: 'userB',
  viewedAt: new Date().toISOString()
})
```

### Backend Debug Commands
```bash
# Check if server is running
curl http://localhost:3000/health

# Check socket connections
# Look for connection logs in backend console
```

## ✅ Success Criteria

The issue is resolved when:
- ✅ User A views ephemeral message
- ✅ User B's chat screen immediately updates to show "viewed" status
- ✅ No need to exit/re-enter chat to see the update
- ✅ Real-time synchronization works consistently
- ✅ All debug logs show successful event flow

## 📋 Next Steps After Testing

1. **If logs show successful flow but UI doesn't update:**
   - Check React state management
   - Verify component re-rendering
   - Check for state update conflicts

2. **If logs show missing events:**
   - Check socket room membership
   - Verify backend emission logic
   - Check socket connection stability

3. **If logs show events but wrong data:**
   - Check message ID matching
   - Verify user ID consistency
   - Check timestamp formatting

## 🎯 Expected Outcome

After implementing these debugging features, you should be able to:
1. **Identify exactly where** the event flow breaks
2. **See real-time logs** of the complete process
3. **Pinpoint the root cause** of the synchronization issue
4. **Fix the specific problem** with targeted changes

The debugging logs will show you the complete journey of the `ephemeralViewed` event from backend emission to frontend state update, making it easy to identify and fix the issue.
