import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { withTranslation, WithTranslation } from 'react-i18next';
import { Text } from './Text';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { logger } from '../utils/logger';
import { captureException } from '../config/sentry';
import { isDevelopment } from '../utils/env';

interface Props extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });
    
    // Sentry'ye error gönder
    captureException(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleRestart = () => {
    Alert.alert(
      this.props.t('errorBoundary.restartApp'),
      this.props.t('errorBoundary.message'),
      [
        {
          text: this.props.t('cancel'),
          style: 'cancel',
        },
        {
          text: this.props.t('errorBoundary.restartApp'),
          style: 'destructive',
          onPress: () => {
            // Force app restart by clearing state
            this.setState({
              hasError: false,
              error: null,
            });
            // In a real app, you might want to reset Redux store or navigate to a safe screen
          },
        },
      ]
    );
  };

  handleReportError = () => {
    if (this.state.error) {
      captureException(this.state.error, {
        userReported: true,
        componentStack: this.state.error.stack,
      });
      Alert.alert(
        this.props.t('errorBoundary.reportError'),
        this.props.t('errorBoundary.errorDetails'),
        [
          {
            text: this.props.t('ok'),
            onPress: () => {
              // Error reported to Sentry
            },
          },
        ]
      );
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { t } = this.props;
      const showErrorDetails = isDevelopment() && this.state.error;

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>⚠️</Text>
            <Text style={styles.title}>{t('errorBoundary.title')}</Text>
            <Text style={styles.message}>
              {showErrorDetails
                ? this.state.error?.message || t('errorBoundary.message')
                : t('errorBoundary.message')}
            </Text>
            
            {showErrorDetails && this.state.error && (
              <View style={styles.errorDetailsContainer}>
                <Text style={styles.errorDetailsTitle}>{t('errorBoundary.errorDetails')}</Text>
                <Text style={styles.errorDetailsText}>
                  {this.state.error.message}
                </Text>
                {this.state.error.stack && (
                  <Text style={styles.errorStackText}>
                    {this.state.error.stack.substring(0, 500)}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={this.handleReset}
                accessible={true}
                accessibilityLabel={t('errorBoundary.tryAgain')}
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>{t('errorBoundary.tryAgain')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={this.handleRestart}
                accessible={true}
                accessibilityLabel={t('errorBoundary.restartApp')}
                accessibilityRole="button"
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  {t('errorBoundary.restartApp')}
                </Text>
              </TouchableOpacity>
            </View>

            {!isDevelopment() && (
              <TouchableOpacity 
                style={styles.reportButton} 
                onPress={this.handleReportError}
                accessible={true}
                accessibilityLabel={t('errorBoundary.reportError')}
                accessibilityRole="button"
              >
                <Text style={styles.reportButtonText}>{t('errorBoundary.reportError')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: colors.primaryStart,
  },
  secondaryButton: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: colors.textSecondary,
  },
  reportButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  reportButtonText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  errorDetailsContainer: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
    maxHeight: 200,
  },
  errorDetailsTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  errorDetailsText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  errorStackText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
});

export default withTranslation()(ErrorBoundary);

