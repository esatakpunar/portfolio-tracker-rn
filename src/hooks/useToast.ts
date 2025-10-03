import { useState, useCallback, useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  message: string;
  type: ToastType;
  id: string;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    const newToast: Toast = { message, type, id };
    
    setToasts(prev => [...prev, newToast]);

    // Fade in animation
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      fadeAnim.setValue(0);
    });
  }, [fadeAnim]);

  const removeToast = useCallback((id: string) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      fadeAnim.setValue(0);
    });
  }, [fadeAnim]);

  return {
    toasts,
    showToast,
    removeToast,
    fadeAnim
  };
};
