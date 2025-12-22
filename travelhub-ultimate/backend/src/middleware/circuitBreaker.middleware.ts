/**
 * Circuit Breaker Pattern Middleware
 * Protects external API calls from cascading failures
 * Based on Innovation Library best practices
 */

import logger from '../utils/logger.js';

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  successThreshold: number;      // Number of successes to close from half-open
  timeout: number;               // Time to wait before half-open (ms)
  resetTimeout: number;          // Time to reset failure count (ms)
  monitoringPeriod: number;      // Period to track failures (ms)
}

/**
 * Circuit breaker statistics
 */
interface CircuitStats {
  state: CircuitState;
  failures: number;
  successes: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  totalRequests: number;
  rejectedRequests: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  stateChangedAt: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,        // Open after 5 failures
  successThreshold: 2,        // Close after 2 successes in half-open
  timeout: 60000,             // Wait 60s before trying again
  resetTimeout: 300000,       // Reset failure count after 5 minutes
  monitoringPeriod: 10000,    // Track failures over 10s
};

/**
 * Circuit Breaker class
 */
class CircuitBreaker {
  private name: string;
  private config: CircuitBreakerConfig;
  private stats: CircuitStats;
  private failureTimestamps: number[] = [];

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      totalRequests: 0,
      rejectedRequests: 0,
      stateChangedAt: Date.now(),
    };
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.stats.totalRequests++;

    // Check if circuit is open
    if (this.stats.state === CircuitState.OPEN) {
      // Check if timeout has passed
      const timeSinceStateChange = Date.now() - this.stats.stateChangedAt;
      if (timeSinceStateChange >= this.config.timeout) {
        this.setState(CircuitState.HALF_OPEN);
        logger.info(`Circuit breaker "${this.name}" entering HALF_OPEN state`);
      } else {
        this.stats.rejectedRequests++;
        throw new Error(`Circuit breaker "${this.name}" is OPEN. Service temporarily unavailable.`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.stats.successes++;
    this.stats.consecutiveSuccesses++;
    this.stats.consecutiveFailures = 0;
    this.stats.lastSuccessTime = Date.now();

    // Remove old failure timestamps
    this.cleanupFailureTimestamps();

    // Transition from HALF_OPEN to CLOSED
    if (this.stats.state === CircuitState.HALF_OPEN) {
      if (this.stats.consecutiveSuccesses >= this.config.successThreshold) {
        this.setState(CircuitState.CLOSED);
        logger.info(`Circuit breaker "${this.name}" closed after ${this.stats.consecutiveSuccesses} successes`);
        this.stats.consecutiveSuccesses = 0;
      }
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(): void {
    this.stats.failures++;
    this.stats.consecutiveFailures++;
    this.stats.consecutiveSuccesses = 0;
    this.stats.lastFailureTime = Date.now();

    // Track failure timestamp
    this.failureTimestamps.push(Date.now());
    this.cleanupFailureTimestamps();

    // Check if we should open the circuit
    if (this.stats.state === CircuitState.CLOSED) {
      const recentFailures = this.failureTimestamps.length;
      if (recentFailures >= this.config.failureThreshold) {
        this.setState(CircuitState.OPEN);
        logger.error(`Circuit breaker "${this.name}" opened after ${recentFailures} failures`);
      }
    }

    // Return to OPEN from HALF_OPEN on failure
    if (this.stats.state === CircuitState.HALF_OPEN) {
      this.setState(CircuitState.OPEN);
      logger.warn(`Circuit breaker "${this.name}" reopened after failure in HALF_OPEN state`);
    }
  }

  /**
   * Remove old failure timestamps outside monitoring period
   */
  private cleanupFailureTimestamps(): void {
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.failureTimestamps = this.failureTimestamps.filter(ts => ts > cutoff);
  }

  /**
   * Set circuit state
   */
  private setState(state: CircuitState): void {
    this.stats.state = state;
    this.stats.stateChangedAt = Date.now();
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitStats {
    this.cleanupFailureTimestamps();
    return {
      ...this.stats,
      failures: this.failureTimestamps.length, // Recent failures only
    };
  }

  /**
   * Get circuit breaker name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.stats = {
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      totalRequests: 0,
      rejectedRequests: 0,
      stateChangedAt: Date.now(),
    };
    this.failureTimestamps = [];
    logger.info(`Circuit breaker "${this.name}" manually reset`);
  }

  /**
   * Check if circuit is healthy
   */
  isHealthy(): boolean {
    return this.stats.state === CircuitState.CLOSED;
  }
}

/**
 * Circuit breaker registry
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create circuit breaker
   */
  getOrCreate(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get circuit breaker by name
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Get all circuit breakers
   */
  getAll(): CircuitBreaker[] {
    return Array.from(this.breakers.values());
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitStats> {
    const stats: Record<string, CircuitStats> = {};
    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Check if all circuits are healthy
   */
  areAllHealthy(): boolean {
    return Array.from(this.breakers.values()).every(b => b.isHealthy());
  }
}

/**
 * Global circuit breaker registry
 */
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Create circuit breaker for external API
 */
export const createCircuitBreaker = (
  name: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker => {
  return circuitBreakerRegistry.getOrCreate(name, config);
};

/**
 * Wrap function with circuit breaker
 */
export const withCircuitBreaker = <T>(
  name: string,
  fn: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> => {
  const breaker = createCircuitBreaker(name, config);
  return breaker.execute(fn);
};

/**
 * Get circuit breaker statistics
 */
export const getCircuitBreakerStats = () => {
  return circuitBreakerRegistry.getAllStats();
};

/**
 * Reset circuit breaker statistics
 */
export const resetCircuitBreakerStats = (name?: string): void => {
  if (name) {
    const breaker = circuitBreakerRegistry.get(name);
    if (breaker) {
      breaker.reset();
    }
  } else {
    circuitBreakerRegistry.resetAll();
  }
};

/**
 * Check if all circuits are healthy
 */
export const areAllCircuitsHealthy = (): boolean => {
  return circuitBreakerRegistry.areAllHealthy();
};

export { CircuitBreaker, CircuitState, CircuitBreakerConfig };
export default { createCircuitBreaker, withCircuitBreaker, getCircuitBreakerStats };
