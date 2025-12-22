const { CacheService, CACHE_TTL } = require('../../src/services/cache.service');

// Mock Redis client
jest.mock('../../src/config/redis.config', () => ({
  getClient: jest.fn(() => ({
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    exists: jest.fn()
  }))
}));

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached value if exists', async () => {
      const mockValue = 'test-value';
      const { getClient } = require('../../src/config/redis.config');
      getClient().get.mockResolvedValue(mockValue);

      const result = await CacheService.get('test-key');

      expect(result).toBe(mockValue);
      expect(getClient().get).toHaveBeenCalledWith('test-key');
    });

    it('should return null if key does not exist', async () => {
      const { getClient } = require('../../src/config/redis.config');
      getClient().get.mockResolvedValue(null);

      const result = await CacheService.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const { getClient } = require('../../src/config/redis.config');
      getClient().get.mockRejectedValue(new Error('Redis error'));

      const result = await CacheService.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with TTL', async () => {
      const { getClient } = require('../../src/config/redis.config');
      getClient().setEx.mockResolvedValue('OK');

      const result = await CacheService.set('test-key', 'test-value', 3600);

      expect(result).toBe(true);
      expect(getClient().setEx).toHaveBeenCalledWith('test-key', 3600, 'test-value');
    });
  });

  describe('generateKey', () => {
    it('should generate consistent cache key', () => {
      const params = { origin: 'MOW', destination: 'LON', date: '2025-12-01' };
      
      const key1 = CacheService.generateKey('flights', params);
      const key2 = CacheService.generateKey('flights', params);

      expect(key1).toBe(key2);
      expect(key1).toContain('flights:');
    });

    it('should generate same key regardless of param order', () => {
      const params1 = { a: '1', b: '2', c: '3' };
      const params2 = { c: '3', a: '1', b: '2' };

      const key1 = CacheService.generateKey('test', params1);
      const key2 = CacheService.generateKey('test', params2);

      expect(key1).toBe(key2);
    });
  });
});
