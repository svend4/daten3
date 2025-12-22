/**
 * Service Mesh - Retry Policy
 * Advanced retry mechanisms with exponential backoff and jitter
 *
 * Features:
 * - Exponential backoff with configurable base delay
 * - Jitter to prevent thundering herd
 * - Retry budget to prevent retry storms
 * - Conditional retries based on error type
 * - Per-operation retry configuration
 */

import logger from '../utils/logger.js';

/**
 * Retry policy configuration
 */
export interface RetryConfig {
  maxAttempts: number; // Maximum retry attempts
  baseDelay: number; // Base delay in ms
  maxDelay: number; // Maximum delay in ms
  exponentialBase: number; // Exponential backoff base (default: 2)
  jitter: boolean; // Add jitter to prevent thundering herd
  jitterFactor: number; // Jitter factor (0-1, default: 0.1)
  retryableErrors: string[]; // List of retryable error codes/types
  retryBudget: number; // Percentage of requests allowed to retry (0-100)
  timeout: number; // Overall timeout for all retries
}

/**
 * Retry statistics
 */
interface RetryStats {
  totalAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  retriesExhausted: number;
  budgetExceeded: number;
  timeouts: number;
  averageAttempts: number;
  totalRetryTime: number;
  retryByErrorType: Map<string, number>;
}

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 100,
  maxDelay: 5000,
  exponentialBase: 2,
  jitter: true,
  jitterFactor: 0.1,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'EAI_AGAIN',
    'NETWORK_ERROR',
    'TIMEOUT',
    '503',
    '504',
    '429', // Rate limit - should retry with backoff
  ],
  retryBudget: 20, // 20% of requests can retry
  timeout: 30000, // 30 seconds total timeout
};

/**
 * Retry context
 */
interface RetryContext {
  operation: string;
  attempt: number;
  startTime: number;
  lastError?: Error;
}

class RetryPolicyService {
  private configs: Map<string, RetryConfig> = new Map();
  private stats: RetryStats = {
    totalAttempts: 0,
    successfulRetries: 0,
    failedRetries: 0,
    retriesExhausted: 0,
    budgetExceeded: 0,
    timeouts: 0,
    averageAttempts: 0,
    totalRetryTime: 0,
    retryByErrorType: new Map(),
  };

  // Retry budget tracking
  private requestWindow: number[] = []; // Timestamps of recent requests
  private retryWindow: number[] = []; // Timestamps of recent retries
  private windowSize: number = 10000; // 10 second window

  /**
   * Register retry policy for operation
   */
  registerPolicy(operation: string, config: Partial<RetryConfig>): void {
    this.configs.set(operation, { ...DEFAULT_CONFIG, ...config });
    logger.info('Retry policy registered', { operation, config });
  }

  /**
   * Execute operation with retry logic
   */
  async execute<T>(
    operation: string,
    fn: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = customConfig
      ? { ...DEFAULT_CONFIG, ...customConfig }
      : this.configs.get(operation) || DEFAULT_CONFIG;

    const context: RetryContext = {
      operation,
      attempt: 0,
      startTime: Date.now(),
    };

    // Check retry budget
    if (!this.checkRetryBudget(config.retryBudget)) {
      this.stats.budgetExceeded++;
      logger.warn('Retry budget exceeded', { operation });
      // Execute once without retry
      return await fn();
    }

    // Track this request
    this.trackRequest();

    return await this.executeWithRetry(fn, config, context);
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig,
    context: RetryContext
  ): Promise<T> {
    while (context.attempt < config.maxAttempts) {
      context.attempt++;
      this.stats.totalAttempts++;

      try {
        // Check overall timeout
        const elapsed = Date.now() - context.startTime;
        if (elapsed >= config.timeout) {
          this.stats.timeouts++;
          throw new Error(`Retry timeout exceeded for ${context.operation}`);
        }

        // Execute operation
        const result = await fn();

        // Success - update stats
        if (context.attempt > 1) {
          this.stats.successfulRetries++;
          const retryTime = Date.now() - context.startTime;
          this.stats.totalRetryTime += retryTime;
          this.stats.averageAttempts =
            (this.stats.averageAttempts * (this.stats.successfulRetries - 1) + context.attempt) /
            this.stats.successfulRetries;

          logger.info('Operation succeeded after retry', {
            operation: context.operation,
            attempts: context.attempt,
            retryTime,
          });
        }

        return result;
      } catch (error: any) {
        context.lastError = error;

        // Check if error is retryable
        if (!this.isRetryableError(error, config)) {
          logger.debug('Non-retryable error', {
            operation: context.operation,
            error: error.message,
            code: error.code,
          });
          throw error;
        }

        // Track retry by error type
        const errorType = error.code || error.name || 'UNKNOWN';
        const count = this.stats.retryByErrorType.get(errorType) || 0;
        this.stats.retryByErrorType.set(errorType, count + 1);

        // Check if max attempts reached
        if (context.attempt >= config.maxAttempts) {
          this.stats.retriesExhausted++;
          this.stats.failedRetries++;
          logger.error('Max retry attempts exhausted', {
            operation: context.operation,
            attempts: context.attempt,
            error: error.message,
          });
          throw error;
        }

        // Track retry
        this.trackRetry();

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(context.attempt, config);

        logger.debug('Retrying operation', {
          operation: context.operation,
          attempt: context.attempt,
          nextAttempt: context.attempt + 1,
          delay,
          error: error.message,
        });

        // Wait before retry
        await this.sleep(delay);
      }
    }

    // This shouldn't be reached, but TypeScript requires it
    throw context.lastError || new Error('Retry failed');
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any, config: RetryConfig): boolean {
    const errorCode = error.code || '';
    const errorName = error.name || '';
    const statusCode = error.statusCode?.toString() || '';

    return config.retryableErrors.some(
      retryable =>
        errorCode === retryable ||
        errorName === retryable ||
        statusCode === retryable ||
        error.message?.includes(retryable)
    );
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff: baseDelay * (exponentialBase ^ (attempt - 1))
    let delay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);

