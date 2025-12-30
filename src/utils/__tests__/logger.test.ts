/**
 * Logger Tests
 */

import { logger } from '../logger';
import { captureException, captureMessage } from '../../config/sentry';
import { isDevelopment } from '../env';

// Mock Sentry
jest.mock('../../config/sentry', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

// Mock env
jest.mock('../env', () => ({
  isDevelopment: jest.fn(() => true),
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
    it('should log in development mode', () => {
      (isDevelopment as jest.Mock).mockReturnValueOnce(true);

      logger.debug('Test message', { key: 'value' });

      expect(consoleLog).toHaveBeenCalledWith(
        '[DEBUG] Test message',
        { key: 'value' }
      );
    });

    it('should not log in production mode', () => {
      (isDevelopment as jest.Mock).mockReturnValueOnce(false);

      logger.debug('Test message');

      expect(consoleLog).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log in development mode', () => {
      (isDevelopment as jest.Mock).mockReturnValueOnce(true);

      logger.info('Test message', { key: 'value' });

      expect(consoleLog).toHaveBeenCalledWith(
        '[INFO] Test message',
        { key: 'value' }
      );
    });

    it('should not log in production mode', () => {
      (isDevelopment as jest.Mock).mockReturnValueOnce(false);

      logger.info('Test message');

      expect(consoleLog).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log in development mode', () => {
      (isDevelopment as jest.Mock).mockReturnValueOnce(true);

      logger.warn('Test warning', { key: 'value' });

      expect(consoleWarn).toHaveBeenCalledWith(
        '[WARN] Test warning',
        { key: 'value' }
      );
    });

    it('should send to Sentry in production mode', () => {
      (isDevelopment as jest.Mock).mockReturnValueOnce(false);

      logger.warn('Test warning', { key: 'value' });

      expect(consoleWarn).not.toHaveBeenCalled();
      expect(captureMessage).toHaveBeenCalledWith(
        'Test warning',
        'warning',
        { key: 'value' }
      );
    });
  });

  describe('error', () => {
    it('should log in development mode', () => {
      (isDevelopment as jest.Mock).mockReturnValueOnce(true);
      const error = new Error('Test error');

      logger.error('Test error message', error, { key: 'value' });

      expect(consoleError).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        error,
        { key: 'value' }
      );
    });

    it('should send Error to Sentry in production mode', () => {
      (isDevelopment as jest.Mock).mockReturnValueOnce(false);
      const error = new Error('Test error');

      logger.error('Test error message', error, { key: 'value' });

      expect(consoleError).not.toHaveBeenCalled();
      expect(captureException).toHaveBeenCalledWith(error, {
        message: 'Test error message',
        key: 'value',
      });
    });

    it('should send non-Error to Sentry as message in production mode', () => {
      (isDevelopment as jest.Mock).mockReturnValueOnce(false);
      const error = 'String error';

      logger.error('Test error message', error, { key: 'value' });

      expect(consoleError).not.toHaveBeenCalled();
      expect(captureMessage).toHaveBeenCalledWith(
        'Test error message',
        'error',
        { error, key: 'value' }
      );
    });

    it('should handle error without context', () => {
      (isDevelopment as jest.Mock).mockReturnValueOnce(true);
      const error = new Error('Test error');

      logger.error('Test error message', error);

      expect(consoleError).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        error,
        ''
      );
    });
  });
});

