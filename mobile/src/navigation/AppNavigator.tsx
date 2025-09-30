import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../types';

// Screens
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LeaguesScreen from '../screens/LeaguesScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ActiveFriendsScreen from '../screens/ActiveFriendsScreen';
import EventsScreen from '../screens/EventsScreen';
import EventCreateScreen from '../screens/EventCreateScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import InviteCodeScreen from '../screens/InviteCodeScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import CreateGroupChatScreen from '../screens/CreateGroupChatScreen';
import GroupChatSettingsScreen from '../screens/GroupChatSettingsScreen';
import LeagueCreateScreen from '../screens/LeagueCreateScreen';
import LeagueDetailsScreen from '../screens/LeagueDetailsScreen';
import LeagueMembersScreen from '../screens/LeagueMembersScreen';
import LeagueAdminScreen from '../screens/LeagueAdminScreen';
import LeagueRulesScreen from '../screens/LeagueRulesScreen';
import LeagueLeaderboardScreen from '../screens/LeagueLeaderboardScreen';
import LeagueRulesReadScreen from '../screens/LeagueRulesReadScreen';
import LeagueAssignPointsScreen from '../screens/LeagueAssignPointsScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Leagues" component={LeaguesScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
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
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Leagues" component={LeaguesScreen} />
            <Stack.Screen name="Friends" component={FriendsScreen} />
            <Stack.Screen name="ActiveFriends" component={ActiveFriendsScreen} />
            <Stack.Screen name="Events" component={EventsScreen} />
            <Stack.Screen name="EventCreate" component={EventCreateScreen} />
            <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
            <Stack.Screen name="InviteCode" component={InviteCodeScreen} />
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
