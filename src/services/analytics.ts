/**
 * Analytics Service
 * 
 * Analytics infrastructure for tracking user behavior and business metrics.
 * Currently provides a no-op implementation that can be extended with
 * actual analytics services (e.g., Firebase Analytics, Mixpanel, etc.)
 * 
 * NOTE: Privacy-first approach - no personal data is tracked.
 * All analytics are opt-in and respect user privacy.
 */

import { environmentConfig } from '../config/environment';

/**
 * Analytics event types
 */
export type AnalyticsEventType =
  | 'screen_view'
  | 'user_action'
  | 'business_event'
  | 'error'
  | 'performance';

/**
 * Analytics event
 */
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

/**
 * Analytics service class
 */
class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private maxEvents = 50; // Keep last 50 events for debugging
  private enabled: boolean;

  constructor() {
    // Enable analytics based on environment config
    this.enabled = environmentConfig.enableAnalytics;
  }

  /**
   * Track a screen view
   */
  trackScreenView(screenName: string, properties?: Record<string, any>): void {
    if (!this.enabled) {
      return;
    }

    this.trackEvent('screen_view', screenName, {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Track a user action
   */
  trackAction(action: string, properties?: Record<string, any>): void {
    if (!this.enabled) {
      return;
    }

    this.trackEvent('user_action', action, properties);
  }

  /**
   * Track a business event
   */
  trackBusinessEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.enabled) {
      return;
    }

    this.trackEvent('business_event', eventName, properties);
  }

  /**
   * Track an error (non-critical)
   */
  trackError(errorName: string, properties?: Record<string, any>): void {
    if (!this.enabled) {
      return;
    }

    this.trackEvent('error', errorName, properties);
  }

  /**
   * Track a performance metric
   */
  trackPerformance(metricName: string, value: number, properties?: Record<string, any>): void {
    if (!this.enabled) {
      return;
    }

    this.trackEvent('performance', metricName, {
      value,
      ...properties,
    });
  }

  /**
   * Track a generic event
   */
  private trackEvent(
    type: AnalyticsEventType,
    name: string,
    properties?: Record<string, any>
  ): void {
    if (!this.enabled) {
      return;
    }

    const event: AnalyticsEvent = {
      type,
      name,
      properties: this.sanitizeProperties(properties),
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Keep only last N events
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Log in development
    if (environmentConfig.isDevelopment) {
      console.debug(`[ANALYTICS] ${type}: ${name}`, properties || {});
    }

    // TODO: Send to analytics service (Firebase, Mixpanel, etc.)
    // Example:
    // if (environmentConfig.isProduction) {
    //   FirebaseAnalytics.logEvent(name, properties);
    // }
  }

  /**
   * Sanitize properties to remove PII (Personally Identifiable Information)
   */
  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> | undefined {
    if (!properties) {
      return undefined;
    }

    const sanitized: Record<string, any> = {};
    const piiKeys = ['email', 'phone', 'name', 'address', 'id', 'userId', 'user_id'];

    for (const [key, value] of Object.entries(properties)) {
      // Skip PII keys
      if (piiKeys.some((piiKey) => key.toLowerCase().includes(piiKey.toLowerCase()))) {
        continue;
      }

      // Only allow primitive values and simple objects
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === null
      ) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Set user properties (anonymized)
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.enabled) {
      return;
    }

    const sanitized = this.sanitizeProperties(properties);
    if (sanitized) {
      // TODO: Send to analytics service
      // Example:
      // FirebaseAnalytics.setUserProperties(sanitized);
    }
  }

  /**
   * Get analytics events (for debugging)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Global analytics service instance
 */
export const analytics = new AnalyticsService();

export default analytics;

