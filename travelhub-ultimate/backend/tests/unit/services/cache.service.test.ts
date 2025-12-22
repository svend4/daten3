/**
 * Unit Tests for Cache Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheService, CACHE_TTL } from '@/services/cache.service';
import { redisService } from '@/services/redis.service';

// Mock dependencies
vi.mock('@/services/redis.service', () => ({
  redisService: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    getClient: vi.fn(),
  },
}));

vi.mock('@/utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached value when key exists', async () => {
      const key = 'test-key';
      const value = 'test-value';
      vi.mocked(redisService.get).mockResolvedValue(value);

      const result = await cacheService.get(key);

      expect(result).toBe(value);
      expect(redisService.get).toHaveBeenCalledWith(key);
    });

    it('should return null when key does not exist', async () => {
      const key = 'non-existent-key';
      vi.mocked(redisService.get).mockResolvedValue(null);

      const result = await cacheService.get(key);

      expect(result).toBeNull();
      expect(redisService.get).toHaveBeenCalledWith(key);
    });

    it('should return null on error and fail gracefully', async () => {
      const key = 'error-key';
      vi.mocked(redisService.get).mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.get(key);

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with default TTL', async () => {
      const key = 'test-key';
      const value = 'test-value';
      vi.mocked(redisService.set).mockResolvedValue(undefined);

      const result = await cacheService.set(key, value);

      expect(result).toBe(true);
      expect(redisService.set).toHaveBeenCalledWith(key, value, CACHE_TTL.MEDIUM);
    });

    it('should set value with custom TTL', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 3600;
      vi.mocked(redisService.set).mockResolvedValue(undefined);

      const result = await cacheService.set(key, value, ttl);

      expect(result).toBe(true);
      expect(redisService.set).toHaveBeenCalledWith(key, value, ttl);
    });

    it('should return false on error', async () => {
      const key = 'error-key';
      const value = 'test-value';
      vi.mocked(redisService.set).mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.set(key, value);

      expect(result).toBe(false);
    });
  });

  describe('del', () => {
    it('should delete key successfully', async () => {
      const key = 'test-key';
      vi.mocked(redisService.del).mockResolvedValue(undefined);

      const result = await cacheService.del(key);

      expect(result).toBe(true);
      expect(redisService.del).toHaveBeenCalledWith(key);
    });

    it('should return false on error', async () => {
      const key = 'error-key';
      vi.mocked(redisService.del).mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.del(key);

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      const key = 'existing-key';
      vi.mocked(redisService.exists).mockResolvedValue(true);

      const result = await cacheService.exists(key);

      expect(result).toBe(true);
      expect(redisService.exists).toHaveBeenCalledWith(key);
    });

    it('should return false when key does not exist', async () => {
      const key = 'non-existent-key';
      vi.mocked(redisService.exists).mockResolvedValue(false);

      const result = await cacheService.exists(key);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const key = 'error-key';
      vi.mocked(redisService.exists).mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.exists(key);

      expect(result).toBe(false);
    });
  });

  describe('setJSON', () => {
    it('should serialize and store object as JSON', async () => {
      const key = 'test-key';
      const obj = { name: 'John', age: 30 };
      vi.mocked(redisService.set).mockResolvedValue(undefined);

      const result = await cacheService.setJSON(key, obj);

      expect(result).toBe(true);
      expect(redisService.set).toHaveBeenCalledWith(
        key,
        JSON.stringify(obj),
        CACHE_TTL.MEDIUM
      );
    });

    it('should handle custom TTL', async () => {
      const key = 'test-key';
      const obj = { test: true };
      const ttl = 7200;
      vi.mocked(redisService.set).mockResolvedValue(undefined);

      const result = await cacheService.setJSON(key, obj, ttl);

      expect(result).toBe(true);
      expect(redisService.set).toHaveBeenCalledWith(key, JSON.stringify(obj), ttl);
    });

    it('should return false on JSON stringify error', async () => {
      const key = 'test-key';
      const circular: any = {};
      circular.self = circular; // Circular reference

      const result = await cacheService.setJSON(key, circular);

      expect(result).toBe(false);
    });
  });

  describe('getJSON', () => {
    it('should parse and return JSON object', async () => {
      const key = 'test-key';
      const obj = { name: 'Jane', age: 25 };
      vi.mocked(redisService.get).mockResolvedValue(JSON.stringify(obj));

      const result = await cacheService.getJSON(key);

      expect(result).toEqual(obj);
    });

    it('should return null when key does not exist', async () => {
      const key = 'non-existent-key';
      vi.mocked(redisService.get).mockResolvedValue(null);

      const result = await cacheService.getJSON(key);

      expect(result).toBeNull();
    });

    it('should return null on JSON parse error', async () => {
      const key = 'invalid-json-key';
      vi.mocked(redisService.get).mockResolvedValue('invalid json');

      const result = await cacheService.getJSON(key);

      expect(result).toBeNull();
    });
  });

  describe('generateKey', () => {
    it('should generate deterministic key from params', () => {
      const prefix = 'flights';
      const params = { origin: 'JFK', destination: 'LAX', date: '2024-12-25' };

      const key = cacheService.generateKey(prefix, params);

      expect(key).toBe('flights:date:2024-12-25|destination:LAX|origin:JFK');
    });

    it('should sort params alphabetically for consistency', () => {
      const prefix = 'test';
      const params1 = { a: '1', b: '2', c: '3' };
      const params2 = { c: '3', a: '1', b: '2' };

      const key1 = cacheService.generateKey(prefix, params1);
      const key2 = cacheService.generateKey(prefix, params2);

      expect(key1).toBe(key2);
    });

    it('should handle empty params', () => {
      const prefix = 'test';
      const params = {};

      const key = cacheService.generateKey(prefix, params);

      expect(key).toBe('test:');
    });
  });

  describe('clearPattern', () => {
    it('should clear all keys matching pattern', async () => {
      const pattern = 'flights:*';
      const mockClient = {
        keys: vi.fn().mockResolvedValue(['flights:1', 'flights:2', 'flights:3']),
        del: vi.fn().mockResolvedValue(3),
      };
      vi.mocked(redisService.getClient).mockReturnValue(mockClient as any);

      const result = await cacheService.clearPattern(pattern);

      expect(result).toBe(true);
      expect(mockClient.keys).toHaveBeenCalledWith(pattern);
      expect(mockClient.del).toHaveBeenCalledWith(['flights:1', 'flights:2', 'flights:3']);
    });

    it('should handle no matching keys', async () => {
      const pattern = 'non-existent:*';
      const mockClient = {
        keys: vi.fn().mockResolvedValue([]),
        del: vi.fn(),
      };
      vi.mocked(redisService.getClient).mockReturnValue(mockClient as any);

      const result = await cacheService.clearPattern(pattern);

      expect(result).toBe(true);
      expect(mockClient.del).not.toHaveBeenCalled();
    });

    it('should return false when client is unavailable', async () => {
      vi.mocked(redisService.getClient).mockReturnValue(null);

      const result = await cacheService.clearPattern('test:*');

      expect(result).toBe(false);
    });
  });

  describe('increment', () => {
    it('should increment counter', async () => {
      const key = 'counter';
      const mockClient = {
        incr: vi.fn().mockResolvedValue(5),
        expire: vi.fn(),
      };
      vi.mocked(redisService.getClient).mockReturnValue(mockClient as any);

      const result = await cacheService.increment(key);

      expect(result).toBe(5);
      expect(mockClient.incr).toHaveBeenCalledWith(key);
    });

    it('should set TTL on first increment', async () => {
      const key = 'new-counter';
      const ttl = 3600;
      const mockClient = {
        incr: vi.fn().mockResolvedValue(1),
        expire: vi.fn(),
      };
      vi.mocked(redisService.getClient).mockReturnValue(mockClient as any);

      await cacheService.increment(key, ttl);

      expect(mockClient.expire).toHaveBeenCalledWith(key, ttl);
    });

    it('should not set TTL on subsequent increments', async () => {
      const key = 'existing-counter';
      const ttl = 3600;
      const mockClient = {
        incr: vi.fn().mockResolvedValue(5),
        expire: vi.fn(),
      };
      vi.mocked(redisService.getClient).mockReturnValue(mockClient as any);

      await cacheService.increment(key, ttl);

      expect(mockClient.expire).not.toHaveBeenCalled();
    });

    it('should return 0 when client is unavailable', async () => {
      vi.mocked(redisService.getClient).mockReturnValue(null);

      const result = await cacheService.increment('counter');

      expect(result).toBe(0);
    });
  });

  describe('wrap', () => {
    it('should return cached value if available', async () => {
      const key = 'cached-fn';
      const cachedValue = { result: 'cached' };
      vi.mocked(redisService.get).mockResolvedValue(JSON.stringify(cachedValue));

      const fn = vi.fn().mockResolvedValue({ result: 'fresh' });
      const result = await cacheService.wrap(key, fn);

      expect(result).toEqual(cachedValue);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should execute function and cache result when not cached', async () => {
      const key = 'uncached-fn';
      const freshValue = { result: 'fresh' };
      vi.mocked(redisService.get).mockResolvedValue(null);
      vi.mocked(redisService.set).mockResolvedValue(undefined);

      const fn = vi.fn().mockResolvedValue(freshValue);
      const result = await cacheService.wrap(key, fn);

      expect(result).toEqual(freshValue);
      expect(fn).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(
        key,
        JSON.stringify(freshValue),
        CACHE_TTL.MEDIUM
      );
    });

    it('should use custom TTL', async () => {
      const key = 'fn-custom-ttl';
      const value = { data: 'test' };
      const ttl = 7200;
      vi.mocked(redisService.get).mockResolvedValue(null);
      vi.mocked(redisService.set).mockResolvedValue(undefined);

      const fn = vi.fn().mockResolvedValue(value);
      await cacheService.wrap(key, fn, ttl);

      expect(redisService.set).toHaveBeenCalledWith(key, JSON.stringify(value), ttl);
    });
  });

  describe('CACHE_TTL constants', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.SHORT).toBe(300); // 5 minutes
      expect(CACHE_TTL.MEDIUM).toBe(1800); // 30 minutes
      expect(CACHE_TTL.LONG).toBe(86400); // 1 day
      expect(CACHE_TTL.FLIGHTS_SEARCH).toBe(3600); // 1 hour
      expect(CACHE_TTL.HOTELS_SEARCH).toBe(7200); // 2 hours
      expect(CACHE_TTL.STATIC_DATA).toBe(2592000); // 30 days
    });
  });
});
