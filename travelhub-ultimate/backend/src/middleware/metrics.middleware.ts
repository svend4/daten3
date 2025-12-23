/**
 * Metrics Middleware
 * Automatically track HTTP request metrics
 */

import { Request, Response, NextFunction } from 'express';
import { metricsService, httpRequestsInProgress } from '../services/metrics.service.js';

/**
 * Normalize route path for metrics
 * Replaces dynamic segments with placeholders
 */
function normalizeRoute(path: string): string {
  return path
    .replace(/\/[0-9a-f]{24}/gi, '/:id') // MongoDB ObjectIds
    .replace(/\/[0-9a-f-]{36}/gi, '/:uuid') // UUIDs
    .replace(/\/\d+/g, '/:id') // Numeric IDs
    .replace(/\/[a-zA-Z0-9_-]{8,}/g, '/:id'); // Generic IDs
}

/**
 * Metrics Middleware
 * Tracks HTTP request duration and count
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const route = normalizeRoute(req.path);
  const method = req.method;

  // Increment in-progress requests
  httpRequestsInProgress.inc({ method, route });

  // Track response
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const statusCode = res.statusCode;

    // Decrement in-progress requests
    httpRequestsInProgress.dec({ method, route });

    // Track metrics
    metricsService.trackHttpRequest(method, route, statusCode, duration);

    // Track errors
    if (statusCode >= 500) {
      metricsService.trackError('http_5xx', 'high');
    } else if (statusCode >= 400) {
      metricsService.trackError('http_4xx', 'low');
    }
  });

  next();
};

export default metricsMiddleware;
