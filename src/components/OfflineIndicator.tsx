/**
 * Offline Indicator Component
 * 
 * Network durumunu gösteren component
 * Offline olduğunda kullanıcıya bildirim gösterir
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './Text';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { colors, spacing, fontSize, fontWeight } from '../theme';
import { useTranslation } from 'react-i18next';

export const OfflineIndicator: React.FC = () => {
  const { isConnected } = useNetworkStatus();
  const { t } = useTranslation();
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (!isConnected) {
      // Slide down when offline
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Slide up when online
      Animated.spring(slideAnim, {
        toValue: -100,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [isConnected, slideAnim]);

  if (isConnected) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.icon}>📡</Text>
          <Text style={styles.text}>{t('offlineMessage')}</Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: colors.error,
  },
  safeArea: {
    backgroundColor: colors.error,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.error,
  },
  icon: {
    fontSize: fontSize.base,
    marginRight: spacing.sm,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.background,
  },
});

