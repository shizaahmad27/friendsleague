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

// Navigation types
export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Home: undefined;
  Profile: undefined;
  Leagues: undefined;
  Friends: undefined;
  Events: undefined;
  InviteCode: undefined;
};
