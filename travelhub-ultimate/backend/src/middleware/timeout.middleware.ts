/**
 * Request Timeout Middleware
 * Prevents long-running requests from blocking the server
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Default timeout in milliseconds
 */
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Timeout statistics
 */
interface TimeoutStats {
  total: number;
  timedOut: number;
  byEndpoint: Map<string, number>;
}

const timeoutStats: TimeoutStats = {
  total: 0,
  timedOut: 0,
  byEndpoint: new Map(),
};

/**
 * Request Timeout middleware
 * Sets a timeout for request processing
 *
 * Features:
 * - Configurable timeout per request
 * - Automatic timeout response
 * - Timeout statistics tracking
 * - Per-endpoint timeout tracking
 * - Graceful timeout handling
 * - Request cancellation support
 *
 * Usage:
 * app.use(timeoutMiddleware(30000)); // 30 second timeout
 *
 * Or configure per-route:
 * router.get('/slow-endpoint', timeoutMiddleware(60000), handler);
 */
export const timeoutMiddleware = (timeoutMs: number = DEFAULT_TIMEOUT) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    timeoutStats.total++;

    let timeout: NodeJS.Timeout | null = null;
    let timedOut = false;

    // Set timeout
    timeout = setTimeout(() => {
      timedOut = true;
      timeoutStats.timedOut++;

      // Track timeout by endpoint
      const endpoint = `${req.method} ${req.path}`;
      const count = timeoutStats.byEndpoint.get(endpoint) || 0;
      timeoutStats.byEndpoint.set(endpoint, count + 1);

      // Log timeout
      logger.error('Request timeout', {
        url: req.url,
        method: req.method,
        timeout: `${timeoutMs}ms`,
        requestId: req.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Send timeout response
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          message: `The request took too long to process (timeout: ${timeoutMs}ms)`,
          code: 'REQUEST_TIMEOUT',
          timeout: timeoutMs,
        });
      }
    }, timeoutMs);

    // Clear timeout on response finish
    res.on('finish', () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    });

    // Clear timeout on response close
    res.on('close', () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    });

    // Attach timeout info to request
    (req as any).timeout = {
      ms: timeoutMs,
      timedOut: () => timedOut,
    };

    next();
  };
};

/**
 * Timeout middleware with custom message
 */
export const timeoutWithMessage = (timeoutMs: number, message: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    timeoutStats.total++;

    let timeout: NodeJS.Timeout | null = null;
    let timedOut = false;

    timeout = setTimeout(() => {
      timedOut = true;
      timeoutStats.timedOut++;

      const endpoint = `${req.method} ${req.path}`;
      const count = timeoutStats.byEndpoint.get(endpoint) || 0;
      timeoutStats.byEndpoint.set(endpoint, count + 1);

      logger.error('Request timeout', {
        url: req.url,
        method: req.method,
        timeout: `${timeoutMs}ms`,
        message,
        requestId: req.id,
      });

      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          message,
          code: 'REQUEST_TIMEOUT',
          timeout: timeoutMs,
        });
      }
    }, timeoutMs);

    res.on('finish', () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    });

    res.on('close', () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    });

    (req as any).timeout = {
      ms: timeoutMs,
      timedOut: () => timedOut,
    };

    next();
  };
};

/**
 * Get timeout statistics
 */
export const getTimeoutStats = () => {
  const byEndpoint: Record<string, number> = {};
  for (const [endpoint, count] of timeoutStats.byEndpoint.entries()) {
    byEndpoint[endpoint] = count;
  }

  return {
    total: timeoutStats.total,
    timedOut: timeoutStats.timedOut,
    timeoutRate: timeoutStats.total > 0
      ? Math.round((timeoutStats.timedOut / timeoutStats.total) * 100)
      : 0,
    byEndpoint,
  };
};

/**
 * Reset timeout statistics
 */
export const resetTimeoutStats = (): void => {
  timeoutStats.total = 0;
  timeoutStats.timedOut = 0;
  timeoutStats.byEndpoint.clear();
};

/**
 * Check if request has timed out
 */
export const hasTimedOut = (req: Request): boolean => {
  const timeout = (req as any).timeout;
  return timeout ? timeout.timedOut() : false;
};

export default timeoutMiddleware;
