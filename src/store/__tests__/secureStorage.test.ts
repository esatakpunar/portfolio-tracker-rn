/**
 * Secure Storage Tests
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage, migrateToSecureStorage } from '../secureStorage';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('secureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setItem', () => {
    it('should store item in SecureStore', async () => {
      await secureStorage.setItem('persist:root', 'test-value');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'secure_persist_root',
        'test-value'
      );
    });

    it('should convert key format correctly', async () => {
      await secureStorage.setItem('persist:root', 'value');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'secure_persist_root',
        'value'
      );
    });

    it('should throw error when SecureStore fails', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      await expect(secureStorage.setItem('persist:root', 'value')).rejects.toThrow(
        'Storage error'
      );
    });
  });

  describe('getItem', () => {
    it('should retrieve item from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('test-value');

      const result = await secureStorage.getItem('persist:root');

      expect(result).toBe('test-value');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('secure_persist_root');
    });

    it('should return null when item does not exist', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      const result = await secureStorage.getItem('persist:root');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      const result = await secureStorage.getItem('persist:root');

      expect(result).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('should remove item from SecureStore', async () => {
      await secureStorage.removeItem('persist:root');

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('secure_persist_root');
    });

    it('should throw error when SecureStore fails', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      await expect(secureStorage.removeItem('persist:root')).rejects.toThrow(
        'Storage error'
      );
    });
  });
});

describe('migrateToSecureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should skip migration when no data in AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const result = await migrateToSecureStorage();

    expect(result).toBe(true);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('should skip migration when data already in SecureStore', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('existing-data');
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('secure-data');

    const result = await migrateToSecureStorage();

    expect(result).toBe(true);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('persist:root');
  });

  it('should migrate data from AsyncStorage to SecureStore', async () => {
    const testData = '{"portfolio":{"items":[]}}';
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(testData);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

    const result = await migrateToSecureStorage();

    expect(result).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'secure_persist_root',
      testData
    );
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('persist:root');
  });

  it('should handle migration errors gracefully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
      new Error('Storage error')
    );

    const result = await migrateToSecureStorage();

    expect(result).toBe(false);
  });

  it('should continue even if cleanup fails', async () => {
    const testData = '{"portfolio":{"items":[]}}';
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(testData);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
      new Error('Cleanup error')
    );

    const result = await migrateToSecureStorage();

    expect(result).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalled();
  });
});

