import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from './Text';
import { formatPriceChange } from '../utils/formatUtils';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface PriceChangeIndicatorProps {
  change: number | null | undefined;
}

const PriceChangeIndicator: React.FC<PriceChangeIndicatorProps> = ({ change }) => {
  // Handle null/undefined - indicates unavailable or invalid data
  if (change == null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.textMuted + '40' }]}>
        <Text style={[styles.text, { color: colors.textMuted }]}>
          {formatPriceChange(null)}
        </Text>
      </View>
    );
  }

  // Validate change value
  if (isNaN(change) || !isFinite(change)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.textMuted + '40' }]}>
        <Text style={[styles.text, { color: colors.textMuted }]}>
          {formatPriceChange(null)}
        </Text>
      </View>
    );
  }

  const formattedChange = formatPriceChange(change);
  
  // Determine color and icon based on change value
  let indicatorColor: string;
  let iconName: 'trending-up' | 'trending-down' | null;
  
  if (change > 0) {
    indicatorColor = colors.success; // Green: #2ECC71
    iconName = 'trending-up';
  } else if (change < 0) {
    indicatorColor = colors.error; // Red: #E74C3C
    iconName = 'trending-down';
  } else {
    indicatorColor = colors.textMuted; // Gray: #6B7280
    iconName = null;
  }

  return (
    <View style={[styles.container, { backgroundColor: indicatorColor + '40' }]}>
      {iconName ? (
        <Feather 
          name={iconName} 
          size={fontSize.sm} 
          color={indicatorColor} 
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.text, { color: indicatorColor }]}>
        {formattedChange}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.lg,
    minHeight: 22,
  },
  icon: {
    marginRight: spacing.xs,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.xs + 2,
  },
});

export default PriceChangeIndicator;

