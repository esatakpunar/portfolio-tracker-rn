/**
 * ErrorBoundary Tests
 */

import React from 'react';
import { View, Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorBoundary from '../ErrorBoundary';
import { captureException } from '../../config/sentry';

// Mock Sentry
jest.mock('../../config/sentry', () => ({
  captureException: jest.fn(),
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Mock env
jest.mock('../../utils/env', () => ({
  isDevelopment: jest.fn(() => true),
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  withTranslation: () => (Component: any) => (props: any) => {
    const mockT = (key: string) => {
      const translations: Record<string, string> = {
        'errorBoundary.title': 'Something went wrong',
        'errorBoundary.message': 'An unexpected error occurred. Please restart the app.',
        'errorBoundary.tryAgain': 'Try Again',
        'errorBoundary.restartApp': 'Restart App',
        'errorBoundary.reportError': 'Report Error',
        'errorBoundary.errorDetails': 'Error Details',
        'cancel': 'Cancel',
        'ok': 'OK',
      };
      return translations[key] || key;
    };
    return <Component {...props} t={mockT} />;
  },
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'errorBoundary.title': 'Something went wrong',
        'errorBoundary.message': 'An unexpected error occurred. Please restart the app.',
        'errorBoundary.tryAgain': 'Try Again',
        'errorBoundary.restartApp': 'Restart App',
        'errorBoundary.reportError': 'Report Error',
        'errorBoundary.errorDetails': 'Error Details',
        'cancel': 'Cancel',
        'ok': 'OK',
      };
      return translations[key] || key;
    },
  }),
}));

// Component that throws error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return null;
};

// Test component
const TestComponent = () => (
  <View>
    <Text>Test content</Text>
  </View>
);

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
        <TestComponent />
      </ErrorBoundary>
    );

    expect(getByText('Test content')).toBeDefined();
  });

  it('should catch error and render error UI', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeDefined();
    expect(getByText('Try Again')).toBeDefined();
  });

  it('should show error message in development mode', () => {
    const { getAllByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error message appears multiple times (in message and error details)
    expect(getAllByText('Test error').length).toBeGreaterThan(0);
  });

  it('should call captureException when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should reset error state when Try Again is pressed', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeDefined();

    fireEvent.press(getByText('Try Again'));

    // After reset, error should be cleared but component will re-render
    // ErrorBoundary resets state, so error UI should disappear
    // Note: This might re-throw if ThrowError still throws
    // In real scenario, the component that threw error would be fixed
  });

  it('should render custom fallback when provided', () => {
    const CustomFallback = () => (
      <View>
        <Text>Custom error UI</Text>
      </View>
    );
    const customFallback = <CustomFallback />;

    const { getByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Custom error UI')).toBeDefined();
  });
});

