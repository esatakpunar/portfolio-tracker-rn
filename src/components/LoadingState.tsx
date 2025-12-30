import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from './Text';
import { colors, spacing, fontSize, fontWeight } from '../theme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = React.memo(({
  message,
  size = 'large',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primaryStart} />
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
});

LoadingState.displayName = 'LoadingState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  message: {
    marginTop: spacing.lg,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default LoadingState;

