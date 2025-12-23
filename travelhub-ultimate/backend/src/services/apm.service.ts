/**
 * APM (Application Performance Monitoring) Service
 * Compatible with DataDog, New Relic, and other APM platforms
 */

import logger from '../utils/enhancedLogger.js';
import { metricsService } from './metrics.service.js';

/**
 * Transaction/Span tracking
 */
interface Transaction {
  id: string;
  name: string;
  type: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  result?: 'success' | 'error';
  metadata?: Record<string, any>;
  spans: Span[];
}

interface Span {
  id: string;
  name: string;
  type: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  parentId?: string;
  metadata?: Record<string, any>;
}

/**
 * APM Service Class
 */
class APMService {
  private transactions: Map<string, Transaction> = new Map();
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.APM_ENABLED === 'true';
    if (this.enabled) {
      logger.info('APM Service initialized');
    }
  }

  /**
   * Start a new transaction
   */
  startTransaction(
    name: string,
    type: string = 'request',
    metadata?: Record<string, any>
  ): string {
    if (!this.enabled) return '';

    const id = this.generateId();
    const transaction: Transaction = {
      id,
      name,
      type,
      startTime: Date.now(),
      metadata,
      spans: [],
    };

    this.transactions.set(id, transaction);
    return id;
  }

  /**
   * End a transaction
   */
  endTransaction(
    id: string,
    result: 'success' | 'error' = 'success',
    metadata?: Record<string, any>
  ): void {
    if (!this.enabled) return;

    const transaction = this.transactions.get(id);
    if (!transaction) return;

    transaction.endTime = Date.now();
    transaction.duration = transaction.endTime - transaction.startTime;
    transaction.result = result;
    if (metadata) {
      transaction.metadata = { ...transaction.metadata, ...metadata };
    }

    // Log transaction
    logger.performance(transaction.name, transaction.duration, {
      transactionId: transaction.id,
      type: transaction.type,
      result: transaction.result,
      spansCount: transaction.spans.length,
      ...transaction.metadata,
    });

    // Track in Prometheus
    metricsService.trackHttpRequest(
      transaction.metadata?.method || 'UNKNOWN',
      transaction.metadata?.route || transaction.name,
      transaction.metadata?.statusCode || 200,
      transaction.duration / 1000 // Convert to seconds
    );

    // Cleanup
    this.transactions.delete(id);
  }

  /**
   * Start a span within a transaction
   */
  startSpan(
    transactionId: string,
    name: string,
    type: string = 'custom',
    metadata?: Record<string, any>
  ): string {
    if (!this.enabled) return '';

    const transaction = this.transactions.get(transactionId);
    if (!transaction) return '';

    const spanId = this.generateId();
    const span: Span = {
      id: spanId,
      name,
      type,
      startTime: Date.now(),
      metadata,
    };

    transaction.spans.push(span);
    return spanId;
  }

  /**
   * End a span
   */
  endSpan(transactionId: string, spanId: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;

    const span = transaction.spans.find(s => s.id === spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    if (metadata) {
      span.metadata = { ...span.metadata, ...metadata };
    }

    // Track specific span types
    if (span.type === 'db') {
      metricsService.trackDatabaseQuery(
        span.metadata?.operation || 'query',
        span.metadata?.table || 'unknown',
        span.duration / 1000
      );
    } else if (span.type === 'cache') {
      const operation = span.metadata?.operation || 'get';
      // Track cache operation duration
    } else if (span.type === 'external') {
      metricsService.trackExternalApiCall(
        span.metadata?.api || 'unknown',
        span.metadata?.status || 'success',
        span.duration / 1000
      );
    }
  }

  /**
   * Track custom event
   */
  trackEvent(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    logger.business(name, {
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    logger.error(error.message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...metadata,
    });

    metricsService.trackError(error.name, 'high');
  }

  /**
   * Set user context
   */
  setUser(userId: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    // Store user context for current request
    // This would typically be stored in async local storage
    logger.debug('User context set', { userId, ...metadata });
  }

  /**
   * Add custom tags
   */
  addTags(tags: Record<string, string | number | boolean>): void {
    if (!this.enabled) return;

    // Add tags to current transaction
    // This would typically be stored in async local storage
    logger.debug('Tags added', tags);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get transaction statistics
   */
  getStats(): {
    activeTransactions: number;
    totalSpans: number;
  } {
    const totalSpans = Array.from(this.transactions.values())
      .reduce((sum, t) => sum + t.spans.length, 0);

    return {
      activeTransactions: this.transactions.size,
      totalSpans,
    };
  }
}

// Export singleton instance
export const apmService = new APMService();
export default apmService;
