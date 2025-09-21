import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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
import InviteCodeScreen from '../screens/InviteCodeScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import CreateGroupChatScreen from '../screens/CreateGroupChatScreen';
import GroupChatSettingsScreen from '../screens/GroupChatSettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();

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
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Leagues" component={LeaguesScreen} />
            <Stack.Screen name="Friends" component={FriendsScreen} />
            <Stack.Screen name="ActiveFriends" component={ActiveFriendsScreen} />
            <Stack.Screen name="Events" component={EventsScreen} />
            <Stack.Screen name="InviteCode" component={InviteCodeScreen} />
            <Stack.Screen name="Messages" component={ChatListScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="CreateGroupChat" component={CreateGroupChatScreen} />
            <Stack.Screen name="GroupChatSettings" component={GroupChatSettingsScreen} />
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
