/**
 * Request Replay Protection Middleware
 * Prevents duplicate/replay attacks using idempotency keys
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redis.service.js';
import { randomUUID } from 'crypto';
import logger from '../utils/logger.js';

/**
 * Idempotency key header name
 */
export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';

/**
 * Replay protection configuration
 */
interface ReplayProtectionConfig {
  ttl: number;                    // Time to live for idempotency keys (seconds)
  header: string;                 // Header name for idempotency key
  autoGenerate: boolean;          // Auto-generate key if not provided
  methods: string[];              // HTTP methods to protect
  keyGenerator?: (req: Request) => string; // Custom key generator
}

/**
 * Cached response
 */
interface CachedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  timestamp: number;
}

/**
 * Replay protection statistics
 */
interface ReplayStats {
  total: number;
  replays: number;
  cached: number;
  byEndpoint: Map<string, { total: number; replays: number }>;
}

const replayStats: ReplayStats = {
  total: 0,
  replays: 0,
  cached: 0,
  byEndpoint: new Map(),
};

/**
 * In-memory cache for responses (L1 cache)
 */
const responseCache = new Map<string, CachedResponse>();
const MAX_CACHE_SIZE = 1000;

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ReplayProtectionConfig = {
  ttl: 86400,                      // 24 hours
  header: IDEMPOTENCY_KEY_HEADER,
  autoGenerate: false,
  methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
};

/**
 * Get idempotency key from request
 */
const getIdempotencyKey = (req: Request, config: ReplayProtectionConfig): string | null => {
  // Check header
  const headerKey = req.headers[config.header.toLowerCase()] as string;
  if (headerKey) return headerKey;

  // Use custom generator if provided
  if (config.keyGenerator) {
    return config.keyGenerator(req);
  }

  // Auto-generate if enabled
  if (config.autoGenerate) {
    return randomUUID();
  }

  return null;
};

/**
 * Get cache key
 */
const getCacheKey = (idempotencyKey: string, userId?: string): string => {
  const userPrefix = userId ? `user:${userId}:` : 'anon:';
  return `idempotency:${userPrefix}${idempotencyKey}`;
};

/**
 * Store response in cache
 */
const cacheResponse = async (
  cacheKey: string,
  statusCode: number,
  headers: Record<string, string>,
  body: any,
  ttl: number
): Promise<void> => {
  const cachedResponse: CachedResponse = {
    statusCode,
    headers,
    body,
    timestamp: Date.now(),
  };

  // Store in memory cache (L1)
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) {
      responseCache.delete(firstKey);
    }
  }
  responseCache.set(cacheKey, cachedResponse);

  // Store in Redis (L2)
  const redisClient = redisService.getClient();
  if (redisClient) {
    try {
      await redisClient.setEx(
        cacheKey,
        ttl,
        JSON.stringify(cachedResponse)
      );
    } catch (error: any) {
      logger.error('Failed to cache response in Redis:', error);
    }
  }

  replayStats.cached++;
};

/**
 * Get cached response
 */
const getCachedResponse = async (cacheKey: string): Promise<CachedResponse | null> => {
  // Try memory cache first (L1)
  let cached = responseCache.get(cacheKey);
  if (cached) return cached;

  // Try Redis (L2)
  const redisClient = redisService.getClient();
  if (redisClient) {
    try {
      const redisCached = await redisClient.get(cacheKey);
      if (redisCached) {
        cached = JSON.parse(redisCached) as CachedResponse;
        // Populate L1 cache
        responseCache.set(cacheKey, cached);
        return cached;
      }
    } catch (error: any) {
      logger.error('Failed to get cached response from Redis:', error);
    }
  }

  return null;
};

/**
 * Update endpoint statistics
 */
const updateEndpointStats = (endpoint: string, isReplay: boolean): void => {
  const stats = replayStats.byEndpoint.get(endpoint) || { total: 0, replays: 0 };
  stats.total++;
  if (isReplay) stats.replays++;
  replayStats.byEndpoint.set(endpoint, stats);
};

/**
 * Request Replay Protection middleware
 *
 * Features:
 * - Idempotency key support via header
 * - Automatic key generation (optional)
 * - Request deduplication
 * - Response caching and replay
 * - Multi-layer caching (memory + Redis)
 * - Per-user isolation
 * - Configurable TTL
 * - Statistics tracking
 *
 * Usage:
 * app.use(replayProtectionMiddleware());
 *
 * Or with custom config:
 * app.use(replayProtectionMiddleware({
 *   ttl: 3600,        // 1 hour
 *   autoGenerate: true,
 *   methods: ['POST', 'PUT']
 * }));
 *
 * Client usage:
 * POST /api/payments
 * Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
 */
