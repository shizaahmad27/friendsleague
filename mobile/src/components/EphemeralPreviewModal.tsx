import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface EphemeralPreviewModalProps {
  visible: boolean;
  mediaUri: string;
  mediaType: 'IMAGE' | 'VIDEO';
  onSend: (viewDuration: number | null) => void;
  onCancel: () => void;
}

const TIMER_OPTIONS = [
  { label: '3s', value: 3 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '∞', value: null }, // Unlimited
];

export const EphemeralPreviewModal: React.FC<EphemeralPreviewModalProps> = ({
  visible,
  mediaUri,
  mediaType,
  onSend,
  onCancel,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(10); // Default to 10s

  const handleSend = () => {
    onSend(selectedDuration);
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Snap?',
      'Are you sure you want to discard this snap?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onCancel },
      ]
    );
  };

  const renderMediaPreview = () => {
    if (mediaType === 'VIDEO') {
      return (
        <Video
          source={{ uri: mediaUri }}
          style={styles.mediaPreview}
          resizeMode="cover"
          shouldPlay
          isLooping
          isMuted
        />
      );
    } else {
      return (
        <Image
          source={{ uri: mediaUri }}
          style={styles.mediaPreview}
          resizeMode="cover"
        />
      );
    }
  };

  const getTimerLabel = (value: number | null) => {
    if (value === null) return '∞';
    return `${value}s`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send Snap</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleSend}>
            <Ionicons name="send" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Media Preview */}
        <View style={styles.mediaContainer}>
          {renderMediaPreview()}
          
          {/* Overlay gradient for better text visibility */}
          <View style={styles.mediaOverlay} />
        </View>

        {/* Timer Selection */}
        <View style={styles.timerSection}>
          <Text style={styles.timerTitle}>View Duration</Text>
          <Text style={styles.timerSubtitle}>
            How long can the recipient view this snap?
          </Text>
          
          <View style={styles.timerOptions}>
            {TIMER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.timerOption,
                  selectedDuration === option.value && styles.timerOptionSelected,
                ]}
                onPress={() => setSelectedDuration(option.value)}
              >
                <Text
                  style={[
                    styles.timerOptionText,
                    selectedDuration === option.value && styles.timerOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.timerDescription}>
            {selectedDuration === null
              ? 'Recipient can view once, then it disappears'
              : `Snap will disappear after ${selectedDuration} seconds`}
          </Text>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.sendButtonText}>Send Snap</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  mediaContainer: {
    flex: 1,
    position: 'relative',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
  },
  mediaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
  },
  timerSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  timerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  timerSubtitle: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  timerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  timerOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 60,
    alignItems: 'center',
  },
  timerOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  timerOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timerOptionTextSelected: {
    color: '#fff',
  },
  timerDescription: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    gap: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
