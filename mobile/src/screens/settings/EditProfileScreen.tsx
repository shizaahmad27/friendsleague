import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { usersApi } from '../../services/usersApi';
import { MediaService } from '../../services/mediaService';

type EditProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen() {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const { user, setUser } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Load current user data
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  // Refresh user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadCurrentUser();
    }, [])
  );

  const loadCurrentUser = async () => {
    setIsLoading(true);
    try {
      const currentUser = await usersApi.getCurrentUser();
      setUser(currentUser);
      setUsername(currentUser.username || '');
      setBio(currentUser.bio || '');
      setAvatar(currentUser.avatar || '');
      setEmail(currentUser.email || '');
      setPhoneNumber(currentUser.phoneNumber || '');
    } catch (error) {
      console.error('Failed to load user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAvatar = async () => {
    try {
      setIsUploadingAvatar(true);
      
      // Request permissions
      const hasPermission = await MediaService.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please grant access to photos to change your avatar');
        setIsUploadingAvatar(false);
        return;
      }

      // Pick image
      const mediaFile = await MediaService.pickImage();
      if (!mediaFile) {
        setIsUploadingAvatar(false);
        return;
      }

      // Upload to S3
      const mediaUrl = await MediaService.uploadMedia(mediaFile);
      setAvatar(mediaUrl);
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!username.trim()) {
      Alert.alert('Validation Error', 'Username is required');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Validation Error', 'Username must be at least 3 characters');
      return;
    }

    if (username.length > 20) {
      Alert.alert('Validation Error', 'Username must be 20 characters or less');
      return;
    }

    if (bio.length > 150) {
      Alert.alert('Validation Error', 'Bio must be 150 characters or less');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await usersApi.updateProfile({
        username: username.trim(),
        bio: bio.trim() || undefined,
        avatar: avatar || undefined,
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      });

      // Update auth store
      setUser(updatedUser);

      // Navigate back to profile screen
      navigation.goBack();
    } catch (error: any) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleSelectAvatar}
            disabled={isUploadingAvatar}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#999" />
              </View>
            )}
            {isUploadingAvatar ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="white" />
              </View>
            ) : (
              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={16} color="#333" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor="#999"
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.helperText}>
              {username.length}/20 characters
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about yourself"
              placeholderTextColor="#999"
              maxLength={150}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.helperText}>
              {bio.length}/150 characters
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email (optional)"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.helperText}>
              Optional - for account recovery
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone number (optional)"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.helperText}>
              Optional - international format (e.g., +1234567890)
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerButton: {
    width: 60,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarHint: {
    fontSize: 13,
    color: '#666',
  },
  formSection: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
});

