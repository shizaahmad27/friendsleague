// mobile/src/screens/PrivacySettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { privacyApi } from '../services/privacyApi';
import { usersApi } from '../services/usersApi';
import { PrivacySettingsResponse } from '../../shared/types';

export default function PrivacySettingsScreen() {
  const navigation = useNavigation();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettingsResponse | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingSettings, setUpdatingSettings] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      setIsLoading(true);
      const [settings, friendsList] = await Promise.all([
        privacyApi.getPrivacySettings(),
        usersApi.getUserFriends(),
      ]);
      
      setPrivacySettings(settings);
      setFriends(friendsList);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
      Alert.alert('Error', 'Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGlobalToggle = async () => {
    if (!privacySettings) return;

    try {
      setUpdatingSettings(prev => new Set([...prev, 'global']));
      await privacyApi.updateGlobalOnlineStatus(!privacySettings.global.showOnlineStatus);
      
      setPrivacySettings(prev => prev ? {
        ...prev,
        global: { showOnlineStatus: !prev.global.showOnlineStatus }
      } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update global privacy setting');
    } finally {
      setUpdatingSettings(prev => {
        const newSet = new Set(prev);
        newSet.delete('global');
        return newSet;
      });
    }
  };

  const handleFriendToggle = async (friendId: string) => {
    if (!privacySettings) return;

    const currentSetting = privacySettings.friends.find(f => f.friendId === friendId);
    const newHideStatus = !currentSetting?.hideOnlineStatus;

    try {
      setUpdatingSettings(prev => new Set([...prev, friendId]));
      await privacyApi.updateFriendOnlineStatusVisibility(friendId, newHideStatus);
      
      setPrivacySettings(prev => prev ? {
        ...prev,
        friends: prev.friends.map(f => 
          f.friendId === friendId 
            ? { ...f, hideOnlineStatus: newHideStatus }
            : f
        )
      } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update friend privacy setting');
    } finally {
      setUpdatingSettings(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  const getFriendSetting = (friendId: string) => {
    return privacySettings?.friends.find(f => f.friendId === friendId)?.hideOnlineStatus || false;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading privacy settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Global Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Global Settings</Text>
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={handleGlobalToggle}
            disabled={updatingSettings.has('global')}
          >
            <Ionicons name="eye-outline" size={24} color="#007AFF" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Show when I'm active</Text>
              <Text style={styles.settingSubtext}>
                Control whether others can see your online status
              </Text>
            </View>
            {updatingSettings.has('global') ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons 
                name={privacySettings?.global.showOnlineStatus ? "toggle" : "toggle-outline"} 
                size={24} 
                color={privacySettings?.global.showOnlineStatus ? "#007AFF" : "#666"} 
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Per-Friend Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends</Text>
          <Text style={styles.sectionSubtitle}>
            Control who can see your online status
          </Text>
          
          {!privacySettings?.global.showOnlineStatus && (
            <View style={styles.disabledNotice}>
              <Ionicons name="information-circle-outline" size={16} color="#666" />
              <Text style={styles.disabledNoticeText}>
                Per-friend settings are disabled when global setting is off
              </Text>
            </View>
          )}
          
          {friends.map((friend) => {
            const isGlobalOff = !privacySettings?.global.showOnlineStatus;
            const isDisabled = isGlobalOff || updatingSettings.has(friend.id);
            
            return (
              <TouchableOpacity 
                key={friend.id}
                style={[styles.friendItem, isGlobalOff && styles.disabledItem]} 
                onPress={() => handleFriendToggle(friend.id)}
                disabled={isDisabled}
              >
                <View style={styles.friendInfo}>
                  <View style={[styles.friendAvatar, isGlobalOff && styles.disabledAvatar]}>
                    <Text style={[styles.friendAvatarText, isGlobalOff && styles.disabledText]}>
                      {friend.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.friendName, isGlobalOff && styles.disabledText]}>{friend.username}</Text>
                </View>
                {updatingSettings.has(friend.id) ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Ionicons 
                    name={getFriendSetting(friend.id) ? "toggle-outline" : "toggle"} 
                    size={24} 
                    color={isGlobalOff ? "#ccc" : (getFriendSetting(friend.id) ? "#666" : "#007AFF")} 
                  />
                )}
              </TouchableOpacity>
            );
          })}
          
          {friends.length === 0 && (
            <Text style={styles.emptyText}>No friends yet</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  // Disabled state styles
  disabledItem: {
    opacity: 0.5,
  },
  disabledAvatar: {
    backgroundColor: '#ccc',
  },
  disabledText: {
    color: '#999',
  },
  disabledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  disabledNoticeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
});
