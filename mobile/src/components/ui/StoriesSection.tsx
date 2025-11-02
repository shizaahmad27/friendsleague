import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Story } from '../../types';

interface StoriesSectionProps {
  stories: Story[];
  onStoryPress?: (story: Story) => void;
  onAddStoryPress?: () => void;
}

// Helper function to generate gradient colors for mock avatars
const getGradientColor = (index: number): string => {
  const gradients = [
    '#FF6B6B', // Red-orange
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
  ];
  return gradients[index % gradients.length];
};

export default function StoriesSection({
  stories,
  onStoryPress,
  onAddStoryPress,
}: StoriesSectionProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stories.map((story, index) => {
          if (story.isOwnStory) {
            return (
              <TouchableOpacity
                key={story.id}
                style={styles.storyItem}
                onPress={onAddStoryPress}
                activeOpacity={0.7}
              >
                <View style={[styles.avatarContainer, styles.ownStoryContainer]}>
                  <Ionicons name="add" size={28} color="white" />
                </View>
                <Text style={styles.username} numberOfLines={1}>
                  Your Story
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={story.id}
              style={styles.storyItem}
              onPress={() => onStoryPress?.(story)}
              activeOpacity={0.7}
            >
              <View style={styles.avatarContainer}>
                <View
                  style={[
                    styles.avatar,
                    story.hasNewStory && styles.avatarWithBorder,
                    { backgroundColor: getGradientColor(index) },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {story.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                {story.hasNewStory && <View style={styles.newStoryBorder} />}
              </View>
              <Text style={styles.username} numberOfLines={1}>
                {story.username}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',

  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 70,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  ownStoryContainer: {
    backgroundColor: '#007AFF',
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  avatarWithBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  newStoryBorder: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2.5,
    borderColor: '#007AFF',
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
  username: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    maxWidth: 70,
  },
});

