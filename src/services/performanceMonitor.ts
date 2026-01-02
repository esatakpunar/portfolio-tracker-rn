/**
 * Performance Monitoring Service
 * 
 * Tracks app performance metrics:
 * - Screen load times
 * - API response times
 * - Render performance
 * - Memory usage (if available)
 */

import { environmentConfig } from '../config/environment';

/**
 * Performance metrics
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * Performance event types
 */
export type PerformanceEventType =
  | 'screen_load'
  | 'api_request'
  | 'api_response'
  | 'render'
  | 'navigation'
  | 'action';

/**
 * Performance event
 */
export interface PerformanceEvent {
  type: PerformanceEventType;
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Performance monitor class
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private events: PerformanceEvent[] = [];
  private timers: Map<string, number> = new Map();
  private maxMetrics = 100; // Keep last 100 metrics
  private maxEvents = 100; // Keep last 100 events
  private enabled: boolean;

  constructor() {
    // Enable performance monitoring based on environment
    this.enabled = environmentConfig.enableLogging || environmentConfig.isProduction;
  }

  /**
   * Start a performance timer
   */
  startTimer(name: string): void {
    if (!this.enabled) {
      return;
    }
    this.timers.set(name, Date.now());
  }

  /**
   * End a performance timer and record metric
   */
  endTimer(name: string, tags?: Record<string, string>): number | null {
    if (!this.enabled) {
      return null;
    }

    const startTime = this.timers.get(name);
    if (!startTime) {
      return null;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags,
    });

    return duration;
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.enabled) {
      return;
    }

    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log in development
    if (environmentConfig.isDevelopment) {
      console.debug(`[PERF] ${metric.name}: ${metric.value}${metric.unit}`, metric.tags || {});
    }
  }

  /**
   * Record a performance event
   */
  recordEvent(
    type: PerformanceEventType,
    name: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    if (!this.enabled) {
      return;
    }

    const event: PerformanceEvent = {
      type,
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.events.push(event);

    // Keep only last N events
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Log in development
    if (environmentConfig.isDevelopment) {
      console.debug(`[PERF] ${type}: ${name} (${duration}ms)`, metadata || {});
    }
  }

  /**
   * Track screen load time
   */
  trackScreenLoad(screenName: string, loadTime: number): void {
    this.recordEvent('screen_load', screenName, loadTime, {
      screen: screenName,
    });
  }

  /**
   * Track API request/response time
   */
  trackApiCall(endpoint: string, duration: number, success: boolean): void {
    this.recordEvent('api_request', endpoint, duration, {
      endpoint,
      success,
    });
  }

  /**
   * Track navigation time
   */
  trackNavigation(from: string, to: string, duration: number): void {
    this.recordEvent('navigation', `${from} -> ${to}`, duration, {
      from,
      to,
    });
  }

  /**
   * Track user action
   */
  trackAction(action: string, duration: number, metadata?: Record<string, any>): void {
    this.recordEvent('action', action, duration, metadata);
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get performance events
   */
  getEvents(): PerformanceEvent[] {
    return [...this.events];
  }

  /**
   * Get average metric value by name
   */
  getAverageMetric(name: string): number | null {
    const metrics = this.metrics.filter((m) => m.name === name);
    if (metrics.length === 0) {
      return null;
    }

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalMetrics: number;
    totalEvents: number;
    averageScreenLoad?: number;
    averageApiCall?: number;
  } {
    const summary: {
      totalMetrics: number;
      totalEvents: number;
      averageScreenLoad?: number;
      averageApiCall?: number;
    } = {
      totalMetrics: this.metrics.length,
      totalEvents: this.events.length,
    };

    const screenLoads = this.events.filter((e) => e.type === 'screen_load');
    if (screenLoads.length > 0) {
      summary.averageScreenLoad =
        screenLoads.reduce((acc, e) => acc + e.duration, 0) / screenLoads.length;
    }

    const apiCalls = this.events.filter((e) => e.type === 'api_request');
    if (apiCalls.length > 0) {
      summary.averageApiCall =
        apiCalls.reduce((acc, e) => acc + e.duration, 0) / apiCalls.length;
    }

    return summary;
  }

  /**
   * Clear all metrics and events
   */
  clear(): void {
    this.metrics = [];
    this.events = [];
    this.timers.clear();
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

