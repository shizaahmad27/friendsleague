import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { invitationApi } from '../../services/invitationApi';
import ScreenHeader from '../../components/layout/ScreenHeader';
import { theme } from '../../constants/colors';

type QRCodeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'QRCode'>;

export default function QRCodeScreen() {
  const navigation = useNavigation<QRCodeScreenNavigationProp>();
  const { user } = useAuthStore();
  const [myInviteCode, setMyInviteCode] = useState<string>('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Load user's invite code
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

  // Request camera permission
  useEffect(() => {
    // TODO: Request camera permission when expo-camera is installed
    // For now, set to true as placeholder
    setHasPermission(true);
  }, []);

  const handleScanQRCode = (scannedCode: string) => {
    // Use the scanned invite code
    Alert.alert(
      'Scanned Code',
      `Code: ${scannedCode}\n\nWould you like to use this invite code?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Code',
          onPress: async () => {
            try {
              const result = await invitationApi.useInviteCode(scannedCode.toUpperCase());
              Alert.alert('Success!', result.message, [
                { text: 'OK', onPress: () => navigation.navigate('Friends') },
              ]);
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to use invite code'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="QR Code" />

      <View style={styles.content}>
        {/* Camera Section - Top Half */}
        <View style={styles.cameraSection}>
          <Text style={styles.sectionTitle}>Scan QR Code</Text>
          <View style={styles.cameraContainer}>
            {hasPermission === null ? (
              <View style={styles.placeholder}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.placeholderText}>Requesting camera permission...</Text>
              </View>
            ) : hasPermission ? (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                  Camera view will appear here{'\n'}
                  (expo-camera integration needed)
                </Text>
                <Text style={styles.placeholderSubtext}>
                  This will scan QR codes from friends' devices
                </Text>
              </View>
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Camera permission required</Text>
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={() => {
                    // TODO: Request permission
                    Alert.alert('Info', 'Camera permission is required to scan QR codes');
                  }}
                >
                  <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Your QR Code Section - Bottom Half */}
        <View style={styles.qrCodeSection}>
          <Text style={styles.sectionTitle}>Your QR Code</Text>
          <Text style={styles.sectionDescription}>
            Let others scan this code to connect with you
          </Text>
          <View style={styles.qrCodeContainer}>
            {isLoadingCode ? (
              <View style={styles.qrCodePlaceholder}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.placeholderText}>Loading your code...</Text>
              </View>
            ) : myInviteCode ? (
              <View style={styles.qrCodePlaceholder}>
                <Text style={styles.qrCodeText}>{myInviteCode}</Text>
                <Text style={styles.placeholderSubtext}>
                  QR code will be displayed here{'\n'}
                  (QR code generator library needed)
                </Text>
              </View>
            ) : (
              <View style={styles.qrCodePlaceholder}>
                <Text style={styles.placeholderText}>Unable to load invite code</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
  },
  cameraSection: {
    flex: 1,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.secondaryText,
    marginBottom: 16,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  qrCodeSection: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.background,
  },
  qrCodeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: theme.secondaryText,
    textAlign: 'center',
    marginTop: 12,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: theme.tertiaryText,
    textAlign: 'center',
    marginTop: 8,
  },
  qrCodePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 3,
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  permissionButtonText: {
    color: theme.primaryTextOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});

