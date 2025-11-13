import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { invitationApi } from '../../services/invitationApi';
import * as Clipboard from 'expo-clipboard';
import ScreenHeader from '../../components/layout/ScreenHeader';
import { theme } from '../../constants/colors';

type InviteCodeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InviteCode'>;

export default function InviteCodeScreen() {
  const navigation = useNavigation<InviteCodeScreenNavigationProp>();
  const { user } = useAuthStore();
  const [inviteCode, setInviteCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [myInviteCode, setMyInviteCode] = useState<string>('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  // Load user's invite code on screen focus (no local fallback)
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const loadMyInviteCode = async () => {
        if (!user) {
          console.log('No user found, skipping invite code load');
          return;
        }
        setIsLoadingCode(true);
        try {
          const result = await invitationApi.getMyInviteCode();
          if (isActive) setMyInviteCode(result.code);
        } catch (error) {
          console.error('Failed to load invite code:', error);
          if (isActive) setMyInviteCode('');
        } finally {
          if (isActive) setIsLoadingCode(false);
        }
      };

      loadMyInviteCode();
      return () => {
        isActive = false;
      };
    }, [user])
  );

  const handleUseInviteCode = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    console.log('Attempting to use invite code:', inviteCode.trim().toUpperCase());
    setIsProcessing(true);
    
    try {
      const result = await invitationApi.useInviteCode(inviteCode.trim().toUpperCase());
      console.log('Invite code result:', result);
      
      Alert.alert(
        'Success!', 
        result.message,
        [
          { text: 'OK', onPress: () => {
            setInviteCode(''); // Clear the input
            navigation.navigate('Friends');
          }}
        ]
      );
    } catch (error: any) {
      console.error('Invite code error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      
      let errorMessage = 'Failed to use invite code. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ScreenHeader title="Use Invite Code" />

      <View style={styles.content}>
        {/* Enter Invite Code Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Invite Code</Text>
          <Text style={styles.sectionDescription}>
            Ask your friend for their invite code and enter it below to connect with them.
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter invite code (e.g., A1B2C3D4)"
              placeholderTextColor={theme.placeholderText}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              selectTextOnFocus={true}
            />
            <TouchableOpacity 
              style={[styles.useButton, (isProcessing || !inviteCode.trim()) && styles.useButtonDisabled]} 
              onPress={handleUseInviteCode}
              disabled={isProcessing || !inviteCode.trim()}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={theme.primaryTextOnPrimary} />
              ) : (
                <Text style={styles.useButtonText}>Use Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Invite Code Section */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Invite Code</Text>
            <Text style={styles.sectionDescription}>
              Share this code with friends so they can connect with you:
            </Text>
            <View style={styles.yourCodeContainer}>
              <View style={styles.yourCodeDisplay}>
                <Text style={styles.yourCode}>
                  {isLoadingCode ? 'Loading...' : myInviteCode}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.copyButton, isLoadingCode && styles.copyButtonDisabled]}
                onPress={async () => {
                  if (isLoadingCode || !myInviteCode) return;
                  
                  try {
                    await Clipboard.setStringAsync(myInviteCode);
                    Alert.alert('Copied!', 'Your invite code has been copied to clipboard');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to copy invite code');
                    console.error('Copy error:', error);
                  }
                }}
                disabled={isLoadingCode}
              >
                <Ionicons name="copy-outline" size={20} color={theme.primaryTextOnPrimary} />
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.secondaryText,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    backgroundColor: theme.backgroundSecondary,
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '600',
    color: theme.primaryText,
  },
  useButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useButtonDisabled: {
    backgroundColor: theme.borderSecondary,
  },
  useButtonText: {
    color: theme.primaryTextOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  yourCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yourCodeDisplay: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  yourCode: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.primary,
    textAlign: 'center',
    letterSpacing: 3,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.success,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  copyButtonText: {
    color: theme.primaryTextOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  copyButtonDisabled: {
    backgroundColor: theme.borderSecondary,
  },
});
