import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../types';

// Screens - Auth
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

// Screens - Chat
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import CreateGroupChatScreen from '../screens/chat/CreateGroupChatScreen';
import GroupChatSettingsScreen from '../screens/chat/GroupChatSettingsScreen';
import StartDirectChatScreen from '../screens/chat/StartDirectChatScreen';

// Screens - Events
import EventsScreen from '../screens/events/EventsScreen';
import EventCreateScreen from '../screens/events/EventCreateScreen';
import EventDetailsScreen from '../screens/events/EventDetailsScreen';
import EventParticipantsScreen from '../screens/events/EventParticipantsScreen';
import EventRulesScreen from '../screens/events/EventRulesScreen';
import EventLeaderboardScreen from '../screens/events/EventLeaderboardScreen';

// Screens - Leagues
import LeaguesScreen from '../screens/leagues/LeaguesScreen';
import LeagueCreateScreen from '../screens/leagues/LeagueCreateScreen';
import LeagueDetailsScreen from '../screens/leagues/LeagueDetailsScreen';
import LeagueMembersScreen from '../screens/leagues/LeagueMembersScreen';
import LeagueAdminScreen from '../screens/leagues/LeagueAdminScreen';
import LeagueRulesScreen from '../screens/leagues/LeagueRulesScreen';
import LeagueLeaderboardScreen from '../screens/leagues/LeagueLeaderboardScreen';
import LeagueRulesReadScreen from '../screens/leagues/LeagueRulesReadScreen';
import LeagueAssignPointsScreen from '../screens/leagues/LeagueAssignPointsScreen';

// Screens - Social
import HomeScreen from '../screens/social/HomeScreen';
import FriendsScreen from '../screens/social/FriendsScreen';
import ActiveFriendsScreen from '../screens/social/ActiveFriendsScreen';

// Screens - Settings
import ProfileScreen from '../screens/settings/ProfileScreen';
import PrivacySettingsScreen from '../screens/settings/PrivacySettingsScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import HelpSupportScreen from '../screens/settings/HelpSupportScreen';

// Screens - Invitations
import InviteCodeScreen from '../screens/invitations/InviteCodeScreen';
import QRCodeScreen from '../screens/invitations/QRCodeScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: 60 + Math.max(insets.bottom - 8, 0),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Feed"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Leagues"
        component={LeaguesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Leagues" component={LeaguesScreen} />
            <Stack.Screen name="Friends" component={FriendsScreen} />
            <Stack.Screen name="ActiveFriends" component={ActiveFriendsScreen} />
            <Stack.Screen name="Events" component={EventsScreen} />
            <Stack.Screen name="EventCreate" component={EventCreateScreen} />
            <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
            <Stack.Screen name="EventParticipants" component={EventParticipantsScreen} />
            <Stack.Screen name="EventRules" component={EventRulesScreen} />
            <Stack.Screen name="EventLeaderboard" component={EventLeaderboardScreen} />
            <Stack.Screen name="InviteCode" component={InviteCodeScreen} />
            <Stack.Screen name="QRCode" component={QRCodeScreen} />
            <Stack.Screen name="Messages" component={ChatListScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="CreateGroupChat" component={CreateGroupChatScreen} />
            <Stack.Screen name="GroupChatSettings" component={GroupChatSettingsScreen} />
            <Stack.Screen name="LeagueCreate" component={LeagueCreateScreen} />
            <Stack.Screen name="LeagueDetails" component={LeagueDetailsScreen} />
            <Stack.Screen name="LeagueMembers" component={LeagueMembersScreen} />
            <Stack.Screen name="LeagueAdmin" component={LeagueAdminScreen} />
            <Stack.Screen name="LeagueRules" component={LeagueRulesScreen} />
            <Stack.Screen name="LeagueRulesRead" component={LeagueRulesReadScreen} />
            <Stack.Screen name="LeagueLeaderboard" component={LeagueLeaderboardScreen} />
            <Stack.Screen name="LeagueAssignPoints" component={LeagueAssignPointsScreen} />
            <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="StartDirectChat" component={StartDirectChatScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