    // Cap at max delay
    delay = Math.min(delay, config.maxDelay);

    // Add jitter if enabled
    if (config.jitter) {
      const jitterAmount = delay * config.jitterFactor;
      const jitter = Math.random() * jitterAmount * 2 - jitterAmount;
      delay = Math.max(0, delay + jitter);
    }

    return Math.floor(delay);
  }

  /**
   * Check retry budget
   */
  private checkRetryBudget(budgetPercentage: number): boolean {
    this.cleanupWindows();

    const totalRequests = this.requestWindow.length;
    const totalRetries = this.retryWindow.length;

    if (totalRequests === 0) return true;

    const currentRetryRate = (totalRetries / totalRequests) * 100;
    return currentRetryRate < budgetPercentage;
  }

  /**
   * Track request
   */
  private trackRequest(): void {
    this.requestWindow.push(Date.now());
  }

  /**
   * Track retry
   */
  private trackRetry(): void {
    this.retryWindow.push(Date.now());
  }

  /**
   * Cleanup old entries from windows
   */
  private cleanupWindows(): void {
    const cutoff = Date.now() - this.windowSize;
    this.requestWindow = this.requestWindow.filter(t => t > cutoff);
    this.retryWindow = this.retryWindow.filter(t => t > cutoff);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get retry statistics
   */
  getStats(): any {
    return {
      totalAttempts: this.stats.totalAttempts,
      successfulRetries: this.stats.successfulRetries,
      failedRetries: this.stats.failedRetries,
      retriesExhausted: this.stats.retriesExhausted,
      budgetExceeded: this.stats.budgetExceeded,
      timeouts: this.stats.timeouts,
      averageAttempts: this.stats.averageAttempts.toFixed(2),
      totalRetryTime: this.stats.totalRetryTime,
      averageRetryTime: this.stats.successfulRetries > 0
        ? Math.round(this.stats.totalRetryTime / this.stats.successfulRetries)
        : 0,
      retryByErrorType: Object.fromEntries(this.stats.retryByErrorType),
      retryBudget: {
        requests: this.requestWindow.length,
        retries: this.retryWindow.length,
        retryRate: this.requestWindow.length > 0
          ? ((this.retryWindow.length / this.requestWindow.length) * 100).toFixed(2) + '%'
          : '0%',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      retriesExhausted: 0,
      budgetExceeded: 0,
      timeouts: 0,
      averageAttempts: 0,
      totalRetryTime: 0,
      retryByErrorType: new Map(),
    };
    this.requestWindow = [];
    this.retryWindow = [];
    logger.info('Retry policy statistics reset');
  }

  /**
   * Get all registered policies
   */
  getPolicies(): Array<{ operation: string; config: RetryConfig }> {
    return Array.from(this.configs.entries()).map(([operation, config]) => ({
      operation,
      config,
    }));
  }
}

export const retryPolicyService = new RetryPolicyService();
