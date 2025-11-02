// Shared types for FriendsLeague Mobile App
// These types should match the backend types

export interface User {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface SignUpData {
  username: string;
  email?: string;
  phoneNumber?: string;
  password: string;
}

export interface SignInData {
  username: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  hasNewStory: boolean;
  isOwnStory: boolean; // For "Your Story" item
}

// Navigation types
export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Home: undefined;
  MainTabs: undefined;
  Profile: undefined;
  Leagues: undefined;
  Friends: undefined;
  ActiveFriends: undefined;
  Events: undefined;
  InviteCode: undefined;
  Messages: undefined;
  Chat: { chatId: string };
  CreateGroupChat: undefined;
  GroupChatSettings: { chatId: string };
  // Leagues
  LeagueCreate: undefined;
  LeagueDetails: { leagueId: string };
  LeagueMembers: { leagueId: string };
  LeagueAdmin: { leagueId: string };
  LeagueRules: { leagueId: string };
  LeagueRulesRead: { leagueId: string };
  LeagueLeaderboard: { leagueId: string };
  LeagueAssignPoints: { leagueId: string };
  PrivacySettings: undefined;
  StartDirectChat: undefined;
  // Events
  EventCreate: { leagueId?: string } | undefined;
  EventDetails: { eventId: string };
  EventParticipants: { eventId: string };
  EventRules: { eventId: string };
  EventLeaderboard: { eventId: string };
};
