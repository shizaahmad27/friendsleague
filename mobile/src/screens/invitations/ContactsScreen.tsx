import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { invitationApi } from '../../services/invitationApi';
import { usersApi } from '../../services/usersApi';
import ScreenHeader from '../../components/layout/ScreenHeader';
import { theme } from '../../constants/colors';

type ContactsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Contacts'>;

interface Contact {
  id: string;
  name: string;
  phoneNumbers?: string[];
  emails?: string[];
  isAppUser?: boolean;
  userId?: string;
  username?: string;
}

export default function ContactsScreen() {
  const navigation = useNavigation<ContactsScreenNavigationProp>();
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitingContacts, setInvitingContacts] = useState<Set<string>>(new Set());

  useEffect(() => {
    requestPermissionAndLoadContacts();
  }, []);

  useEffect(() => {
    // Filter contacts based on search query
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredContacts(
        contacts.filter(
          (contact) =>
            contact.name.toLowerCase().includes(query) ||
            contact.phoneNumbers?.some((phone) => phone.includes(query)) ||
            contact.emails?.some((email) => email.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, contacts]);

  const requestPermissionAndLoadContacts = async () => {
    try {
      // TODO: Import and use expo-contacts when installed
      // For now, show placeholder
      setIsLoading(true);
      
      // Simulate permission request
      // const { status } = await Contacts.requestPermissionsAsync();
      // if (status !== 'granted') {
      //   setHasPermission(false);
      //   setIsLoading(false);
      //   return;
      // }
      
      // setHasPermission(true);
      // await loadContacts();
      
      // Placeholder: Show message that expo-contacts needs to be installed
      setHasPermission(null);
      Alert.alert(
        'Contacts Permission',
        'To use this feature, expo-contacts needs to be installed. Run: npx expo install expo-contacts',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      Alert.alert('Error', 'Failed to access contacts');
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Use expo-contacts when installed
      // const { data } = await Contacts.getContactsAsync({
      //   fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      // });
      
      // Process contacts and match with app users
      // const processedContacts = await processContacts(data);
      // setContacts(processedContacts);
      
      // For now, show empty state
      setContacts([]);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const processContacts = async (rawContacts: any[]): Promise<Contact[]> => {
    // TODO: Match contacts with app users by phone/email
    // For each contact, check if phone/email exists in app
    // Mark as isAppUser: true if found, with userId and username
    
    const processed: Contact[] = rawContacts
      .filter((contact) => contact.name && (contact.phoneNumbers?.length || contact.emails?.length))
      .map((contact) => ({
        id: contact.id,
        name: contact.name,
        phoneNumbers: contact.phoneNumbers?.map((p: any) => p.number) || [],
        emails: contact.emails?.map((e: any) => e.email) || [],
        isAppUser: false,
      }));

    // TODO: Batch check which contacts are app users
    // This would require a backend endpoint to check multiple phone/emails at once
    
    return processed;
  };

  const handleInviteContact = async (contact: Contact) => {
    if (!contact.isAppUser || !contact.userId) {
      // Contact is not an app user - show share options
      Alert.alert(
        'Invite to FriendsLeague',
        `${contact.name} is not on FriendsLeague yet. Share your invite code with them!`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share Code',
            onPress: async () => {
              try {
                const result = await invitationApi.getMyInviteCode();
                // TODO: Use expo-sharing to share invite code
                Alert.alert(
                  'Share Invite Code',
                  `Your invite code: ${result.code}\n\nShare this with ${contact.name} so they can join!`
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to get invite code');
              }
            },
          },
        ]
      );
      return;
    }

    // Contact is an app user - send invitation
    try {
      setInvitingContacts((prev) => new Set(prev).add(contact.id));
      await invitationApi.createInvitation(contact.userId);
      Alert.alert('Success', `Invitation sent to ${contact.username || contact.name}!`);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send invitation'
      );
    } finally {
      setInvitingContacts((prev) => {
        const next = new Set(prev);
        next.delete(contact.id);
        return next;
      });
    }
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const isInviting = invitingContacts.has(item.id);
    
    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleInviteContact(item)}
        disabled={isInviting}
      >
        <View style={styles.contactAvatar}>
          <Text style={styles.contactAvatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          {item.isAppUser ? (
            <View style={styles.appUserBadge}>
              <Ionicons name="checkmark-circle" size={14} color={theme.success} />
              <Text style={styles.appUserText}>
                {item.username || 'FriendsLeague user'}
              </Text>
            </View>
          ) : (
            <Text style={styles.contactSubtext}>
              {item.phoneNumbers?.[0] || item.emails?.[0] || 'No contact info'}
            </Text>
          )}
        </View>
        {isInviting ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <Ionicons
            name={item.isAppUser ? 'person-add-outline' : 'share-outline'}
            size={24}
            color={theme.primary}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Choose from contacts" />
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={64} color={theme.borderSecondary} />
          <Text style={styles.emptyStateText}>Contacts Permission Required</Text>
          <Text style={styles.emptyStateSubtext}>
            Please allow access to contacts to find friends on FriendsLeague
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermissionAndLoadContacts}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Choose from contacts" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={theme.secondaryText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor={theme.placeholderText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : filteredContacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color={theme.borderSecondary} />
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'No contacts found' : 'No contacts available'}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {searchQuery
              ? 'Try a different search term'
              : hasPermission === null
              ? 'Install expo-contacts to access your contacts'
              : 'Grant permission to access your contacts'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.primaryText,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.secondaryText,
  },
  listContent: {
    padding: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    color: theme.primaryTextOnPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primaryText,
    marginBottom: 4,
  },
  contactSubtext: {
    fontSize: 13,
    color: theme.secondaryText,
  },
  appUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appUserText: {
    fontSize: 13,
    color: theme.success,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 24,
  },
  permissionButtonText: {
    color: theme.primaryTextOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

