# Friends Logic Implementation - Complete Documentation

**Project**: FriendsLeague  
**Version**: 1.0  
**Date**: January 2024  
**Author**: Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Friend Request Flow](#friend-request-flow)
6. [Security Features](#security-features)
7. [Real-time Features](#real-time-features)
8. [Error Handling](#error-handling)
9. [API Reference](#api-reference)
10. [Code Examples](#code-examples)

---

## Overview

The FriendsLeague app implements a comprehensive friends system that allows users to connect through two main methods:

1. **Direct Invitations** - Send friend requests to specific users by username
2. **Invite Codes** - Share unique codes that others can use to send friend requests

### Key Features
- User search and discovery
- Bidirectional friendship management
- Real-time online status tracking
- Secure invite code system
- Comprehensive invitation management
- Detailed last-seen timestamps

---

## Database Schema

### Core Models

#### User Model
```prisma
model User {
  id          String   @id @default(cuid())
  username    String   @unique
  email       String?  @unique
  phoneNumber String?  @unique
  password    String
  avatar      String?
  inviteCode  String?  @unique  // Unique 8-character code for invitations
  isOnline    Boolean  @default(false)
  lastSeen    DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  friendships      Friendship[]       @relation("UserFriendships")
  friendOf         Friendship[]       @relation("FriendOf")
  sentInvitations  Invitation[]       @relation("Inviter")
  receivedInvitations Invitation[]    @relation("Invitee")
}
```

#### Friendship Model
```prisma
model Friendship {
  id       String        @id @default(cuid())
  userId   String        // The user who initiated the friendship
  friendId String        // The friend being added
  status   FriendshipStatus @default(PENDING)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user   User @relation("UserFriendships", fields: [userId], references: [id], onDelete: Cascade)
  friend User @relation("FriendOf", fields: [friendId], references: [id], onDelete: Cascade)

  @@unique([userId, friendId])  // Prevents duplicate friendships
}
```

#### Invitation Model
```prisma
model Invitation {
  id        String @id @default(cuid())
  code      String @unique  // Auto-generated invitation code
  inviterId String          // User who sent the invitation
  inviteeId String?         // User who received the invitation (optional for invite codes)
  status    FriendshipStatus @default(PENDING)
  expiredAt DateTime        // 7 days from creation
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  inviter User @relation("Inviter", fields: [inviterId], references: [id])
  invitee User? @relation("Invitee", fields: [inviteeId], references: [id])
}
```

#### Enums
```prisma
enum FriendshipStatus {
  PENDING   // Friend request sent but not yet accepted
  ACCEPTED  // Friendship established
  BLOCKED   // Invitation rejected or cancelled
}
```

---

## Backend Implementation

### 1. Users Service (`users.service.ts`)

#### Key Methods:

**`getUserFriends(userId: string)`**
- Fetches all accepted friendships for a user
- Returns friend details (excluding password)
- Orders by most recently updated

```typescript
async getUserFriends(userId: string): Promise<UserWithoutPassword[]> {
  const friendships = await this.prisma.friendship.findMany({
    where: {
      userId,
      status: 'ACCEPTED',
    },
    include: {
      friend: {
        select: {
          id: true,
          username: true,
          email: true,
          phoneNumber: true,
          inviteCode: true,
          avatar: true,
          isOnline: true,
          lastSeen: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return friendships.map(friendship => friendship.friend);
}
```

**`searchUsers(username: string)`**
- Searches users by username (case-insensitive)
- Returns up to 10 results
- Excludes password field

**`updateOnlineStatus(id: string, isOnline: boolean)`**
- Updates user's online status
- Automatically updates `lastSeen` timestamp when going offline

### 2. Invitation Service (`invitation.service.ts`)

#### Key Methods:

**`createInvitation(inviterId: string, inviteeId: string)`**
- Creates a direct invitation between two users
- Validates both users exist
- Checks for existing friendships and pending invitations
- Sets 7-day expiration

**`useInviteCode(userId: string, code: string)`**
- Handles invite code usage
- Finds inviter by their invite code
- Creates invitation (not immediate friendship)
- Prevents self-invitation and duplicate requests

**`acceptInvitation(invitationId: string, userId: string)`**
- Accepts a pending invitation
- Creates bidirectional friendship records
- Updates invitation status to ACCEPTED

**`rejectInvitation(invitationId: string, userId: string)`**
- Rejects a pending invitation
- Updates invitation status to BLOCKED

**`getMyInviteCode(userId: string)`**
- Generates or retrieves user's invite code
- Uses HMAC-SHA256 for secure code generation
- 8-character uppercase codes

### 3. API Controllers

#### Users Controller (`users.controller.ts`)
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('search')           // Search users by username
  @Get('friends')          // Get user's friends
  @Put('online-status')    // Update online status
}
```

#### Invitation Controller (`invitation.controller.ts`)
```typescript
@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationController {
  @Post()                  // Create direct invitation
  @Get()                   // Get all invitations
  @Get('pending')          // Get pending invitations
  @Put(':id/accept')       // Accept invitation
  @Put(':id/reject')       // Reject invitation
  @Delete(':id')           // Cancel invitation
  @Post('use-code')        // Use invite code
  @Get('my-code')          // Get my invite code
}
```

---

## Frontend Implementation

### 1. API Services

#### Users API (`usersApi.ts`)
```typescript
export const usersApi = {
  searchUsers: async (username: string): Promise<User[]>
  getUserById: async (userId: string): Promise<User>
  getUserFriends: async (): Promise<User[]>
  updateOnlineStatus: async (isOnline: boolean): Promise<{success: boolean; message: string}>
}
```

#### Invitation API (`invitationApi.ts`)
```typescript
export const invitationApi = {
  createInvitation: async (inviteeId: string): Promise<Invitation>
  getInvitations: async (): Promise<Invitation[]>
  getPendingInvitations: async (): Promise<Invitation[]>
  acceptInvitation: async (invitationId: string): Promise<Invitation>
  rejectInvitation: async (invitationId: string): Promise<Invitation>
  cancelInvitation: async (invitationId: string): Promise<Invitation>
  useInviteCode: async (code: string): Promise<UseInviteCodeResponse>
  getMyInviteCode: async (): Promise<MyInviteCodeResponse>
}
```

### 2. Screen Components

#### FriendsScreen (`FriendsScreen.tsx`)
**Purpose**: Main interface for discovering and managing friends

**Key Features**:
- **User Search**: Search for users by username
- **Send Invitations**: Send friend requests to found users
- **View Invitations**: See pending invitations (sent and received)
- **Manage Invitations**: Accept/reject/cancel invitations

**State Management**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState<User[]>([]);
const [invitations, setInvitations] = useState<Invitation[]>([]);
const [friends, setFriends] = useState<User[]>([]);
```

**Key Functions**:
- `handleSearch()`: Searches users and filters out existing friends
- `handleSendInvitation()`: Creates invitation to specific user
- `handleAcceptInvitation()`: Accepts pending invitation
- `handleRejectInvitation()`: Rejects pending invitation

#### ActiveFriendsScreen (`ActiveFriendsScreen.tsx`)
**Purpose**: Display list of current friends with online status

**Key Features**:
- **Friends List**: Shows all accepted friends
- **Online Status**: Real-time online/offline indicators
- **Last Seen**: Detailed timestamp formatting
- **Actions**: Message and profile view buttons

**Last Seen Formatting**:
```typescript
const formatLastSeen = (lastSeen: string): string => {
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  // ... more formatting logic
};
```

#### InviteCodeScreen (`InviteCodeScreen.tsx`)
**Purpose**: Handle invite code sharing and usage

**Key Features**:
- **My Invite Code**: Display user's unique invite code
- **Copy to Clipboard**: Easy sharing functionality
- **Use Invite Code**: Enter someone else's code to send friend request
- **Validation**: Prevents self-invitation and duplicate requests

**Key Functions**:
- `loadMyInviteCode()`: Fetches user's invite code from backend
- `handleUseInviteCode()`: Processes invite code usage
- `handleCopyCode()`: Copies invite code to clipboard

### 3. Type Definitions

#### User Interface
```typescript
export interface User {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;  // ISO string format
  createdAt: string;
  updatedAt: string;
}
```

#### Invitation Interface
```typescript
export interface Invitation {
  id: string;
  code: string;
  inviterId: string;
  inviteeId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
  expiredAt: string;
  createdAt: string;
  updatedAt: string;
  inviter?: {
    id: string;
    username: string;
    avatar?: string;
  };
  invitee?: {
    id: string;
    username: string;
    avatar?: string;
  };
}
```

---

## Friend Request Flow

### 1. Direct Invitation Flow
```
User A searches for User B
    ↓
User A sends invitation to User B
    ↓
Invitation created with status PENDING
    ↓
User B sees invitation in pending list
    ↓
User B accepts/rejects invitation
    ↓
If accepted: Bidirectional friendship created
If rejected: Invitation status set to BLOCKED
```

### 2. Invite Code Flow
```
User A shares their invite code
    ↓
User B enters User A's invite code
    ↓
System creates invitation (User B → User A)
    ↓
User A sees invitation in pending list
    ↓
User A accepts/rejects invitation
    ↓
If accepted: Bidirectional friendship created
If rejected: Invitation status set to BLOCKED
```

---

## Security Features

### 1. Authentication
- All endpoints protected with JWT authentication
- User context extracted from JWT token

### 2. Validation
- Prevents self-invitation
- Prevents duplicate friendships
- Validates user existence before creating invitations
- Invite codes expire after 7 days

### 3. Data Protection
- Passwords excluded from all user queries
- Sensitive fields filtered in API responses
- Unique constraints prevent duplicate relationships

---

## Real-time Features

### 1. Online Status
- `isOnline` boolean field tracks current status
- `lastSeen` timestamp updated when going offline
- Frontend displays real-time status indicators

### 2. Status Updates
- Automatic `lastSeen` updates when status changes
- Detailed timestamp formatting for user-friendly display
- Pulsing animation for online users

---

## Error Handling

### Backend
- Comprehensive validation with descriptive error messages
- HTTP status codes for different error types
- Conflict detection for duplicate operations

### Frontend
- User-friendly error alerts
- Loading states during API calls
- Graceful handling of network errors
- Input validation before API calls

---

## API Reference

### Users Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/search?username={username}` | Search users by username | Yes |
| GET | `/users/friends` | Get user's friends | Yes |
| PUT | `/users/online-status` | Update online status | Yes |

### Invitation Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/invitations` | Create direct invitation | Yes |
| GET | `/invitations` | Get all invitations | Yes |
| GET | `/invitations/pending` | Get pending invitations | Yes |
| PUT | `/invitations/{id}/accept` | Accept invitation | Yes |
| PUT | `/invitations/{id}/reject` | Reject invitation | Yes |
| DELETE | `/invitations/{id}` | Cancel invitation | Yes |
| POST | `/invitations/use-code` | Use invite code | Yes |
| GET | `/invitations/my-code` | Get my invite code | Yes |

---

## Code Examples

### Creating a Friendship
```typescript
// Backend: Accept invitation and create friendship
async acceptInvitation(invitationId: string, userId: string) {
  // Update invitation status
  await this.prisma.invitation.update({
    where: { id: invitationId },
    data: { status: 'ACCEPTED' }
  });

  // Create bidirectional friendship
  await this.prisma.friendship.createMany({
    data: [
      { userId: invitation.inviterId, friendId: invitation.inviteeId, status: 'ACCEPTED' },
      { userId: invitation.inviteeId, friendId: invitation.inviterId, status: 'ACCEPTED' }
    ]
  });
}
```

### Frontend: Using Invite Code
```typescript
// Frontend: Use invite code
const handleUseInviteCode = async () => {
  try {
    const result = await invitationApi.useInviteCode(inviteCode);
    Alert.alert('Success!', result.message);
  } catch (error) {
    Alert.alert('Error', 'Failed to use invite code');
  }
};
```

### Real-time Status Update
```typescript
// Backend: Update online status
async updateOnlineStatus(id: string, isOnline: boolean) {
  await this.prisma.user.update({
    where: { id },
    data: {
      isOnline,
      lastSeen: new Date(), // Update timestamp when going offline
    }
  });
}
```

---

## Conclusion

This implementation provides a robust, secure, and user-friendly friends system that supports both direct invitations and invite code sharing, with comprehensive error handling and real-time status updates. The system is designed to scale and provides a solid foundation for social features in the FriendsLeague application.

---

**Document Information**
- **Last Updated**: January 2024
- **Version**: 1.0
- **Status**: Complete
- **Review Required**: Yes
