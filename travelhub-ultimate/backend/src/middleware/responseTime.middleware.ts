/**
 * Response Time Middleware
 * Measures and adds response time to headers
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Response time header name
 */
export const RESPONSE_TIME_HEADER = 'X-Response-Time';

/**
 * Performance thresholds (milliseconds)
 */
const PERFORMANCE_THRESHOLDS = {
  fast: 100,      // < 100ms = fast
  normal: 500,    // 100-500ms = normal
  slow: 1000,     // 500-1000ms = slow
  critical: 3000, // 1000-3000ms = very slow
  // > 3000ms = critical
};

/**
 * Response time statistics
 */
interface ResponseTimeStats {
  total: number;
  fast: number;
  normal: number;
  slow: number;
  verySlow: number;
  critical: number;
  totalDuration: number;
}

const stats: ResponseTimeStats = {
  total: 0,
  fast: 0,
  normal: 0,
  slow: 0,
  verySlow: 0,
  critical: 0,
  totalDuration: 0,
};

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
 * Response Time middleware
 * Measures request processing time and adds it to response headers
 *
 * Features:
 * - High-precision timing using process.hrtime()
 * - Adds X-Response-Time header with duration in milliseconds
 * - Tracks performance statistics
 * - Categorizes requests by performance (fast/normal/slow/critical)
 * - Logs slow requests automatically
 */
export const responseTimeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Start high-resolution timer
  const start = process.hrtime.bigint();

  // Override writeHead to inject header before it's sent
  const originalWriteHead = res.writeHead;
  let headerSet = false;

  // @ts-ignore - TypeScript doesn't like the function signature override
  res.writeHead = function(...args: any[]) {
    if (!headerSet) {
      // Calculate duration in nanoseconds, then convert to milliseconds
      const durationNs = process.hrtime.bigint() - start;
      const durationMs = Number(durationNs) / 1000000; // Convert to ms
      const duration = Math.round(durationMs * 100) / 100; // Round to 2 decimals

      // Set header before writeHead is called
      res.setHeader(RESPONSE_TIME_HEADER, `${duration}ms`);
      headerSet = true;
    }

    // @ts-ignore - TypeScript doesn't like apply with any[] args
    return originalWriteHead.apply(res, args);
  };

  // Hook into response finish event for statistics tracking only
  res.on('finish', () => {
    // Calculate duration in nanoseconds, then convert to milliseconds
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1000000; // Convert to ms
    const duration = Math.round(durationMs * 100) / 100; // Round to 2 decimals

    // Update statistics
    stats.total++;
    stats.totalDuration += duration;

    const category = getPerformanceCategory(duration);
    switch (category) {
      case 'fast':
        stats.fast++;
        break;
      case 'normal':
        stats.normal++;
        break;
      case 'slow':
        stats.slow++;
        break;
      case 'very-slow':
        stats.verySlow++;
        // Log slow requests
        logger.warn('Slow response time detected', {
          duration: `${duration}ms`,
          url: req.url,
          method: req.method,
          statusCode: res.statusCode,
          requestId: (req as any).id,
          category: 'slow-response',
        });
        break;
      case 'critical':
        stats.critical++;
        // Log critical slow requests
        logger.error('Critical response time detected', {
          duration: `${duration}ms`,
          url: req.url,
          method: req.method,
          statusCode: res.statusCode,
          requestId: (req as any).id,
          query: req.query,
          category: 'critical-response',
        });
        break;
    }
  });

  next();
};

/**
 * Get response time statistics
 */
export const getResponseTimeStats = () => {
  const avgDuration = stats.total > 0 ? Math.round((stats.totalDuration / stats.total) * 100) / 100 : 0;

  return {
    total: stats.total,
    averageDuration: avgDuration,
    distribution: {
      fast: {
        count: stats.fast,
        percentage: stats.total > 0 ? Math.round((stats.fast / stats.total) * 100) : 0,
        threshold: `< ${PERFORMANCE_THRESHOLDS.fast}ms`,
      },
      normal: {
        count: stats.normal,
        percentage: stats.total > 0 ? Math.round((stats.normal / stats.total) * 100) : 0,
        threshold: `${PERFORMANCE_THRESHOLDS.fast}-${PERFORMANCE_THRESHOLDS.normal}ms`,
      },
      slow: {
        count: stats.slow,
        percentage: stats.total > 0 ? Math.round((stats.slow / stats.total) * 100) : 0,
        threshold: `${PERFORMANCE_THRESHOLDS.normal}-${PERFORMANCE_THRESHOLDS.slow}ms`,
      },
      verySlow: {
        count: stats.verySlow,
        percentage: stats.total > 0 ? Math.round((stats.verySlow / stats.total) * 100) : 0,
        threshold: `${PERFORMANCE_THRESHOLDS.slow}-${PERFORMANCE_THRESHOLDS.critical}ms`,
      },
      critical: {
        count: stats.critical,
        percentage: stats.total > 0 ? Math.round((stats.critical / stats.total) * 100) : 0,
        threshold: `> ${PERFORMANCE_THRESHOLDS.critical}ms`,
      },
    },
    totalDuration: Math.round(stats.totalDuration * 100) / 100,
  };
};

/**
 * Reset response time statistics
 */
export const resetResponseTimeStats = (): void => {
  stats.total = 0;
  stats.fast = 0;
  stats.normal = 0;
  stats.slow = 0;
  stats.verySlow = 0;
  stats.critical = 0;
  stats.totalDuration = 0;
};

export default responseTimeMiddleware;
