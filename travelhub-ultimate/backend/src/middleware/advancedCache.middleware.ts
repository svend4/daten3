/**
 * Advanced Caching Middleware
 * Multi-layer caching with invalidation strategies
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redis.service.js';
import logger from '../utils/logger.js';

/**
 * Cache strategy types
 */
enum CacheStrategy {
  TIME_BASED = 'TIME_BASED',           // TTL-based expiration
  LRU = 'LRU',                         // Least Recently Used
  WRITE_THROUGH = 'WRITE_THROUGH',     // Update cache on write
  WRITE_BEHIND = 'WRITE_BEHIND',       // Async cache update
  CACHE_ASIDE = 'CACHE_ASIDE',         // Load on miss
}

/**
 * Cache invalidation strategies
 */
enum InvalidationStrategy {
  TTL = 'TTL',                         // Time-to-live
  ON_WRITE = 'ON_WRITE',               // Invalidate on data change
  PATTERN = 'PATTERN',                 // Invalidate by key pattern
  TAG_BASED = 'TAG_BASED',             // Invalidate by tags
  MANUAL = 'MANUAL',                   // Manual invalidation
}

/**
 * Cache configuration
 */
interface CacheConfig {
  ttl: number;                         // Time to live (seconds)
  strategy: CacheStrategy;
  invalidation: InvalidationStrategy;
  prefix?: string;                     // Key prefix
  tags?: string[];                     // Cache tags
  condition?: (req: Request) => boolean; // Cache condition
  keyGenerator?: (req: Request) => string; // Custom key generator
}

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  invalidations: number;
  errors: number;
  hitRate: number;
  byEndpoint: Map<string, { hits: number; misses: number }>;
}

const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  invalidations: 0,
  errors: 0,
  hitRate: 0,
  byEndpoint: new Map(),
};

/**
 * In-memory cache (L1 cache)
 */
class MemoryCache {
  private cache: Map<string, { value: any; expires: number; tags: string[] }> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: any, ttl: number, tags: string[] = []): void {
    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000),
      tags,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * Delete entries by tag
   */
  deleteByTag(tag: string): number {
    let deleted = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Delete entries by pattern
   */
  deleteByPattern(pattern: string): number {
    let deleted = 0;
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * L1 cache (in-memory)
 */
const memoryCache = new MemoryCache(1000);

/**
 * Default cache key generator
 */
const defaultKeyGenerator = (req: Request): string => {
  const baseKey = `${req.method}:${req.path}`;
  const queryString = Object.keys(req.query).length > 0
    ? `:${JSON.stringify(req.query)}`
    : '';
  return `${baseKey}${queryString}`;
};

/**
 * Get cache key with prefix
 */
const getCacheKey = (config: CacheConfig, req: Request): string => {
  const prefix = config.prefix || 'cache';
  const key = config.keyGenerator
    ? config.keyGenerator(req)
    : defaultKeyGenerator(req);
  return `${prefix}:${key}`;
};

/**
 * Update endpoint statistics
 */
const updateEndpointStats = (endpoint: string, hit: boolean): void => {
  const stats = cacheStats.byEndpoint.get(endpoint) || { hits: 0, misses: 0 };
  if (hit) {
    stats.hits++;
  } else {
    stats.misses++;
  }
  cacheStats.byEndpoint.set(endpoint, stats);
};

/**
 * Advanced caching middleware
 */
export const advancedCache = (config: Partial<CacheConfig> = {}) => {
  const defaultConfig: CacheConfig = {
    ttl: 300, // 5 minutes default
    strategy: CacheStrategy.CACHE_ASIDE,
    invalidation: InvalidationStrategy.TTL,
    prefix: 'cache',
    tags: [],
    ...config,
  };

  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET') {
      return next();
    }

    // Check cache condition
    if (defaultConfig.condition && !defaultConfig.condition(req)) {
      return next();
    }

    const cacheKey = getCacheKey(defaultConfig, req);
    const endpoint = `${req.method} ${req.path}`;

    try {
      // Try L1 cache first (memory)
      let cachedData = memoryCache.get(cacheKey);

      if (cachedData) {
        cacheStats.hits++;
        updateEndpointStats(endpoint, true);
        return res.json(cachedData);
      }

      // Try L2 cache (Redis)
      const redisClient = redisService.getClient();
      if (redisClient) {
        const redisCached = await redisClient.get(cacheKey);
        if (redisCached) {
          cachedData = JSON.parse(redisCached);

          // Populate L1 cache
          memoryCache.set(cacheKey, cachedData, defaultConfig.ttl, defaultConfig.tags || []);

          cacheStats.hits++;
          updateEndpointStats(endpoint, true);
          return res.json(cachedData);
        }
      }

      // Cache miss - capture response
      cacheStats.misses++;
      updateEndpointStats(endpoint, false);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (data: any) {
        // Cache in L1 (memory)
        memoryCache.set(cacheKey, data, defaultConfig.ttl, defaultConfig.tags || []);

        // Cache in L2 (Redis)
        if (redisClient) {
          redisClient
            .setEx(cacheKey, defaultConfig.ttl, JSON.stringify(data))
            .catch((err) => {
              logger.error('Redis cache set error:', err);
              cacheStats.errors++;
            });
        }

        cacheStats.sets++;
        return originalJson(data);
      };

      next();
    } catch (error: any) {
      logger.error('Cache middleware error:', error);
      cacheStats.errors++;
      next();
    }
  };
};

