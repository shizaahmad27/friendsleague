# Message Reactions - Complete Documentation

**Project**: FriendsLeague  
**Version**: 1.0  
**Date**: October 2025  
**Author**: Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [Realtime Events](#realtime-events)
5. [Flow](#flow)
6. [Frontend Implementation](#frontend-implementation)
7. [API Reference](#api-reference)
8. [Examples](#examples)
9. [Edge Cases & Notes](#edge-cases--notes)
10. [Security Considerations](#security-considerations)

---

## Overview

Message reactions allow users to attach emoji reactions to individual messages in one-on-one and group chats. Reactions are persisted in PostgreSQL (via Prisma) and broadcast in real time through Socket.io. Users must be authenticated and members of the chat to add/remove reactions.

Key points:
- One reaction per user per emoji per message (unique `[messageId, userId, emoji]`).
- Add is idempotent for the same emoji (upsert semantics).
- Remove deletes that specific user+emoji reaction.
- Grouped fetch returns counts and user lists per emoji.

---

## Database Schema

Prisma model (mapped to `message_reactions`):

```prisma
model MessageReaction {
  id        String   @id @default(cuid())
  messageId String
  userId    String
  emoji     String
  createdAt DateTime @default(now())

  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([messageId, userId, emoji])
  @@map("message_reactions")
}
```

Relational guarantees:
- CASCADE on message/user removal.
- Uniqueness on `(messageId, userId, emoji)` prevents duplicates.

---

## Backend Implementation

All endpoints are JWT-protected and validate chat membership.

Endpoints:

```ts
// POST /chats/messages/:messageId/reactions
// Body: { emoji: string }
// Adds (or refreshes timestamp on) the user's reaction for the emoji.

// DELETE /chats/messages/:messageId/reactions/:emoji
// Removes the user's reaction for the emoji.

// GET /chats/messages/:messageId/reactions
// Returns grouped reactions:
//   [{ emoji, count, users: [{ id, username, avatar }] }]
```

Service behavior:
- Validates `messageId` and ensures the user is a chat participant (via `chat_participants`).
- Add reaction: Prisma `upsert` on `[messageId,userId,emoji]`, includes `user { id, username, avatar }`.
- Remove reaction: `deleteMany` scoped to the `[messageId,userId,emoji]` triple.
- Get reactions: `findMany` + group by emoji in memory, ordered by `createdAt ASC`.

---

## Realtime Events

Socket.io events broadcast to the message’s chat room (`chatId`):

```text
Event: reactionAdded
Payload: {
  messageId: string,
  userId: string,
  emoji: string,
  reaction: { emoji: string, user: { id: string, username: string, avatar?: string | null } }
}

Event: reactionRemoved
Payload: {
  messageId: string,
  userId: string,
  emoji: string
}
```

Clients should join the chat room before receiving these events. The gateway relays to `server.to(chatId)` so all participants see live updates.

---

## Flow

End-to-end communication for reactions (add/remove) from UI → API → DB → Sockets → UI.

### Add Reaction Flow
```
User long-presses message → selects emoji
    ↓
Frontend calls POST /chats/messages/:messageId/reactions { emoji }
    ↓
ChatService.addReaction
    - Validate message exists and user is participant
    - Upsert MessageReaction (messageId, userId, emoji)
    - Include user { id, username, avatar }
    ↓
DB persists/updates reaction
    ↓
Gateway emits "reactionAdded" to room(chatId)
    ↓
All connected clients in chat receive event
    ↓
UIs update message.reactions (increment or append group; add user)
```

### Remove Reaction Flow
```
User toggles same emoji (or selects remove)
    ↓
Frontend calls DELETE /chats/messages/:messageId/reactions/:emoji
    ↓
ChatService.removeReaction
    - Validate message exists and user is participant
    - deleteMany({ messageId, userId, emoji })
    ↓
DB removes reaction row(s)
    ↓
Gateway emits "reactionRemoved" to room(chatId)
    ↓
All connected clients in chat receive event
    ↓
UIs update message.reactions (remove user from group; drop if count = 0)
```

### Fetch Reactions Flow (Hydration)
```
User opens older message thread
    ↓
Frontend calls GET /chats/messages/:messageId/reactions
    ↓
ChatService.getReactions
    - findMany({ messageId }) with user select
    - group in memory by emoji → { emoji, count, users[] }
    ↓
Frontend merges grouped reactions into local state
```

Notes:
- All HTTP calls carry Authorization: Bearer <accessToken> (handled by axios interceptor).
- Socket connection uses the same access token for auth in the handshake.
- UI can optimistically update, but server events are the source of truth.

---

## Frontend Implementation

UI/UX:
- Long-press a message to open `ReactionPicker` (default emojis: 👍, ❤️, 😂, 😮, 😢, ❓).
- Selecting an emoji toggles the user’s reaction for that emoji.
- `MessageReactions` renders chips with emoji + count; tapping can re-open the picker.

API helpers:

```ts
// Add reaction
await api.post(`/chats/messages/${messageId}/reactions`, { emoji });

// Remove reaction (emoji must be URL-encoded)
await api.delete(`/chats/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);

// Get grouped reactions
const { data } = await api.get(`/chats/messages/${messageId}/reactions`);
```

Socket handlers update in-memory state:
- On `reactionAdded`: increment the matching emoji group or append a new one, push the user to `users`.
- On `reactionRemoved`: remove the user from the emoji group; drop the group if count reaches 0.

Types (simplified):

```ts
export interface MessageReaction {
  emoji: string;
  count: number;
  users: Array<{ id: string; username: string; avatar?: string | null }>
}
```

---

## API Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/chats/messages/:messageId/reactions` | Add reaction emoji to message | Yes |
| DELETE | `/chats/messages/:messageId/reactions/:emoji` | Remove reaction emoji from message | Yes |
| GET | `/chats/messages/:messageId/reactions` | List grouped reactions for message | Yes |

---

## Examples

Add reaction request:
```json
POST /chats/messages/clxMsg123/reactions
{ "emoji": "❤️" }
```

Add reaction socket broadcast:
```json
{
  "messageId": "clxMsg123",
  "userId": "clxUser456",
  "emoji": "❤️",
  "reaction": {
    "emoji": "❤️",
    "user": { "id": "clxUser456", "username": "alice", "avatar": null }
  }
}
```

Grouped reactions response:
```json
[
  {
    "emoji": "❤️",
    "count": 2,
    "users": [
      { "id": "u1", "username": "alice", "avatar": null },
      { "id": "u2", "username": "bob", "avatar": "https://..." }
    ]
  },
  {
    "emoji": "😂",
    "count": 1,
    "users": [ { "id": "u3", "username": "carol", "avatar": null } ]
  }
]
```

---

## Edge Cases & Notes
- Duplicate adds with the same emoji from the same user are idempotent (upsert refreshes timestamp).
- Use `encodeURIComponent` for emojis in DELETE routes.
- Users cannot react in chats they don’t participate in (server-side check).
- Older messages can fetch reactions on demand to hydrate UI.

---

## Security Considerations
- JWT authentication enforced on endpoints and socket connection.
- Server validates chat participation before add/remove.
- Only the authenticated user can create/remove their own reactions.

---

**Document Information**
- **Last Updated**: October 2025
- **Version**: 1.0
- **Status**: Complete
- **Review Required**: Yes


