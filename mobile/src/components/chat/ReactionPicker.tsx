import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');

// Default reactions (like iMessage)
const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '❓'];

// Extended emoji set for the full picker
const EXTENDED_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
  '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
  '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦',
  '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
  '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿',
  '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖',
  '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈',
  '🙉', '🙊', '💋', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏',
  '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇',
  '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐',
  '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵',
  '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅',
  '👄', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️',
  '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍',
  '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️',
  '🗨️', '🗯️', '💭', '💤', '👋', '🤚', '🖐️', '✋', '🖖', '👌',
  // Punctuation and symbols
  '?', '!', '❓', '❔', '❗', '❕', '‼️', '⁉️', '❌', '✅',
  '❎', '✔️', '☑️', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫',
  '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲',
  '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔴',
];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  visible,
  onClose,
  onSelectEmoji,
}) => {
  const [showExtended, setShowExtended] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    onSelectEmoji(emoji);
    onClose();
  };

  const renderDefaultReactions = () => (
    <View style={styles.defaultReactionsContainer}>
        {DEFAULT_REACTIONS.map((emoji, index) => (
        <TouchableOpacity
          key={index}
          style={styles.emojiButton}
          onPress={() => handleEmojiSelect(emoji)}
        >
          <Text style={styles.emojiText}>{emoji}</Text>
        </TouchableOpacity>
      ))}
      
      {/* Plus button for extended picker */}
      <TouchableOpacity
        style={styles.plusButton}
        onPress={() => setShowExtended(true)}
      >
        <Ionicons name="add" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  const renderExtendedPicker = () => (
    <View style={styles.extendedContainer}>
      <View style={styles.extendedHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowExtended(false)}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.extendedTitle}>Choose Emoji</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.emojiGrid} showsVerticalScrollIndicator={false}>
        <View style={styles.emojiRow}>
          {EXTENDED_EMOJIS.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={styles.extendedEmojiButton}
              onPress={() => handleEmojiSelect(emoji)}
            >
              <Text style={styles.extendedEmojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.pickerContainer}>
          {showExtended ? renderExtendedPicker() : renderDefaultReactions()}
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
  backdrop: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40, // Extra padding for home indicator
  },
  
  // Default reactions styles
  defaultReactionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  emojiButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
  plusButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  
  // Extended picker styles
  extendedContainer: {
    maxHeight: 400,
  },
  extendedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  extendedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  emojiGrid: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  extendedEmojiButton: {
    padding: 8,
    margin: 2,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extendedEmojiText: {
    fontSize: 20,
  },
});
