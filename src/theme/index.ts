import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const colors = {
  // Background - true black / near-black
  background: '#000000',
  backgroundDark: '#000000',
  
  // Cards - dark gray, soft contrast
  cardBackground: '#161A1E',
  cardBackgroundElevated: '#1B1F24',
  cardBorder: 'rgba(255, 255, 255, 0.05)',
  
  // Text - high readability
  textPrimary: '#F2F4F7',
  textSecondary: '#9AA0A6',
  textMuted: '#6B7280',
  
  // Financial colors - controlled and meaning-based
  positive: '#2ECC71',
  negative: '#E74C3C',
  
  // Accent - modern finance blue
  accent: '#3B82F6',
  accentLight: '#60A5FA',
  
  // Status colors (aligned with financial theme)
  success: '#2ECC71',
  error: '#E74C3C',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Legacy support (map old names to new)
  primaryStart: '#3B82F6',
  primaryEnd: '#3B82F6',
  glassBackground: '#161A1E',
  glassBorder: 'rgba(255, 255, 255, 0.05)',
  
  // Buttons
  buttonPrimary: '#3B82F6',
  buttonSecondary: 'rgba(255, 255, 255, 0.1)',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  
  // Dividers
  divider: 'rgba(255, 255, 255, 0.08)',
  
  // Pagination
  paginationDotInactive: 'rgba(255, 255, 255, 0.25)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const layout = {
  containerMaxWidth: 500,
  screenWidth: width,
  screenHeight: height,
  bottomTabHeight: 70,
  headerHeight: 60,
};

export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
};

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  layout,
  animation,
};
