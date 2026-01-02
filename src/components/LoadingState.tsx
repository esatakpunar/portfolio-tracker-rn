import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from './Text';
import { colors, spacing, fontSize, fontWeight } from '../theme';

interface LoadingStateProps {
  title?: string;
  description?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ title, description }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primaryStart} />
      {title && (
        <Text style={styles.title}>{title}</Text>
      )}
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default LoadingState;

