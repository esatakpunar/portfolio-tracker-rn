/**
 * Centralized Logger Service
 * 
 * Production'da console.log'ları kaldırır ve Sentry'ye error gönderir
 * Development'ta console'a yazar
 */

import { captureException, captureMessage } from '../config/sentry';
import { isDevelopment } from './env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = isDevelopment();
  }

  /**
   * Debug log - sadece development'ta
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Info log - sadece development'ta
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context || '');
    }
  }

  /**
   * Warning log - development'ta console, production'da Sentry
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '');
    } else {
      // Production'da Sentry'ye gönder
      this.sendToSentry('warning', message, context);
    }
  }

  /**
   * Error log - development'ta console, production'da Sentry
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '', context || '');
    } else {
      // Production'da Sentry'ye gönder
      if (error instanceof Error) {
        captureException(error, { message, ...context });
      } else {
        this.sendToSentry('error', message, { error, ...context });
      }
    }
  }

  /**
   * Sentry'ye error gönder
   */
  private sendToSentry(level: LogLevel, message: string, context?: LogContext): void {
    try {
      captureMessage(message, level as any, context);
    } catch (e) {
      // Sentry yoksa sessizce geç
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Default export
export default logger;

