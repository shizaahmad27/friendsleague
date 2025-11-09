import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { theme } from '../../constants/colors';

type HelpSupportScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HelpSupport'>;

export default function HelpSupportScreen() {
  const navigation = useNavigation<HelpSupportScreenNavigationProp>();

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@friendleague.com?subject=Help & Support Request');
  };

  const handleOpenFAQ = (section: string) => {
    // Could navigate to a detailed FAQ screen or expand inline
    // For now, just show an alert with basic info
  };

  const faqSections = [
    {
      title: 'Getting Started',
      icon: 'rocket-outline',
      items: [
        {
          question: 'How do I create a league?',
          answer: 'Go to the Leagues tab and tap the "+" button to create a new league. You can set rules, invite friends, and start competing!',
        },
        {
          question: 'How do I invite friends?',
          answer: 'Share your invite code from the Invite Code screen, or invite friends directly from the Friends tab.',
        },
        {
          question: 'How do I join a league?',
          answer: 'You can join a league by accepting an invitation from a friend, or by using a league invite code if you have one.',
        },
      ],
    },
    {
      title: 'Leagues & Events',
      icon: 'trophy-outline',
      items: [
        {
          question: 'How do points work?',
          answer: 'Points are assigned based on your league rules. League admins can assign points for achievements, events, or other activities defined in your league rules.',
        },
        {
          question: 'How do I create an event?',
          answer: 'Go to the Events tab and tap the "+" button. You can create events within a league or as standalone events.',
        },
        {
          question: 'Can I be in multiple leagues?',
          answer: 'Yes! You can join as many leagues as you want. Each league has its own leaderboard and rules.',
        },
      ],
    },
    {
      title: 'Messaging & Chat',
      icon: 'chatbubbles-outline',
      items: [
        {
          question: 'How do I send photos or videos?',
          answer: 'In any chat, tap the media button to select photos, videos, or take a new photo. You can also send voice notes and files.',
        },
        {
          question: 'What are ephemeral messages?',
          answer: 'Ephemeral messages disappear after a set time. You can choose how long they stay visible (5 seconds to 24 hours).',
        },
        {
          question: 'Can I create group chats?',
          answer: 'Yes! Tap the "+" button in Messages to create a new group chat and add multiple friends.',
        },
      ],
    },
    {
      title: 'Privacy & Settings',
      icon: 'shield-outline',
      items: [
        {
          question: 'How do I control who sees my online status?',
          answer: 'Go to Privacy Settings from your profile menu. You can hide your online status globally or for specific friends.',
        },
        {
          question: 'Can I change my username?',
          answer: 'Yes! Go to Edit Profile from your profile screen to change your username, bio, or profile picture.',
        },
        {
          question: 'How do I share my profile?',
          answer: 'Tap the "Share Profile" button on your profile screen to share your profile with friends via any messaging app.',
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Contact Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail-outline" size={24} color={theme.primary} />
            <Text style={styles.sectionTitle}>Contact Support</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Need help? Send us an email and we'll get back to you as soon as possible.
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={handleContactSupport}
          >
            <Text style={styles.contactButtonText}>Email Support</Text>
            <Ionicons name="arrow-forward" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* FAQ Sections */}
        {faqSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon as any} size={24} color={theme.primary} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.faqItem}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <Text style={styles.appInfoText}>
            FriendsLeague v1.0.0{'\n'}
            Connect, compete, and have fun with friends!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primaryText,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
    marginLeft: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.secondaryText,
    marginBottom: 16,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderSecondary,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
  },
  faqItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderTertiary,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: theme.secondaryText,
    lineHeight: 20,
  },
  appInfoText: {
    fontSize: 14,
    color: theme.secondaryText,
    lineHeight: 20,
  },
});

