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
import { RootStackParamList } from '../types';
import HamburgerMenu from '../components/HamburgerMenu';
import { useAuthStore } from '../store/authStore';
import { invitationApi } from '../services/invitationApi';
import * as Clipboard from 'expo-clipboard';

type InviteCodeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InviteCode'>;

export default function InviteCodeScreen() {
  const navigation = useNavigation<InviteCodeScreenNavigationProp>();
  const { user } = useAuthStore();
  const [inviteCode, setInviteCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [myInviteCode, setMyInviteCode] = useState<string>('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  const handleLogout = () => {
    console.log('Logout from InviteCode screen');
  };

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


    setIsProcessing(true);
    try {
      const result = await invitationApi.useInviteCode(inviteCode.trim().toUpperCase());
      
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
      const errorMessage = error.response?.data?.message || 'Failed to use invite code. Please try again.';
      Alert.alert('Error', errorMessage);
      console.error('Invite code error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanQRCode = () => {
    // TODO: Implement QR code scanning
    Alert.alert('Coming Soon', 'QR code scanning will be available in a future update!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Use Invite Code</Text>
        <Text style={styles.subtitle}>Enter a friend's invite code to connect</Text>
        <HamburgerMenu onLogout={handleLogout} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔗 Enter Invite Code</Text>
          <Text style={styles.cardDescription}>
            Ask your friend for their invite code and enter it below to connect with them.
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter invite code (e.g., A1B2C3D4)"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              selectTextOnFocus={true}
              clearButtonMode="while-editing"
            />
            <TouchableOpacity 
              style={[styles.useButton, isProcessing && styles.useButtonDisabled]} 
              onPress={handleUseInviteCode}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.useButtonText}>Use Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 Scan QR Code</Text>
          <Text style={styles.cardDescription}>
            Scan a QR code from your friend's device to automatically connect.
          </Text>
          <TouchableOpacity 
            style={styles.cardButton}
            onPress={handleScanQRCode}
          >
            <Text style={styles.cardButtonText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ℹ️ How It Works</Text>
          <Text style={styles.cardDescription}>
            1. Ask your friend to share their invite code or QR code{'\n'}
            2. Enter the code above or scan the QR code{'\n'}
            3. You'll be automatically connected as friends{'\n'}
            4. Start competing in leagues together!
          </Text>
        </View>

        {user && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👤 Your Invite Code</Text>
            <Text style={styles.cardDescription}>
              Share this code with friends so they can connect with you:
            </Text>
            <View style={styles.yourCodeContainer}>
              <Text style={styles.yourCode}>
                {isLoadingCode ? 'Loading...' : myInviteCode}
              </Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '600',
    marginRight: 12,
  },
  useButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  useButtonDisabled: {
    backgroundColor: '#ccc',
  },
  useButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cardButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cardButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  yourCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yourCode: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    letterSpacing: 2,
    backgroundColor: '#f0f8ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  copyButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  copyButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
