/**
 * Database Query Performance Monitor
 * Tracks slow database queries and provides performance insights
 * Based on Innovation Library best practices
 */

import logger from '../utils/logger.js';

/**
 * Prisma Query Event interface
 */
interface QueryEvent {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}

/**
 * Performance thresholds (milliseconds)
 */
const PERFORMANCE_THRESHOLDS = {
  fast: 50,       // < 50ms = fast
  normal: 200,    // 50-200ms = normal
  slow: 500,      // 200-500ms = slow
  critical: 1000, // 500-1000ms = very slow
  // > 1000ms = critical
};

/**
 * Query performance statistics
 */
interface QueryStats {
  total: number;
  fast: number;
  normal: number;
  slow: number;
  verySlow: number;
  critical: number;
  totalDuration: number;
  byModel: Map<string, ModelStats>;
  byOperation: Map<string, OperationStats>;
  slowQueries: SlowQuery[];
}

interface ModelStats {
  count: number;
  totalDuration: number;
  avgDuration: number;
}

interface OperationStats {
  count: number;
  totalDuration: number;
  avgDuration: number;
}

interface SlowQuery {
  timestamp: Date;
  model: string;
  operation: string;
  duration: number;
  query?: string;
}

const queryStats: QueryStats = {
  total: 0,
  fast: 0,
  normal: 0,
  slow: 0,
  verySlow: 0,
  critical: 0,
  totalDuration: 0,
  byModel: new Map(),
  byOperation: new Map(),
  slowQueries: [],
};

/**
 * Maximum slow queries to keep in memory
 */
const MAX_SLOW_QUERIES = 100;

/**
 * Get performance category
 */
const getPerformanceCategory = (duration: number): string => {
  if (duration < PERFORMANCE_THRESHOLDS.fast) return 'fast';
  if (duration < PERFORMANCE_THRESHOLDS.normal) return 'normal';
  if (duration < PERFORMANCE_THRESHOLDS.slow) return 'slow';
  if (duration < PERFORMANCE_THRESHOLDS.critical) return 'very-slow';
  return 'critical';
};

/**
 * Extract model name from query
 */
const extractModelName = (query: string): string => {
  // Try to extract model from Prisma query format
  const modelMatch = query.match(/\bFROM\s+"?(\w+)"?/i) ||
                     query.match(/\bINTO\s+"?(\w+)"?/i) ||
                     query.match(/\bUPDATE\s+"?(\w+)"?/i);

  if (modelMatch && modelMatch[1]) {
    return modelMatch[1];
  }

  return 'unknown';
};

/**
 * Extract operation type from query
 */
const extractOperation = (query: string): string => {
  const upperQuery = query.toUpperCase().trim();

  if (upperQuery.startsWith('SELECT')) return 'SELECT';
  if (upperQuery.startsWith('INSERT')) return 'INSERT';
  if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
  if (upperQuery.startsWith('DELETE')) return 'DELETE';
  if (upperQuery.startsWith('BEGIN')) return 'TRANSACTION';
  if (upperQuery.startsWith('COMMIT')) return 'COMMIT';
  if (upperQuery.startsWith('ROLLBACK')) return 'ROLLBACK';

  return 'OTHER';
};

/**
 * Update model statistics
 */
const updateModelStats = (model: string, duration: number): void => {
  const stats = queryStats.byModel.get(model) || {
    count: 0,
    totalDuration: 0,
    avgDuration: 0,
  };

  stats.count++;
  stats.totalDuration += duration;
  stats.avgDuration = stats.totalDuration / stats.count;

  queryStats.byModel.set(model, stats);
};

/**
 * Update operation statistics
 */
const updateOperationStats = (operation: string, duration: number): void => {
  const stats = queryStats.byOperation.get(operation) || {
    count: 0,
    totalDuration: 0,
    avgDuration: 0,
  };

  stats.count++;
  stats.totalDuration += duration;
  stats.avgDuration = stats.totalDuration / stats.count;

  queryStats.byOperation.set(operation, stats);
};

/**
 * Add slow query to tracking
 */
const addSlowQuery = (model: string, operation: string, duration: number, query?: string): void => {
  const slowQuery: SlowQuery = {
    timestamp: new Date(),
    model,
    operation,
    duration,
    query,
  };

  queryStats.slowQueries.push(slowQuery);

  // Keep only the most recent slow queries
  if (queryStats.slowQueries.length > MAX_SLOW_QUERIES) {
    queryStats.slowQueries.shift();
  }
};

/**
 * Database Query Performance Middleware
 * Integrates with Prisma to track query performance
 *
 * Features:
 * - High-precision query timing
 * - Performance categorization (fast/normal/slow/critical)
 * - Automatic slow query logging
 * - Per-model statistics
 * - Per-operation statistics
 * - Slow query tracking (last 100)
 * - Comprehensive metrics
 *
 * Usage:
 * import { prismaWithPerformanceTracking } from './middleware/dbPerformance.middleware';
 *
 * Then use prismaWithPerformanceTracking instead of direct prisma client
 */
