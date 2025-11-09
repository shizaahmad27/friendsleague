/**
 * Color constants for FriendsLeague app
 * Structured for easy dark mode implementation in the future
 */

export const colors = {
  light: {
    // Background colors
    background: '#ffffff',
    backgroundSecondary: '#f5f5f5',
    backgroundTertiary: '#f9f9f9',
    
    // Text colors
    primaryText: '#333333',
    secondaryText: '#666666',
    tertiaryText: '#999999',
    placeholderText: '#999999',
    
    // Border colors
    border: '#f0f0f0',
    borderSecondary: '#e0e0e0',
    borderTertiary: '#f5f5f5',
    
    // Primary colors
    primary: '#007AFF',
    primaryTextOnPrimary: '#ffffff',
    
    // Status colors
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.1)',
    
    // Shadow
    shadow: '#000000',
  },
  // dark: { ... } can be added here in the future
};

// Export current theme (light mode for now)
export const theme = colors.light;

