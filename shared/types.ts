// Shared types for FriendsLeague
// This file contains types that are used across both frontend and backend

export interface User {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'file' | 'voice';
  senderId: string;
  chatId: string;
  mediaUrl?: string;
  duration?: number; // Duration in seconds for voice messages
  waveformData?: number[]; // Array of bar heights for voice messages
  replyToId?: string;
  createdAt: Date;
  updatedAt: Date;
  sender?: User;
  replyTo?: Message;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
  user?: User;
}

export interface Chat {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  participants: User[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

export interface League {
  id: string;
  name: string;
  description?: string;
  adminId: string;
  members: LeagueMember[];
  rules: LeagueRule[];
  events: Event[];
  createdAt: Date;
  updatedAt: Date;
  admin?: User;
}

export interface LeagueMember {
  id: string;
  userId: string;
  leagueId: string;
  points: number;
  rank: number;
  joinedAt: Date;
  user?: User;
}

export interface LeagueRule {
  id: string;
  leagueId: string;
  title: string;
  description: string;
  points: number;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  leagueId?: string;
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  participants: EventParticipant[];
  rules: EventRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  points: number;
  joinedAt: Date;
  user?: User;
}

export interface EventRule {
  id: string;
  eventId: string;
  title: string;
  description: string;
  points: number;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Socket.io event types
export interface SocketEvents {
  // Chat events
  // Align with gateway/client naming
  'joinChat': (payload: { chatId: string; userId: string }) => void;
  'sendMessage': (payload: { chatId: string; message: Message }) => void;
  'newMessage': (message: Message) => void;
  'user:typing': (payload: { userId: string; isTyping: boolean }) => void;
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
  
  // League events
  'league:points:update': (leagueId: string, memberId: string, points: number) => void;
  'league:member:join': (leagueId: string, member: LeagueMember) => void;
  'league:member:leave': (leagueId: string, memberId: string) => void;
  
  // Event events
  'event:created': (event: Event) => void;
  'event:updated': (event: Event) => void;
  'event:deleted': (eventId: string) => void;
}
