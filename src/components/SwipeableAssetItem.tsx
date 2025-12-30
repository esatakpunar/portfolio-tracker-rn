import React, { forwardRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { Text } from './Text';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { PortfolioItem } from '../types';

interface SwipeableItemProps {
  item: PortfolioItem;
  pricePerUnit: number;
  onEdit: () => void;
  onDelete: () => void;
  onSwipeableWillOpen?: () => void;
  children: React.ReactNode;
}

const SwipeableAssetItem = React.memo(
  forwardRef<Swipeable, SwipeableItemProps>(({
    item,
    pricePerUnit,
    onEdit,
    onDelete,
    onSwipeableWillOpen,
    children,
  }, ref) => {
    const { t } = useTranslation();

    const renderRightActions = React.useCallback((
      progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>
    ) => {
    const opacity = dragX.interpolate({
      inputRange: [-80, -20, 0],
      outputRange: [1, 0.9, 0],
      extrapolate: 'clamp',
    });

    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.9],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.rightAction, { opacity }]}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('delete')}
          accessibilityHint={t('swipeToDelete') || t('deleteItem')}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Text style={styles.deleteText}>{t('delete')}</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [onDelete, t]);

  return (
    <Swipeable
      ref={ref}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      onSwipeableWillOpen={onSwipeableWillOpen}
    >
      {children}
    </Swipeable>
  );
  }),
  (prevProps, nextProps) => {
    // Custom comparison: only re-render if item or pricePerUnit changes
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.amount === nextProps.item.amount &&
      prevProps.item.type === nextProps.item.type &&
      prevProps.pricePerUnit === nextProps.pricePerUnit
    );
  }
);

SwipeableAssetItem.displayName = 'SwipeableAssetItem';

const styles = StyleSheet.create({
  rightAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  deleteButton: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: borderRadius.lg,
  },
  deleteText: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});

export default SwipeableAssetItem;
