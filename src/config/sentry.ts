/**
 * Sentry Configuration
 * 
 * Production'da error tracking için Sentry kullanılır
 * Development'ta Sentry disabled (optional)
 * 
 * NOTE: Logger import'u yok - require cycle'ı önlemek için
 * Logger kullanmak yerine console.log kullanıyoruz (sadece initialization sırasında)
 */

import * as Sentry from '@sentry/react-native';
import { isDevelopment } from '../utils/env';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

/**
 * Initialize Sentry
 * Sadece production'da ve DSN varsa aktif
 */
export const initializeSentry = () => {
  const isDev = isDevelopment();
  
  // Development'ta Sentry'yi disable edebiliriz (optional)
  if (isDev && !process.env.EXPO_PUBLIC_ENABLE_SENTRY_IN_DEV) {
    return;
  }

  // DSN yoksa Sentry'yi başlatma
  if (!SENTRY_DSN) {
    // Logger henüz hazır olmayabilir, console.log kullan
    if (isDev) {
      console.warn('[SENTRY] DSN not configured, Sentry disabled');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: isDev ? 'development' : 'production',
      enableAutoSessionTracking: true,
      tracesSampleRate: isDev ? 1.0 : 0.1, // Production'da %10 sampling
      // PII (Personally Identifiable Information) filtering
      beforeSend(event, hint) {
        // Sensitive data'yı filtrele
        if (event.request) {
          // Request body'den sensitive data'yı kaldır
          if (event.request.data) {
            delete event.request.data;
          }
        }
        return event;
      },
    });

    // Logger henüz hazır olmayabilir, console.log kullan
    if (isDev) {
      console.debug('[SENTRY] Initialized successfully');
    }
  } catch (error) {
    // Sentry initialization hatası - sessizce geç
    // Logger henüz hazır olmayabilir, console.error kullan
    if (isDev) {
      console.error('[SENTRY] Initialization failed', error);
    }
  }
};

/**
 * Sentry'ye error gönder
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  try {
    Sentry.captureException(error, {
      extra: context,
    });
  } catch (e) {
    // Sentry yoksa sessizce geç
  }
};

/**
 * Sentry'ye message gönder
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'error', context?: Record<string, any>) => {
  try {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } catch (e) {
    // Sentry yoksa sessizce geç
  }
};

export default Sentry;

