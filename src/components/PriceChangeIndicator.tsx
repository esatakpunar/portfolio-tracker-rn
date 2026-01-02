import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { formatPriceChange } from '../utils/formatUtils';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface PriceChangeIndicatorProps {
  change: number;
}

const PriceChangeIndicator: React.FC<PriceChangeIndicatorProps> = ({ change }) => {
  // Validate change value
  if (isNaN(change) || !isFinite(change)) {
    change = 0;
  }

  const formattedChange = formatPriceChange(change);
  
  // Determine color and icon based on change value
  let indicatorColor: string;
  let icon: string;
  
  if (change > 0) {
    indicatorColor = colors.success; // Green: #10b981
    icon = '↑';
  } else if (change < 0) {
    indicatorColor = colors.error; // Red: #ef4444
    icon = '↓';
  } else {
    indicatorColor = colors.textMuted; // Gray: #64748b
    icon = '';
  }

  return (
    <View style={[styles.container, { backgroundColor: indicatorColor + '20' }]}>
      {icon ? (
        <Text style={[styles.icon, { color: indicatorColor }]}>{icon}</Text>
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  icon: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginRight: 2,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xs + 2,
  },
});

export default PriceChangeIndicator;

