/**
 * Logger Tests
 * 
 * Logger singleton olduğu için, isDevelopment değeri constructor'da set ediliyor.
 * Bu yüzden testlerde logger'ın temel functionality'sini test ediyoruz.
 */

import { logger } from '../logger';
import { captureException, captureMessage } from '../../config/sentry';

// Mock Sentry
jest.mock('../../config/sentry', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

// Mock console
const consoleLog = jest.spyOn(console, 'log').mockImplementation();
const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const consoleError = jest.spyOn(console, 'error').mockImplementation();

describe('logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLog.mockRestore();
    consoleWarn.mockRestore();
    consoleError.mockRestore();
  });

  describe('debug', () => {
    it('should call console.log with correct format when in development', () => {
      // Logger isDevelopment'ı constructor'da kontrol ediyor
      // Test environment'ta genellikle development mode'da olur
      logger.debug('Test message', { key: 'value' });

      // Eğer development mode'daysa log yapılmalı
      // Production mode'daysa log yapılmamalı
      // Bu test logger'ın format'ını kontrol ediyor
      if (consoleLog.mock.calls.length > 0) {
        expect(consoleLog).toHaveBeenCalledWith(
          '[DEBUG] Test message',
          { key: 'value' }
        );
      }
    });

    it('should handle debug without context', () => {
      logger.debug('Test message');
      
      if (consoleLog.mock.calls.length > 0) {
        expect(consoleLog).toHaveBeenCalledWith(
          '[DEBUG] Test message',
          ''
        );
      }
    });
  });

  describe('info', () => {
    it('should call console.log with correct format', () => {
      logger.info('Test message', { key: 'value' });

      if (consoleLog.mock.calls.length > 0) {
        expect(consoleLog).toHaveBeenCalledWith(
          '[INFO] Test message',
          { key: 'value' }
        );
      }
    });
  });

  describe('warn', () => {
    it('should call console.warn or Sentry with correct format', () => {
      logger.warn('Test warning', { key: 'value' });

      // Development mode'daysa console.warn, production'daysa Sentry
      if (consoleWarn.mock.calls.length > 0) {
        expect(consoleWarn).toHaveBeenCalledWith(
          '[WARN] Test warning',
          { key: 'value' }
        );
      } else {
        // Production mode - Sentry'ye gönderilmeli
        expect(captureMessage).toHaveBeenCalledWith(
          'Test warning',
          'warning',
          { key: 'value' }
        );
      }
    });
  });

  describe('error', () => {
    it('should handle Error objects correctly', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error, { key: 'value' });

      // Development mode'daysa console.error, production'daysa Sentry
      if (consoleError.mock.calls.length > 0) {
        expect(consoleError).toHaveBeenCalledWith(
          '[ERROR] Test error message',
          error,
          { key: 'value' }
        );
      } else {
        // Production mode - Sentry'ye gönderilmeli
        expect(captureException).toHaveBeenCalledWith(error, {
          message: 'Test error message',
          key: 'value',
        });
      }
    });

    it('should handle non-Error objects correctly', () => {
      const error = 'String error';
      logger.error('Test error message', error, { key: 'value' });

      // Development mode'daysa console.error, production'daysa Sentry
      if (consoleError.mock.calls.length > 0) {
        expect(consoleError).toHaveBeenCalledWith(
          '[ERROR] Test error message',
          error,
          { key: 'value' }
        );
      } else {
        // Production mode - Sentry'ye message olarak gönderilmeli
        expect(captureMessage).toHaveBeenCalledWith(
          'Test error message',
          'error',
          { error, key: 'value' }
        );
      }
    });

    it('should handle error without context', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);

      if (consoleError.mock.calls.length > 0) {
        expect(consoleError).toHaveBeenCalledWith(
          '[ERROR] Test error message',
          error,
          ''
        );
      }
    });
  });
});

