import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/colors';

interface ScreenHeaderProps {
  title: string;
  showMenu?: boolean;
  onMenuPress?: () => void;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export default function ScreenHeader({ 
  title, 
  showMenu = false, 
  onMenuPress,
  rightIcon,
  onRightIconPress
}: ScreenHeaderProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={theme.primaryText} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      {showMenu ? (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={onMenuPress}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={theme.primaryText} />
        </TouchableOpacity>
      ) : rightIcon && onRightIconPress ? (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={onRightIconPress}
        >
          <Ionicons name={rightIcon as any} size={24} color={theme.primaryText} />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 6,
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
});

