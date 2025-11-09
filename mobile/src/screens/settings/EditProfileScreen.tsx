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
  ActionSheetIOS,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { usersApi } from '../../services/usersApi';
import { MediaService } from '../../services/mediaService';
import { theme } from '../../constants/colors';

type EditProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen() {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const { user, setUser } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Load current user data
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
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
    } catch (error) {
      console.error('Failed to load user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const showAvatarOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleTakePhoto();
          } else if (buttonIndex === 2) {
            handleChooseFromGallery();
          }
        }
      );
    } else {
      // Android - use Alert with options
      Alert.alert(
        'Select Profile Picture',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: handleTakePhoto },
          { text: 'Choose from Gallery', onPress: handleChooseFromGallery },
        ]
      );
    }
  };

  const handleTakePhoto = async () => {
    try {
      setIsUploadingAvatar(true);

      // Take photo with cropping enabled
      const mediaFile = await MediaService.takeProfilePicture();
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

  const handleChooseFromGallery = async () => {
    try {
      setIsUploadingAvatar(true);
      
      // Request permissions
      const hasPermission = await MediaService.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please grant access to photos to change your avatar');
        setIsUploadingAvatar(false);
        return;
      }

      // Pick image with cropping enabled
      const mediaFile = await MediaService.pickProfilePicture();
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
      });

      // Update auth store
      setUser(updatedUser);
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
          <Ionicons name="arrow-back" size={24} color={theme.primaryText} />
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
            onPress={showAvatarOptions}
            disabled={isUploadingAvatar}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={theme.tertiaryText} />
              </View>
            )}
            {isUploadingAvatar ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="white" />
              </View>
            ) : (
              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={16} color={theme.primaryText} />
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
              placeholderTextColor={theme.placeholderText}
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
              placeholderTextColor={theme.placeholderText}
              maxLength={150}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.helperText}>
              {bio.length}/150 characters
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
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerButton: {
    width: 60,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primaryText,
  },
  saveButtonText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
    borderColor: theme.border,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.borderSecondary,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: theme.overlay,
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
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarHint: {
    fontSize: 13,
    color: theme.secondaryText,
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
    color: theme.primaryText,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.primaryText,
    borderWidth: 1,
    borderColor: theme.borderSecondary,
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: theme.tertiaryText,
    marginTop: 6,
    textAlign: 'right',
  },
});

