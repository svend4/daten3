/**
 * Request Deduplication Middleware
 * Prevent duplicate operations from network retries
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { redisService } from '../services/redis.service.js';
import logger from '../utils/logger.js';

/**
 * Deduplication configuration
 */
interface DeduplicationConfig {
  ttl: number;                  // TTL for fingerprints (seconds)
  methods: string[];            // HTTP methods to deduplicate
  excludePaths: string[];       // Paths to exclude from deduplication
  fingerprintFields: string[];  // Fields to include in fingerprint
  cacheSuccessful: boolean;     // Cache successful responses
  cacheErrors: boolean;         // Cache error responses
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: DeduplicationConfig = {
  ttl: 60,                      // 60 seconds
  methods: ['POST', 'PUT', 'PATCH', 'DELETE'], // Only mutating operations
  excludePaths: ['/health', '/api/health'], // Don't deduplicate health checks
  fingerprintFields: ['method', 'url', 'body', 'userId'], // Fields for fingerprint
  cacheSuccessful: true,
  cacheErrors: false,           // Don't cache errors by default
};

/**
 * Deduplication statistics
 */
const stats = {
  totalRequests: 0,
  duplicateRequests: 0,
  uniqueRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  byMethod: new Map<string, {
    total: number;
    duplicates: number;
    unique: number;
  }>(),
  byPath: new Map<string, {
    total: number;
    duplicates: number;
    unique: number;
  }>(),
  recentDuplicates: [] as Array<{
    method: string;
    path: string;
    fingerprint: string;
    timestamp: Date;
    userId?: string;
  }>,
};

/**
 * Generate request fingerprint
 */
const generateFingerprint = (
  req: Request,
  config: DeduplicationConfig
): string => {
  const fingerprintData: any = {};

  // Include configured fields
  if (config.fingerprintFields.includes('method')) {
    fingerprintData.method = req.method;
  }

  if (config.fingerprintFields.includes('url')) {
    fingerprintData.url = req.originalUrl || req.url;
  }

  if (config.fingerprintFields.includes('body')) {
    fingerprintData.body = req.body;
  }

  if (config.fingerprintFields.includes('userId')) {
    const user = (req as any).user;
    fingerprintData.userId = user?.id || 'anonymous';
  }

  if (config.fingerprintFields.includes('headers')) {
    // Include relevant headers
    fingerprintData.headers = {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
    };
  }

  // Create hash
  const dataString = JSON.stringify(fingerprintData);
  const hash = createHash('sha256').update(dataString).digest('hex');

  return `dedup:${hash}`;
};

/**
 * Check if request should be deduplicated
 */
const shouldDeduplicate = (req: Request, config: DeduplicationConfig): boolean => {
  // Check method
  if (!config.methods.includes(req.method)) {
    return false;
  }

  // Check excluded paths
  const path = req.originalUrl || req.url;
  for (const excludePath of config.excludePaths) {
    if (path.startsWith(excludePath)) {
      return false;
    }
  }

  return true;
};

/**
 * Request deduplication middleware
 */
export const requestDeduplicationMiddleware = (
  customConfig?: Partial<DeduplicationConfig>
) => {
  const config: DeduplicationConfig = {
    ...DEFAULT_CONFIG,
    ...customConfig,
  };

  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    // Check if this request should be deduplicated
    if (!shouldDeduplicate(req, config)) {
      return next();
    }

    // Generate fingerprint
    const fingerprint = generateFingerprint(req, config);

    // Update stats
    stats.totalRequests++;
    updateMethodStats(req.method);
    updatePathStats(req.originalUrl || req.url);

    try {
      // Check if we've seen this request before
      const cachedResponse = await redisService.get(fingerprint);

      if (cachedResponse) {
        // Duplicate request detected
        stats.duplicateRequests++;
        stats.cacheHits++;
        updateMethodStats(req.method, true);
        updatePathStats(req.originalUrl || req.url, true);

        // Add to recent duplicates
        const user = (req as any).user;
        stats.recentDuplicates.push({
          method: req.method,
          path: req.originalUrl || req.url,
          fingerprint,
          timestamp: new Date(),
          userId: user?.id,
        });

        // Keep only last 50
        if (stats.recentDuplicates.length > 50) {
          stats.recentDuplicates = stats.recentDuplicates.slice(-50);
        }

        logger.warn(`Duplicate request detected: ${req.method} ${req.originalUrl || req.url}`, {
          fingerprint,
          userId: user?.id,
        });

        // Return cached response
        const cached = JSON.parse(cachedResponse);
        return res.status(cached.statusCode).json(cached.body);
      }

      // Unique request
      stats.uniqueRequests++;
      stats.cacheMisses++;

      // Intercept response to cache it
      const originalJson = res.json.bind(res);
      const originalStatus = res.status.bind(res);
      let statusCode = 200;

      // Override status method to capture status code
      res.status = function (code: number) {
        statusCode = code;
        return originalStatus(code);
      };

      // Override json method to cache response
      res.json = function (body: any) {
        // Determine if we should cache this response
        const shouldCache =
          (statusCode >= 200 && statusCode < 300 && config.cacheSuccessful) ||
          (statusCode >= 400 && config.cacheErrors);

        if (shouldCache) {
          // Cache the response
          const cacheData = {
            statusCode,
            body,
          };

          redisService.set(fingerprint, JSON.stringify(cacheData), config.ttl)
            .catch((error: any) => {
              logger.error('Failed to cache deduplicated response:', error);
            });

          logger.debug(`Cached response for deduplication: ${req.method} ${req.originalUrl || req.url}`, {
            fingerprint,
            statusCode,
            ttl: config.ttl,
          });
        }

        return originalJson(body);
      };

      next();
    } catch (error: any) {
      logger.error('Request deduplication error:', error);
      // On error, pass through without deduplication
      next();
    }
  };
};

