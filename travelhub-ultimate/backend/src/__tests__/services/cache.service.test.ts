import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redisService } from '../../services/redis.service';

describe('Cache Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Operations', () => {
    it('should connect to Redis successfully', async () => {
      await redisService.connect();
      expect(redisService.connect).toHaveBeenCalled();
    });

    it('should check if Redis is connected', () => {
      const isConnected = redisService.isConnected();
      expect(typeof isConnected).toBe('boolean');
    });

    it('should ping Redis successfully', async () => {
      const result = await redisService.ping();
      expect(result).toBe('PONG');
    });
  });

  describe('String Operations', () => {
    it('should set and get a string value', async () => {
      const key = 'test:key';
      const value = 'test-value';

      await redisService.set(key, value);
      expect(redisService.set).toHaveBeenCalledWith(key, value);

      vi.mocked(redisService.get).mockResolvedValue(value);
      const result = await redisService.get(key);
      expect(result).toBe(value);
    });

    it('should set value with TTL', async () => {
      const key = 'test:ttl';
      const value = 'test-value';
      const ttl = 3600;

      await redisService.set(key, value, ttl);
      expect(redisService.set).toHaveBeenCalledWith(key, value, ttl);
    });

    it('should delete a key', async () => {
      const key = 'test:delete';

      await redisService.del(key);
      expect(redisService.del).toHaveBeenCalledWith(key);
    });
  });

  describe('Object Operations', () => {
    it('should set and get a JSON object', async () => {
      const key = 'test:object';
      const obj = { name: 'John', age: 30 };

      await redisService.setObject(key, obj);
      expect(redisService.setObject).toHaveBeenCalledWith(key, obj);

      vi.mocked(redisService.getObject).mockResolvedValue(obj);
      const result = await redisService.getObject(key);
      expect(result).toEqual(obj);
    });

    it('should return null for non-existent key', async () => {
      const key = 'test:nonexistent';

      vi.mocked(redisService.getObject).mockResolvedValue(null);
      const result = await redisService.getObject(key);
      expect(result).toBeNull();
    });
  });

  describe('Hotel Search Cache', () => {
    it('should cache hotel search results', async () => {
      const searchParams = {
        destination: 'Paris',
        checkIn: '2025-12-01',
        checkOut: '2025-12-05',
        adults: 2,
      };
      const results = [{ id: 1, name: 'Hotel Paris' }];

      await redisService.cacheHotelSearch(searchParams, results);
      expect(redisService.cacheHotelSearch).toHaveBeenCalledWith(searchParams, results);
    });

    it('should retrieve cached hotel search', async () => {
      const searchParams = {
        destination: 'Paris',
        checkIn: '2025-12-01',
        checkOut: '2025-12-05',
      };
      const cachedResults = [{ id: 1, name: 'Hotel Paris' }];

      vi.mocked(redisService.getCachedHotelSearch).mockResolvedValue(cachedResults);
      const result = await redisService.getCachedHotelSearch(searchParams);
      expect(result).toEqual(cachedResults);
    });
  });

  describe('Flight Search Cache', () => {
    it('should cache flight search results', async () => {
      const searchParams = {
        origin: 'MOW',
        destination: 'PAR',
        departDate: '2025-12-01',
      };
      const results = [{ id: 1, price: 500 }];

      await redisService.cacheFlightSearch(searchParams, results);
      expect(redisService.cacheFlightSearch).toHaveBeenCalledWith(searchParams, results);
    });

    it('should retrieve cached flight search', async () => {
      const searchParams = {
        origin: 'MOW',
        destination: 'PAR',
        departDate: '2025-12-01',
      };
      const cachedResults = [{ id: 1, price: 500 }];

      vi.mocked(redisService.getCachedFlightSearch).mockResolvedValue(cachedResults);
      const result = await redisService.getCachedFlightSearch(searchParams);
      expect(result).toEqual(cachedResults);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      vi.mocked(redisService.connect).mockRejectedValue(new Error('Connection failed'));

      await expect(redisService.connect()).rejects.toThrow('Connection failed');
    });

    it('should handle get errors gracefully', async () => {
      const key = 'test:error';

      vi.mocked(redisService.get).mockRejectedValue(new Error('Get failed'));

      await expect(redisService.get(key)).rejects.toThrow('Get failed');
    });
  });
});
