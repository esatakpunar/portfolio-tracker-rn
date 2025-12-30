import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { colors, borderRadius, spacing, fontSize } from '../theme';
import { Toast, ToastType } from '../hooks/useToast';

interface ToastNotificationProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onRemove }) => {
  const insets = useSafeAreaInsets();
  const animations = useRef<Map<string, Animated.Value>>(new Map());
  
  const getToastColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
      default:
        return colors.info;
    }
  };

  useEffect(() => {
    // Create animation for new toasts
    toasts.forEach((toast) => {
      if (!animations.current.has(toast.id)) {
        const animValue = new Animated.Value(0);
        animations.current.set(toast.id, animValue);
        
        // Fade in
        Animated.spring(animValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      }
    });

    // Clean up animations for removed toasts
    const currentIds = new Set(toasts.map(t => t.id));
    animations.current.forEach((anim, id) => {
      if (!currentIds.has(id)) {
        animations.current.delete(id);
      }
    });
  }, [toasts]);

  const handleRemove = (id: string) => {
    const anim = animations.current.get(id);
    if (anim) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        animations.current.delete(id);
        onRemove(id);
      });
    } else {
      onRemove(id);
    }
  };

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + spacing.md }]}>
      {toasts.map((toast) => {
        const animValue = animations.current.get(toast.id) || new Animated.Value(1);
        
        return (
          <Animated.View
            key={toast.id}
            style={[
              styles.toast,
              {
                backgroundColor: getToastColor(toast.type),
                opacity: animValue,
                transform: [{
                  translateY: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.toastText}>{toast.message}</Text>
            <TouchableOpacity onPress={() => handleRemove(toast.id)} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  toastText: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: '500',
    flex: 1,
  },
  closeButton: {
    marginLeft: spacing.md,
    padding: spacing.xs,
  },
  closeText: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
});

export default ToastNotification;
