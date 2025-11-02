import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { usersApi, User } from '../../services/usersApi';
import { chatApi } from '../../services/chatApi';

type GroupChatSettingsRouteProp = RouteProp<{ GroupChatSettings: { chatId: string } }, 'GroupChatSettings'>;

export default function GroupChatSettingsScreen() {
  const route = useRoute<GroupChatSettingsRouteProp>();
  const navigation = useNavigation();
  const { chatId } = route.params;

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState<Array<{
    user: {
      id: string;
      username: string;
      avatar?: string;
      isOnline: boolean;
      lastSeen: string;
      createdAt: string;
      updatedAt: string;
    };
  }>>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  useEffect(() => {
    loadGroupData();
    loadFriends();
  }, [chatId]);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      const [participantsData] = await Promise.all([
        chatApi.getGroupChatParticipants(chatId),
      ]);
      setParticipants(participantsData as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to load group data');
      console.error('Load group data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const data = await usersApi.getUserFriends();
      // Filter out users who are already participants
      const participantIds = participants.map(p => p.user.id);
      const availableFriends = data.filter(friend => !participantIds.includes(friend.id));
      setFriends(availableFriends);
    } catch (error) {
      console.error('Load friends error:', error);
    }
  };

  const handleUpdateGroup = async () => {
    setIsUpdating(true);
    try {
      await chatApi.updateGroupChat(chatId, groupName.trim(), description.trim());
      Alert.alert('Success', 'Group updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update group');
      console.error('Update group error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('Error', 'Please select friends to add');
      return;
    }

    try {
      await chatApi.addParticipantsToGroup(chatId, selectedFriends);
      Alert.alert('Success', 'Members added successfully');
      setShowAddMembers(false);
      setSelectedFriends([]);
      loadGroupData();
      loadFriends();
    } catch (error) {
      Alert.alert('Error', 'Failed to add members');
      console.error('Add members error:', error);
    }
  };

  const handleRemoveMember = async (userId: string, username: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${username} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatApi.removeParticipantFromGroup(chatId, userId);
              Alert.alert('Success', 'Member removed successfully');
              loadGroupData();
              loadFriends();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
              console.error('Remove member error:', error);
            }
          },
        },
      ]
    );
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const renderParticipant = ({ item }: { item: { user: User } }) => (
    <View style={styles.participantItem}>
      <View style={styles.participantAvatar}>
        <Text style={styles.participantAvatarText}>
          {item.user.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.participantInfo}>
        <Text style={styles.participantUsername}>{item.user.username}</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.onlineIndicator, item.user.isOnline && styles.onlineIndicatorPulsing]} />
          <Text style={styles.participantStatus}>
            {item.user.isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveMember(item.user.id, item.user.username)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFriend = ({ item }: { item: User }) => {
    const isSelected = selectedFriends.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.selectedFriendItem]}
        onPress={() => toggleFriendSelection(item.id)}
      >
        <View style={styles.friendAvatar}>
          <Text style={styles.friendAvatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendUsername}>{item.username}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.onlineIndicator, item.isOnline && styles.onlineIndicatorPulsing]} />
            <Text style={styles.friendStatus}>
              {item.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading group data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Settings</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleUpdateGroup}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Group Name</Text>
            <TextInput
              style={styles.textInput}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter group description"
              multiline
              maxLength={200}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members ({participants.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddMembers(true)}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={participants}
            renderItem={renderParticipant}
            keyExtractor={(item) => item.user.id}
            style={styles.participantsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

      {/* Add Members Modal */}
      <Modal
        visible={showAddMembers}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowAddMembers(false);
                setSelectedFriends([]);
              }}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Members</Text>
            <TouchableOpacity
              style={[styles.modalAddButton, selectedFriends.length === 0 && styles.modalAddButtonDisabled]}
              onPress={handleAddMembers}
              disabled={selectedFriends.length === 0}
            >
              <Text style={styles.modalAddButtonText}>Add ({selectedFriends.length})</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={(item) => item.id}
            style={styles.modalFriendsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
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
    marginTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  participantsList: {
    maxHeight: 300,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  participantInfo: {
    flex: 1,
  },
  participantUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginRight: 6,
  },
  onlineIndicatorPulsing: {
    backgroundColor: '#34C759',
  },
  participantStatus: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancelButton: {
    paddingVertical: 8,
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalAddButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalAddButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalFriendsList: {
    flex: 1,
    padding: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedFriendItem: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
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
  friendInfo: {
    flex: 1,
  },
  friendUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 12,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
