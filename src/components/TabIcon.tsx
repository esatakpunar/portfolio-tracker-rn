import React from 'react';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme';

interface TabIconProps {
  name: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ name, focused }) => {
  const iconColor = focused ? colors.primaryStart : colors.textMuted;

  const getIconName = (): keyof typeof Feather.glyphMap => {
    switch (name) {
      case 'Portfolio':
        return 'briefcase';
      case 'History':
        return 'file-text';
      case 'Settings':
        return 'bar-chart-2';
      default:
        return 'circle';
    }
  };

  return <Feather name={getIconName()} size={24} color={iconColor} />;
};

export default TabIcon;