export const createQueryEventHandler = () => {
  return async (event: QueryEvent) => {
    const duration = event.duration;

    // Update global statistics
    queryStats.total++;
    queryStats.totalDuration += duration;

    // Categorize performance
    const category = getPerformanceCategory(duration);
    switch (category) {
      case 'fast':
        queryStats.fast++;
        break;
      case 'normal':
        queryStats.normal++;
        break;
      case 'slow':
        queryStats.slow++;
        break;
      case 'very-slow':
        queryStats.verySlow++;
        break;
      case 'critical':
        queryStats.critical++;
        break;
    }

    // Extract query details
    const model = extractModelName(event.query);
    const operation = extractOperation(event.query);

    // Update model and operation statistics
    updateModelStats(model, duration);
    updateOperationStats(operation, duration);

    // Log slow queries
    if (duration >= PERFORMANCE_THRESHOLDS.slow) {
      // Add to slow query tracking
      addSlowQuery(model, operation, duration, event.query);

      // Log warning for slow queries
      const logLevel = duration >= PERFORMANCE_THRESHOLDS.critical ? 'error' : 'warn';
      const message = duration >= PERFORMANCE_THRESHOLDS.critical
        ? 'Critical database query performance'
        : 'Slow database query detected';

      logger[logLevel](message, {
        duration: `${duration}ms`,
        model,
        operation,
        query: event.query.substring(0, 200), // Truncate long queries
        params: event.params,
        category,
      });
    }
  };
};

/**
 * Get database performance statistics
 */
export const getDbPerformanceStats = () => {
  const avgDuration = queryStats.total > 0
    ? Math.round((queryStats.totalDuration / queryStats.total) * 100) / 100
    : 0;

  // Convert Maps to objects for JSON serialization
  const byModel: Record<string, ModelStats> = {};
  for (const [model, stats] of queryStats.byModel.entries()) {
    byModel[model] = {
      count: stats.count,
      totalDuration: Math.round(stats.totalDuration * 100) / 100,
      avgDuration: Math.round(stats.avgDuration * 100) / 100,
    };
  }

  const byOperation: Record<string, OperationStats> = {};
  for (const [operation, stats] of queryStats.byOperation.entries()) {
    byOperation[operation] = {
      count: stats.count,
      totalDuration: Math.round(stats.totalDuration * 100) / 100,
      avgDuration: Math.round(stats.avgDuration * 100) / 100,
    };
  }

  return {
    total: queryStats.total,
    averageDuration: avgDuration,
    distribution: {
      fast: {
        count: queryStats.fast,
        percentage: queryStats.total > 0 ? Math.round((queryStats.fast / queryStats.total) * 100) : 0,
        threshold: `< ${PERFORMANCE_THRESHOLDS.fast}ms`,
      },
      normal: {
        count: queryStats.normal,
        percentage: queryStats.total > 0 ? Math.round((queryStats.normal / queryStats.total) * 100) : 0,
        threshold: `${PERFORMANCE_THRESHOLDS.fast}-${PERFORMANCE_THRESHOLDS.normal}ms`,
      },
      slow: {
        count: queryStats.slow,
        percentage: queryStats.total > 0 ? Math.round((queryStats.slow / queryStats.total) * 100) : 0,
        threshold: `${PERFORMANCE_THRESHOLDS.normal}-${PERFORMANCE_THRESHOLDS.slow}ms`,
      },
      verySlow: {
        count: queryStats.verySlow,
        percentage: queryStats.total > 0 ? Math.round((queryStats.verySlow / queryStats.total) * 100) : 0,
        threshold: `${PERFORMANCE_THRESHOLDS.slow}-${PERFORMANCE_THRESHOLDS.critical}ms`,
      },
      critical: {
        count: queryStats.critical,
        percentage: queryStats.total > 0 ? Math.round((queryStats.critical / queryStats.total) * 100) : 0,
        threshold: `> ${PERFORMANCE_THRESHOLDS.critical}ms`,
      },
    },
    byModel,
    byOperation,
    slowQueries: queryStats.slowQueries.map((q) => ({
      timestamp: q.timestamp.toISOString(),
      model: q.model,
      operation: q.operation,
      duration: Math.round(q.duration * 100) / 100,
      query: q.query ? q.query.substring(0, 200) : undefined,
    })),
    totalDuration: Math.round(queryStats.totalDuration * 100) / 100,
  };
};

/**
 * Reset database performance statistics
 */
export const resetDbPerformanceStats = (): void => {
  queryStats.total = 0;
  queryStats.fast = 0;
  queryStats.normal = 0;
  queryStats.slow = 0;
  queryStats.verySlow = 0;
  queryStats.critical = 0;
  queryStats.totalDuration = 0;
  queryStats.byModel.clear();
  queryStats.byOperation.clear();
  queryStats.slowQueries = [];
};

export default { createQueryEventHandler, getDbPerformanceStats, resetDbPerformanceStats };
