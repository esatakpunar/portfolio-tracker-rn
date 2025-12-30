/**
 * Centralized Logger Service
 * 
 * Production'da console.log'ları kaldırır ve Sentry'ye error gönderir
 * Development'ta console'a yazar
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = __DEV__;
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
   * Warning log - development'ta console, production'da Sentry (optional)
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '');
    } else {
      // Production'da Sentry'ye gönder (Sentry kurulduktan sonra aktif olacak)
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
      this.sendToSentry('error', message, { error, ...context });
    }
  }

  /**
   * Sentry'ye error gönder (Sentry kurulduktan sonra implement edilecek)
   */
  private sendToSentry(level: LogLevel, message: string, context?: LogContext): void {
    // Sentry integration Issue #4'te eklenecek
    // Şimdilik placeholder
    try {
      // @ts-ignore - Sentry henüz kurulmadı
      if (typeof Sentry !== 'undefined') {
        // @ts-ignore
        Sentry.captureMessage(message, {
          level,
          extra: context,
        });
      }
    } catch (e) {
      // Sentry yoksa sessizce geç
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Default export
export default logger;