/**
 * Invalidate cache by key
 */
export const invalidateCache = async (key: string): Promise<void> => {
  try {
    // Delete from L1 cache
    memoryCache.delete(key);

    // Delete from L2 cache (Redis)
    const redisClient = redisService.getClient();
    if (redisClient) {
      await redisClient.del(key);
    }

    cacheStats.deletes++;
    cacheStats.invalidations++;
  } catch (error: any) {
    logger.error('Cache invalidation error:', error);
    cacheStats.errors++;
  }
};

/**
 * Invalidate cache by pattern
 */
export const invalidateCacheByPattern = async (pattern: string): Promise<number> => {
  try {
    // Delete from L1 cache
    const memoryDeleted = memoryCache.deleteByPattern(pattern);

    // Delete from L2 cache (Redis)
    let redisDeleted = 0;
    const redisClient = redisService.getClient();
    if (redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        redisDeleted = await redisClient.del(keys);
      }
    }

    const totalDeleted = memoryDeleted + redisDeleted;
    cacheStats.deletes += totalDeleted;
    cacheStats.invalidations++;

    logger.info(`Invalidated ${totalDeleted} cache entries (pattern: ${pattern})`);
    return totalDeleted;
  } catch (error: any) {
    logger.error('Cache pattern invalidation error:', error);
    cacheStats.errors++;
    return 0;
  }
};

/**
 * Invalidate cache by tag
 */
export const invalidateCacheByTag = async (tag: string): Promise<number> => {
  try {
    // Delete from L1 cache
    const deleted = memoryCache.deleteByTag(tag);

    // For Redis, we'd need to track tag->key mappings
    // This is a simplified implementation

    cacheStats.deletes += deleted;
    cacheStats.invalidations++;

    logger.info(`Invalidated ${deleted} cache entries (tag: ${tag})`);
    return deleted;
  } catch (error: any) {
    logger.error('Cache tag invalidation error:', error);
    cacheStats.errors++;
    return 0;
  }
};

/**
 * Clear all caches
 */
export const clearAllCaches = async (): Promise<void> => {
  try {
    // Clear L1 cache
    memoryCache.clear();

    // Clear L2 cache (Redis) - clear only cache prefix
    const redisClient = redisService.getClient();
    if (redisClient) {
      const keys = await redisClient.keys('cache:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }

    cacheStats.invalidations++;
    logger.info('All caches cleared');
  } catch (error: any) {
    logger.error('Clear all caches error:', error);
    cacheStats.errors++;
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  const total = cacheStats.hits + cacheStats.misses;
  cacheStats.hitRate = total > 0 ? Math.round((cacheStats.hits / total) * 100) : 0;

  const byEndpoint: Record<string, { hits: number; misses: number; hitRate: number }> = {};
  for (const [endpoint, stats] of cacheStats.byEndpoint.entries()) {
    const endpointTotal = stats.hits + stats.misses;
    byEndpoint[endpoint] = {
      ...stats,
      hitRate: endpointTotal > 0 ? Math.round((stats.hits / endpointTotal) * 100) : 0,
    };
  }

  return {
    ...cacheStats,
    byEndpoint,
    memoryCacheSize: memoryCache.size(),
  };
};

/**
 * Reset cache statistics
 */
export const resetCacheStats = (): void => {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.sets = 0;
  cacheStats.deletes = 0;
  cacheStats.invalidations = 0;
  cacheStats.errors = 0;
  cacheStats.hitRate = 0;
  cacheStats.byEndpoint.clear();
};

/**
 * Warmup cache with data
 */
export const warmupCache = async (
  key: string,
  data: any,
  ttl: number = 300,
  tags: string[] = []
): Promise<void> => {
  try {
    const cacheKey = `cache:${key}`;

    // Warmup L1 cache
    memoryCache.set(cacheKey, data, ttl, tags);

    // Warmup L2 cache (Redis)
    const redisClient = redisService.getClient();
    if (redisClient) {
      await redisClient.setEx(cacheKey, ttl, JSON.stringify(data));
    }

    logger.info(`Cache warmed up: ${cacheKey}`);
  } catch (error: any) {
    logger.error('Cache warmup error:', error);
    cacheStats.errors++;
  }
};

export default advancedCache;
