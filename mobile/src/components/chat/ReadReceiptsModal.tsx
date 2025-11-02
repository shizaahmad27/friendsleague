import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Message } from '../../services/chatApi';

interface ReadReceiptsModalProps {
  visible: boolean;
  onClose: () => void;
  message: Message | null;
}

export const ReadReceiptsModal: React.FC<ReadReceiptsModalProps> = ({
  visible,
  onClose,
  message,
}) => {
  if (!message) return null;

  const readReceipts = message.readReceipts || [];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Read By</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={readReceipts}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <View style={styles.receiptItem}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.user.username?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.receiptInfo}>
                  <Text style={styles.username}>{item.user.username}</Text>
                  <Text style={styles.readTime}>
                    {new Date(item.readAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No one has read this message yet</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    color: '#666',
  },
  receiptItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  receiptInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  readTime: {
    fontSize: 13,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