/**
 * Update method statistics
 */
const updateMethodStats = (method: string, isDuplicate = false): void => {
  let methodStats = stats.byMethod.get(method);

  if (!methodStats) {
    methodStats = {
      total: 0,
      duplicates: 0,
      unique: 0,
    };
    stats.byMethod.set(method, methodStats);
  }

  methodStats.total++;
  if (isDuplicate) {
    methodStats.duplicates++;
  } else {
    methodStats.unique++;
  }
};

/**
 * Update path statistics
 */
const updatePathStats = (path: string, isDuplicate = false): void => {
  // Normalize path (remove query string)
  const normalizedPath = path.split('?')[0];

  let pathStats = stats.byPath.get(normalizedPath);

  if (!pathStats) {
    pathStats = {
      total: 0,
      duplicates: 0,
      unique: 0,
    };
    stats.byPath.set(normalizedPath, pathStats);
  }

  pathStats.total++;
  if (isDuplicate) {
    pathStats.duplicates++;
  } else {
    pathStats.unique++;
  }
};

/**
 * Clear all deduplication cache
 */
export const clearDeduplicationCache = async (): Promise<void> => {
  try {
    const redisClient = redisService.getClient();
    if (!redisClient) {
      throw new Error('Redis client not available');
    }

    const keys = await redisClient.keys('dedup:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    logger.info(`Cleared ${keys.length} deduplication cache entries`);
  } catch (error: any) {
    logger.error('Failed to clear deduplication cache:', error);
    throw error;
  }
};

/**
 * Get deduplication statistics
 */
export const getDeduplicationStats = () => {
  const byMethod: Record<string, any> = {};
  for (const [method, methodStats] of stats.byMethod.entries()) {
    byMethod[method] = { ...methodStats };
  }

  const byPath: Record<string, any> = {};
  // Only include top 20 paths
  const sortedPaths = Array.from(stats.byPath.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 20);

  for (const [path, pathStats] of sortedPaths) {
    byPath[path] = { ...pathStats };
  }

  const duplicationRate = stats.totalRequests > 0
    ? Math.round((stats.duplicateRequests / stats.totalRequests) * 100)
    : 0;

  const cacheHitRate = (stats.cacheHits + stats.cacheMisses) > 0
    ? Math.round((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100)
    : 0;

  return {
    totalRequests: stats.totalRequests,
    duplicateRequests: stats.duplicateRequests,
    uniqueRequests: stats.uniqueRequests,
    duplicationRate,
    cacheHits: stats.cacheHits,
    cacheMisses: stats.cacheMisses,
    cacheHitRate,
    byMethod,
    byPath,
    recentDuplicates: stats.recentDuplicates.slice(-20), // Last 20 duplicates
  };
};

/**
 * Reset deduplication statistics
 */
export const resetDeduplicationStats = (): void => {
  stats.totalRequests = 0;
  stats.duplicateRequests = 0;
  stats.uniqueRequests = 0;
  stats.cacheHits = 0;
  stats.cacheMisses = 0;
  stats.byMethod.clear();
  stats.byPath.clear();
  stats.recentDuplicates = [];
};

/**
 * Helper: Create deduplication middleware for specific routes
 */
export const deduplicateBookings = requestDeduplicationMiddleware({
  ttl: 300,                     // 5 minutes
  methods: ['POST'],
  fingerprintFields: ['method', 'url', 'body', 'userId'],
  cacheSuccessful: true,
  cacheErrors: false,
});

export const deduplicatePayments = requestDeduplicationMiddleware({
  ttl: 600,                     // 10 minutes
  methods: ['POST'],
  fingerprintFields: ['method', 'url', 'body', 'userId'],
  cacheSuccessful: true,
  cacheErrors: false,
});

export const deduplicatePayouts = requestDeduplicationMiddleware({
  ttl: 900,                     // 15 minutes
  methods: ['POST'],
  fingerprintFields: ['method', 'url', 'body', 'userId'],
  cacheSuccessful: true,
  cacheErrors: false,
});
