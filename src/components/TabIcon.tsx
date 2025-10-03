import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface TabIconProps {
  name: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ name, focused }) => {
  const iconColor = focused ? colors.primaryStart : colors.textMuted;

  const renderIcon = () => {
    switch (name) {
      case 'Portfolio':
        return (
          <View style={styles.iconContainer}>
            {/* Briefcase icon */}
            <View style={[styles.briefcaseBody, { borderColor: iconColor }]}>
              <View style={[styles.briefcaseHandle, { backgroundColor: iconColor }]} />
            </View>
          </View>
        );
      case 'History':
        return (
          <View style={styles.iconContainer}>
            {/* Chart icon */}
            <View style={styles.chartContainer}>
              <View style={[styles.chartBar, styles.bar1, { backgroundColor: iconColor }]} />
              <View style={[styles.chartBar, styles.bar2, { backgroundColor: iconColor }]} />
              <View style={[styles.chartBar, styles.bar3, { backgroundColor: iconColor }]} />
            </View>
          </View>
        );
      case 'Settings':
        return (
          <View style={styles.iconContainer}>
            {/* Gear icon */}
            <View style={[styles.gear, { borderColor: iconColor }]}>
              <View style={[styles.gearCenter, { backgroundColor: iconColor }]} />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return renderIcon();
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Briefcase (Portfolio)
  briefcaseBody: {
    width: 22,
    height: 16,
    borderWidth: 2,
    borderRadius: 3,
    position: 'relative',
  },
  briefcaseHandle: {
    width: 10,
    height: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    position: 'absolute',
    top: -4,
    left: 4,
  },
  
  // Chart (History)
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: 20,
    height: 18,
  },
  chartBar: {
    width: 4,
    borderRadius: 2,
  },
  bar1: {
    height: 10,
  },
  bar2: {
    height: 18,
  },
  bar3: {
    height: 14,
  },
  
  // Gear (Settings)
  gear: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default TabIcon;
