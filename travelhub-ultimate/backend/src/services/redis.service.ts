/**
 * Redis Service
 * Handles Redis connections and operations for caching and CSRF tokens
 */

import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';

class RedisService {
  private client: RedisClientType | null = null;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = config.redis.enabled;
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (!this.isEnabled) {
      console.log('ℹ️  Redis is disabled (REDIS_URL not set)');
      return;
    }

    try {
      this.client = createClient({
        url: config.redis.url,
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      console.log('✅ Redis disconnected');
    }
  }

  /**
   * Check if Redis is enabled and connected
   */
  isConnected(): boolean {
    return this.isEnabled && this.client !== null && this.client.isOpen;
  }

  /**
   * Get the Redis client (for advanced operations)
   * Returns null if not connected
   */
  getClient(): RedisClientType | null {
    if (!this.isConnected()) {
      return null;
    }
    return this.client;
  }

  /**
   * CSRF Token Operations
   */

  /**
   * Store CSRF token
   */
  async setCSRFToken(sessionId: string, token: string): Promise<void> {
    if (!this.isConnected()) {
      console.warn('⚠️  Redis not connected, CSRF token not stored');
      return;
    }

    try {
      await this.client!.setEx(
        `csrf:${sessionId}`,
        config.redis.csrfTokenTtl,
        token
      );
    } catch (error) {
      console.error('❌ Error storing CSRF token:', error);
    }
  }

  /**
   * Get CSRF token
   */
  async getCSRFToken(sessionId: string): Promise<string | null> {
    if (!this.isConnected()) {
      return null;
    }

    try {
      return await this.client!.get(`csrf:${sessionId}`);
    } catch (error) {
      console.error('❌ Error getting CSRF token:', error);
      return null;
    }
  }

  /**
   * Delete CSRF token
   */
  async deleteCSRFToken(sessionId: string): Promise<void> {
    if (!this.isConnected()) {
      return;
    }

    try {
      await this.client!.del(`csrf:${sessionId}`);
    } catch (error) {
      console.error('❌ Error deleting CSRF token:', error);
    }
  }

  /**
   * Cache Operations
   */

  /**
   * Set cache value with TTL
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isConnected()) {
      return;
    }

    try {
      if (ttl) {
        await this.client!.setEx(key, ttl, value);
      } else {
        await this.client!.set(key, value);
      }
    } catch (error) {
      console.error(`❌ Error setting cache key ${key}:`, error);
    }
  }

  /**
   * Get cache value
   */
  async get(key: string): Promise<string | null> {
    if (!this.isConnected()) {
      return null;
    }

    try {
      return await this.client!.get(key);
    } catch (error) {
      console.error(`❌ Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete cache key
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected()) {
      return;
    }

    try {
      await this.client!.del(key);
    } catch (error) {
      console.error(`❌ Error deleting cache key ${key}:`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ Error checking key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set cache object (JSON)
   */
  async setObject(key: string, value: any, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  /**
   * Get cache object (JSON)
   */
  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`❌ Error parsing JSON for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Hotel search cache operations
   */

  /**
   * Cache hotel search results
   */
  async cacheHotelSearch(
    searchParams: any,
    results: any
  ): Promise<void> {
    const key = `hotel:search:${JSON.stringify(searchParams)}`;
    await this.setObject(key, results, config.redis.cacheTtl.hotelSearch);
  }

  /**
   * Get cached hotel search results
   */
  async getCachedHotelSearch(searchParams: any): Promise<any | null> {
    const key = `hotel:search:${JSON.stringify(searchParams)}`;
    return await this.getObject(key);
  }

  /**
   * Flight search cache operations
   */

  /**
   * Cache flight search results
   */
  async cacheFlightSearch(
    searchParams: any,
    results: any
  ): Promise<void> {
    const key = `flight:search:${JSON.stringify(searchParams)}`;
    await this.setObject(key, results, config.redis.cacheTtl.flightSearch);
  }

  /**
   * Get cached flight search results
   */
  async getCachedFlightSearch(searchParams: any): Promise<any | null> {
    const key = `flight:search:${JSON.stringify(searchParams)}`;
    return await this.getObject(key);
  }
}

// Export singleton instance
export const redisService = new RedisService();
export default redisService;
