/**
 * Cache Service
 * Redis-based caching with graceful degradation
 */

import logger from '../utils/logger.js';
import { redisService } from './redis.service.js';

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  FLIGHTS_SEARCH: 60 * 60,              // 1 hour
  HOTELS_SEARCH: 60 * 60 * 2,           // 2 hours
  HOTEL_DETAILS: 60 * 60 * 24,          // 24 hours
  LOCATION_AUTOCOMPLETE: 60 * 60 * 24 * 7,  // 7 days
  STATIC_DATA: 60 * 60 * 24 * 30,       // 30 days
  PRICE_ALERTS: 60 * 60,                // 1 hour
  USER_SESSION: 60 * 60 * 24 * 7,       // 7 days
  SHORT: 60 * 5,                        // 5 minutes
  MEDIUM: 60 * 30,                      // 30 minutes
  LONG: 60 * 60 * 24                    // 1 day
};

/**
 * Cache Service Class
 * Handles all caching operations with Redis
 */
class CacheService {
  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    try {
      const value = await redisService.get(key);

      if (value) {
        logger.debug(`Cache HIT: ${key}`);
        return value;
      }

      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error: any) {
      logger.error('Cache get error:', error);
      return null; // Fail gracefully
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: string, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    try {
      await redisService.set(key, value, ttl);
      logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error: any) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      await redisService.del(key);
      logger.debug(`Cache DEL: ${key}`);
      return true;
    } catch (error: any) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      return await redisService.exists(key);
    } catch (error: any) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Store object as JSON
   */
  async setJSON(key: string, obj: any, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    try {
      const json = JSON.stringify(obj);
      return await this.set(key, json, ttl);
    } catch (error: any) {
      logger.error('Cache setJSON error:', error);
      return false;
    }
  }

  /**
   * Get object from JSON
   */
  async getJSON<T = any>(key: string): Promise<T | null> {
    try {
      const json = await this.get(key);
      if (!json) return null;

      return JSON.parse(json) as T;
    } catch (error: any) {
      logger.error('Cache getJSON error:', error);
      return null;
    }
  }

  /**
   * Generate cache key from prefix and params
   */
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');

    return `${prefix}:${sortedParams}`;
  }

  /**
   * Clear all keys matching pattern
   */
  async clearPattern(pattern: string): Promise<boolean> {
    try {
      const client = redisService.getClient();
      if (!client) return false;

      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
        logger.info(`Cleared ${keys.length} cache keys matching: ${pattern}`);
      }
      return true;
    } catch (error: any) {
      logger.error('Cache clearPattern error:', error);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, ttl?: number): Promise<number> {
    try {
      const client = redisService.getClient();
      if (!client) return 0;

      const value = await client.incr(key);

      if (ttl && value === 1) {
        // Set TTL only on first increment
        await client.expire(key, ttl);
      }

      return value;
    } catch (error: any) {
      logger.error('Cache increment error:', error);
      return 0;
    }
  }

  /**
   * Decrement counter
   */
  async decrement(key: string): Promise<number> {
    try {
      const client = redisService.getClient();
      if (!client) return 0;

      return await client.decr(key);
    } catch (error: any) {
      logger.error('Cache decrement error:', error);
      return 0;
    }
  }

  /**
   * Get TTL (time to live) for key
   */
  async getTTL(key: string): Promise<number> {
    try {
      const client = redisService.getClient();
      if (!client) return -1;

      return await client.ttl(key);
    } catch (error: any) {
      logger.error('Cache getTTL error:', error);
      return -1;
    }
  }

  /**
   * Set expiration time for key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const client = redisService.getClient();
      if (!client) return false;

      const result = await client.expire(key, seconds);
      return Boolean(result);
    } catch (error: any) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }

  /**
   * Cache wrapper for async functions
   * Automatically caches function results
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.getJSON<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.setJSON(key, result, ttl);

    return result;
  }

  /**
   * Batch get multiple keys
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      const client = redisService.getClient();
      if (!client) return keys.map(() => null);

      return await client.mGet(keys);
    } catch (error: any) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Batch set multiple keys
   */
  async mset(entries: Record<string, string>): Promise<boolean> {
    try {
      const client = redisService.getClient();
      if (!client) return false;

      const pairs: string[] = [];
      Object.entries(entries).forEach(([key, value]) => {
        pairs.push(key, value);
      });

      await client.mSet(pairs);
      return true;
    } catch (error: any) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Add item to set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      const client = redisService.getClient();
      if (!client) return 0;

      return await client.sAdd(key, members);
    } catch (error: any) {
      logger.error('Cache sadd error:', error);
      return 0;
    }
  }

  /**
   * Get all members of set
   */
  async smembers(key: string): Promise<string[]> {
    try {
      const client = redisService.getClient();
      if (!client) return [];

      return await client.sMembers(key);
    } catch (error: any) {
      logger.error('Cache smembers error:', error);
      return [];
    }
  }

  /**
   * Remove item from set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      const client = redisService.getClient();
      if (!client) return 0;

      return await client.sRem(key, members);
    } catch (error: any) {
      logger.error('Cache srem error:', error);
      return 0;
    }
  }

  /**
   * Check if member exists in set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const client = redisService.getClient();
      if (!client) return false;

      return await client.sIsMember(key, member);
    } catch (error: any) {
      logger.error('Cache sismember error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
