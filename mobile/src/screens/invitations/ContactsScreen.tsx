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
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import * as Clipboard from 'expo-clipboard';
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
  const [permissionStatus, setPermissionStatus] = useState<Contacts.PermissionStatus | null>(null);
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
      setIsLoading(true);
      
      const { status } = await Contacts.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === Contacts.PermissionStatus.GRANTED) {
        setHasPermission(true);
        await loadContacts();
      } else if (status === Contacts.PermissionStatus.DENIED) {
        setHasPermission(false);
      } else {
        // Limited access (iOS) or undetermined
        const isLimited = status === (Contacts.PermissionStatus as any).LIMITED || 
                         (status as any) === 'limited';
        setHasPermission(isLimited);
        if (isLimited) {
          await loadContacts();
        }
      }
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
      
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });
      
      // Process contacts and match with app users
      const processedContacts = await processContacts(data);
      setContacts(processedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to normalize phone numbers (remove spaces, dashes, etc.)
  const normalizePhoneNumber = (phone: string): string => {
    return phone.replace(/[\s\-\(\)]/g, '');
  };

  const processContacts = async (rawContacts: Contacts.Contact[]): Promise<Contact[]> => {
    // Filter and process contacts
    const processed: Contact[] = rawContacts
      .filter((contact) => contact.name && (contact.phoneNumbers?.length || contact.emails?.length))
      .map((contact, index) => ({
        id: (contact as any).id || `contact-${index}`,
        name: contact.name || 'Unknown',
        phoneNumbers: contact.phoneNumbers?.map((p) => normalizePhoneNumber(p.number || '')) || [],
        emails: contact.emails?.map((e) => (e.email || '').toLowerCase().trim()) || [],
        isAppUser: false,
      }));

    // Match contacts with app users by phone/email
    // Check each contact's phone numbers and emails against app users
    const matchedContacts = await Promise.all(
      processed.map(async (contact) => {
        // Check if any phone number or email matches an app user
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          for (const phone of contact.phoneNumbers) {
            try {
              // Search users by phone - we'll need to check if user exists
              // Since there's no direct search by phone/email endpoint, we'll try to find users
              // by searching with the phone number as username (fallback approach)
              // In a real implementation, you'd want a backend endpoint to batch check phone/emails
              const users = await usersApi.searchUsers(phone);
              if (users.length > 0) {
                const matchedUser = users.find(u => u.phoneNumber === phone);
                if (matchedUser) {
                  return {
                    ...contact,
                    isAppUser: true,
                    userId: matchedUser.id,
                    username: matchedUser.username,
                  };
                }
              }
            } catch (error) {
              // Continue checking other contacts
              console.log(`Could not check phone ${phone}:`, error);
            }
          }
        }

        if (contact.emails && contact.emails.length > 0) {
          for (const email of contact.emails) {
            try {
              const users = await usersApi.searchUsers(email);
              if (users.length > 0) {
                const matchedUser = users.find(u => u.email?.toLowerCase() === email);
                if (matchedUser) {
                  return {
                    ...contact,
                    isAppUser: true,
                    userId: matchedUser.id,
                    username: matchedUser.username,
                  };
                }
              }
            } catch (error) {
              console.log(`Could not check email ${email}:`, error);
            }
          }
        }

        return contact;
      })
    );

    return matchedContacts;
  };

  const handleInviteContact = async (contact: Contact) => {
    if (!contact.isAppUser || !contact.userId) {
      // Contact is not an app user - show share options
      try {
        const result = await invitationApi.getMyInviteCode();
        const shareMessage = `Hey ${contact.name}! Join me on FriendsLeague. Use my invite code: ${result.code}`;
        
        Alert.alert(
          'Invite to FriendsLeague',
          `${contact.name} is not on FriendsLeague yet. Share your invite code with them!`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Copy Code',
              onPress: async () => {
                await Clipboard.setStringAsync(result.code);
                Alert.alert('Copied!', 'Invite code copied to clipboard');
              },
            },
            {
              text: 'Share',
              onPress: async () => {
                try {
                  await Share.share({
                    message: shareMessage,
                  });
                } catch (error: any) {
                  if (error.message !== 'User did not share') {
                    console.error('Error sharing:', error);
                    // Fallback to clipboard
                    await Clipboard.setStringAsync(result.code);
                    Alert.alert('Copied!', 'Invite code copied to clipboard');
                  }
                }
              },
            },
          ]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to get invite code');
      }
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

  const handleAddContacts = async () => {
    // Request full access to contacts
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setPermissionStatus(status);
      if (status === Contacts.PermissionStatus.GRANTED) {
        setHasPermission(true);
        await loadContacts();
      } else {
        Alert.alert(
          'Permission Required',
          'Full access to contacts is needed to see all your contacts. You can grant this in Settings.'
        );
      }
    } catch (error) {
      console.error('Error requesting full access:', error);
      Alert.alert('Error', 'Failed to request full access');
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Choose from contacts" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={theme.secondaryText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
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

      {/* Contacts Header */}
      <View style={styles.contactsHeader}>
        <Text style={styles.contactsHeaderText}>Contacts</Text>
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

      {/* Add Contacts Button (shown when limited access) */}
      {permissionStatus && 
       permissionStatus !== Contacts.PermissionStatus.GRANTED && 
       permissionStatus !== Contacts.PermissionStatus.DENIED && (
        <TouchableOpacity style={styles.addContactsButton} onPress={handleAddContacts}>
          <Text style={styles.addContactsButtonText}>+ Add Contacts</Text>
        </TouchableOpacity>
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
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.primaryText,
  },
  contactsHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  contactsHeaderText: {
    fontSize: 18,
    fontWeight: '600',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  addContactsButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    zIndex: 10,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addContactsButtonText: {
    color: 'white',
    fontWeight: '700',
  },
});

