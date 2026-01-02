/**
 * Clipboard Utility
 * 
 * Clipboard işlemleri için utility fonksiyonları
 * Expo Go'da native modül olmadığı için graceful degradation sağlar
 */

import { logger } from './logger';

// Dynamic import for expo-clipboard to handle Expo Go compatibility
let Clipboard: typeof import('expo-clipboard') | null = null;
let isClipboardAvailable = false;

// Try to load expo-clipboard (may not be available in Expo Go)
try {
  const clipboardModule = require('expo-clipboard');
  Clipboard = clipboardModule.default || clipboardModule;
  if (Clipboard && typeof Clipboard.setStringAsync === 'function') {
    isClipboardAvailable = true;
  }
} catch (error) {
  // Clipboard not available (Expo Go or module not installed)
  isClipboardAvailable = false;
  logger.debug('[CLIPBOARD] expo-clipboard not available, clipboard features disabled');
}

/**
 * Copy text to clipboard
 * 
 * @param text Text to copy
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (!text || typeof text !== 'string') {
      logger.warn('[CLIPBOARD] Invalid text to copy', { text });
      return false;
    }

    // Check if clipboard is available
    if (!isClipboardAvailable || !Clipboard) {
      logger.debug('[CLIPBOARD] Clipboard not available (Expo Go or module not installed)');
      return false;
    }

    await Clipboard.setStringAsync(text);
    logger.debug('[CLIPBOARD] Text copied successfully', { textLength: text.length });
    return true;
  } catch (error) {
    logger.error('[CLIPBOARD] Failed to copy text', error, { text });
    return false;
  }
};

/**
 * Get text from clipboard
 * 
 * @returns Promise<string | null> - Clipboard text or null if error
 */
export const getClipboardText = async (): Promise<string | null> => {
  try {
    // Check if clipboard is available
    if (!isClipboardAvailable || !Clipboard) {
      logger.debug('[CLIPBOARD] Clipboard not available (Expo Go or module not installed)');
      return null;
    }

    const text = await Clipboard.getStringAsync();
    logger.debug('[CLIPBOARD] Text retrieved from clipboard', { textLength: text?.length || 0 });
    return text;
  } catch (error) {
    logger.error('[CLIPBOARD] Failed to get clipboard text', error);
    return null;
  }
};

/**
 * Check if clipboard is available
 * 
 * @returns boolean - true if clipboard is available
 */
export const isClipboardSupported = (): boolean => {
  return isClipboardAvailable;
};

