import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

// Create a stream object with 'write' function for morgan
const stream = {
  write: (message: string) => {
    // Use the http severity level for HTTP logs
    logger.http(message.trim());
  },
};

// Skip logging during tests
const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'test';
};

// Custom token for user ID
morgan.token('user-id', (req: any) => {
  return req.user?.id || 'anonymous';
});

// Custom token for request body (only in development)
morgan.token('body', (req: any) => {
  if (process.env.NODE_ENV === 'development') {
    const body = { ...req.body };
    // Hide sensitive fields
    if (body.password) body.password = '***';
    if (body.token) body.token = '***';
    if (body.apiKey) body.apiKey = '***';
    return JSON.stringify(body);
  }
  return '';
});

// Production format - concise
const productionFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Development format - detailed
const developmentFormat = ':method :url :status :res[content-length] - :response-time ms - User: :user-id :body';

// Build the morgan middleware
const morganMiddleware = morgan(
  process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  { stream, skip }
);

// Performance metrics storage (in-memory, can be replaced with Redis)
interface PerformanceMetrics {
  totalRequests: number;
  totalDuration: number;
  slowRequests: number;
  errorRequests: number;
  requestsByEndpoint: Map<string, { count: number; totalDuration: number; errors: number }>;
}

const metrics: PerformanceMetrics = {
  totalRequests: 0,
  totalDuration: 0,
  slowRequests: 0,
  errorRequests: 0,
  requestsByEndpoint: new Map(),
};

/**
 * Additional request logging middleware
 * Logs slow requests, errors, and collects performance metrics
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const memoryDelta = process.memoryUsage().heapUsed - startMemory;
    const userInfo = (req as any).user?.id || 'anonymous';
    const endpoint = `${req.method} ${req.route?.path || req.path}`;

    // Update global metrics
    metrics.totalRequests++;
    metrics.totalDuration += duration;

    // Update endpoint-specific metrics
    if (!metrics.requestsByEndpoint.has(endpoint)) {
      metrics.requestsByEndpoint.set(endpoint, { count: 0, totalDuration: 0, errors: 0 });
    }
    const endpointMetrics = metrics.requestsByEndpoint.get(endpoint)!;
    endpointMetrics.count++;
    endpointMetrics.totalDuration += duration;

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      metrics.slowRequests++;
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        endpoint,
        duration: `${duration}ms`,
        memoryUsed: `${Math.round(memoryDelta / 1024)}KB`,
        statusCode: res.statusCode,
        userId: userInfo,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    // Log failed requests (4xx, 5xx)
    if (res.statusCode >= 400) {
      metrics.errorRequests++;
      endpointMetrics.errors++;

      logger.warn(`Request failed: ${req.method} ${req.url} - Status ${res.statusCode}`, {
        method: req.method,
        url: req.url,
        endpoint,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: userInfo,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    // Log very slow requests with full details (> 5 seconds)
    if (duration > 5000) {
      logger.error('Critical performance issue', {
        method: req.method,
        url: req.url,
        endpoint,
        duration: `${duration}ms`,
        memoryUsed: `${Math.round(memoryDelta / 1024)}KB`,
        statusCode: res.statusCode,
        userId: userInfo,
        ip: req.ip,
        query: req.query,
        params: req.params,
      });
    }
  });

  next();
};

/**
 * Get current performance metrics
 */
export const getPerformanceMetrics = () => {
  const avgDuration = metrics.totalRequests > 0
    ? Math.round(metrics.totalDuration / metrics.totalRequests)
    : 0;

  const topSlowEndpoints = Array.from(metrics.requestsByEndpoint.entries())
    .map(([endpoint, data]) => ({
      endpoint,
      count: data.count,
      avgDuration: Math.round(data.totalDuration / data.count),
      errors: data.errors,
      errorRate: (data.errors / data.count * 100).toFixed(2) + '%',
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);

  return {
    totalRequests: metrics.totalRequests,
    averageDuration: avgDuration,
    slowRequests: metrics.slowRequests,
    errorRequests: metrics.errorRequests,
    errorRate: ((metrics.errorRequests / metrics.totalRequests) * 100).toFixed(2) + '%',
    topSlowEndpoints,
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
  };
};

/**
 * Reset performance metrics (useful for testing or periodic resets)
 */
export const resetPerformanceMetrics = () => {
  metrics.totalRequests = 0;
  metrics.totalDuration = 0;
  metrics.slowRequests = 0;
  metrics.errorRequests = 0;
  metrics.requestsByEndpoint.clear();
};

export default morganMiddleware;