export const replayProtectionMiddleware = (config: Partial<ReplayProtectionConfig> = {}) => {
  const fullConfig: ReplayProtectionConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const endpoint = `${req.method} ${req.path}`;

    // Skip if method not protected
    if (!fullConfig.methods.includes(req.method)) {
      return next();
    }

    // Get idempotency key
    const idempotencyKey = getIdempotencyKey(req, fullConfig);
    if (!idempotencyKey) {
      // No key provided and auto-generate disabled
      return next();
    }

    // Get user ID for isolation
    const userId = (req as any).user?.id;
    const cacheKey = getCacheKey(idempotencyKey, userId);

    replayStats.total++;
    updateEndpointStats(endpoint, false);

    try {
      // Check if we've seen this request before
      const cachedResponse = await getCachedResponse(cacheKey);

      if (cachedResponse) {
        // Replay detected - return cached response
        replayStats.replays++;
        updateEndpointStats(endpoint, true);

        logger.warn('Request replay detected', {
          idempotencyKey,
          userId,
          endpoint,
          cachedAt: new Date(cachedResponse.timestamp).toISOString(),
          requestId: req.id,
        });

        // Set headers
        for (const [key, value] of Object.entries(cachedResponse.headers)) {
          res.setHeader(key, value);
        }

        // Add replay indicator
        res.setHeader('X-Idempotency-Replayed', 'true');
        res.setHeader('X-Original-Timestamp', new Date(cachedResponse.timestamp).toISOString());

        // Return cached response
        return res.status(cachedResponse.statusCode).json(cachedResponse.body);
      }

      // First time seeing this request - process it and cache response

      // Store original response methods
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);
      const originalStatus = res.status.bind(res);

      let statusCode = 200;
      let responseBody: any;
      let responseSent = false;

      // Override status method
      res.status = function (code: number) {
        statusCode = code;
        return originalStatus(code);
      };

      // Override json method
      res.json = function (body: any) {
        if (!responseSent) {
          responseSent = true;
          responseBody = body;

          // Cache successful responses only
          if (statusCode >= 200 && statusCode < 300) {
            const headers: Record<string, string> = {};
            for (const [key, value] of Object.entries(res.getHeaders())) {
              if (typeof value === 'string') {
                headers[key] = value;
              }
            }

            cacheResponse(cacheKey, statusCode, headers, body, fullConfig.ttl)
              .catch(err => {
                logger.error('Failed to cache response:', err);
              });
          }
        }

        return originalJson(body);
      };

      // Override send method
      res.send = function (body: any) {
        if (!responseSent) {
          responseSent = true;
          responseBody = body;

          // Cache successful responses only
          if (statusCode >= 200 && statusCode < 300) {
            const headers: Record<string, string> = {};
            for (const [key, value] of Object.entries(res.getHeaders())) {
              if (typeof value === 'string') {
                headers[key] = value;
              }
            }

            cacheResponse(cacheKey, statusCode, headers, body, fullConfig.ttl)
              .catch(err => {
                logger.error('Failed to cache response:', err);
              });
          }
        }

        return originalSend(body);
      };

      // Add idempotency key to response headers
      res.setHeader(fullConfig.header, idempotencyKey);
      res.setHeader('X-Idempotency-Replayed', 'false');

      next();
    } catch (error: any) {
      logger.error('Replay protection middleware error:', error);
      next();
    }
  };
};

/**
 * Invalidate idempotency key
 */
export const invalidateIdempotencyKey = async (
  idempotencyKey: string,
  userId?: string
): Promise<void> => {
  const cacheKey = getCacheKey(idempotencyKey, userId);

  // Delete from memory cache
  responseCache.delete(cacheKey);

  // Delete from Redis
  const redisClient = redisService.getClient();
  if (redisClient) {
    try {
      await redisClient.del(cacheKey);
    } catch (error: any) {
      logger.error('Failed to invalidate idempotency key:', error);
    }
  }
};

/**
 * Clear all idempotency keys
 */
export const clearAllIdempotencyKeys = async (): Promise<void> => {
  // Clear memory cache
  responseCache.clear();

  // Clear Redis keys
  const redisClient = redisService.getClient();
  if (redisClient) {
    try {
      const keys = await redisClient.keys('idempotency:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error: any) {
      logger.error('Failed to clear idempotency keys:', error);
    }
  }

  logger.info('All idempotency keys cleared');
};

/**
 * Get replay protection statistics
 */
export const getReplayProtectionStats = () => {
  const byEndpoint: Record<string, { total: number; replays: number; replayRate: number }> = {};
  for (const [endpoint, stats] of replayStats.byEndpoint.entries()) {
    byEndpoint[endpoint] = {
      ...stats,
      replayRate: stats.total > 0 ? Math.round((stats.replays / stats.total) * 100) : 0,
    };
  }

  return {
    total: replayStats.total,
    replays: replayStats.replays,
    cached: replayStats.cached,
    replayRate: replayStats.total > 0 ? Math.round((replayStats.replays / replayStats.total) * 100) : 0,
    byEndpoint,
    memoryCacheSize: responseCache.size,
  };
};

/**
 * Reset replay protection statistics
 */
export const resetReplayProtectionStats = (): void => {
  replayStats.total = 0;
  replayStats.replays = 0;
  replayStats.cached = 0;
  replayStats.byEndpoint.clear();
};

export default replayProtectionMiddleware;
