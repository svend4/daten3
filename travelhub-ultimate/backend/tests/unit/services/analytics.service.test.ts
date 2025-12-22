/**
 * Unit Tests for Analytics Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyticsService, AnalyticsEvent } from '@/services/analytics.service';
import { cacheService } from '@/services/cache.service';

// Mock dependencies
vi.mock('@/services/cache.service', () => ({
  cacheService: {
    increment: vi.fn(),
    get: vi.fn(),
    setJSON: vi.fn(),
    sadd: vi.fn(),
    expire: vi.fn(),
    smembers: vi.fn(),
  },
  CACHE_TTL: {
    SHORT: 300,
    MEDIUM: 1800,
    LONG: 86400,
  },
}));

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      booking = {
        groupBy: vi.fn(),
      };
    },
  };
});

vi.mock('@/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track event and increment counters', async () => {
      vi.mocked(cacheService.increment).mockResolvedValue(1);

      await analyticsService.trackEvent(AnalyticsEvent.USER_LOGIN, {
        userId: 'user-123',
        sessionId: 'session-456',
      });

      expect(cacheService.increment).toHaveBeenCalledWith(
        expect.stringContaining('analytics:events:user_login:'),
        expect.any(Number)
      );
      expect(cacheService.increment).toHaveBeenCalledWith(
        expect.stringContaining('analytics:events:total:'),
        expect.any(Number)
      );
    });

    it('should track revenue when value is provided', async () => {
      vi.mocked(cacheService.increment).mockResolvedValue(1);

      await analyticsService.trackEvent(AnalyticsEvent.BOOKING_COMPLETED, {
        userId: 'user-123',
        value: 500,
        currency: 'USD',
      });

      expect(cacheService.increment).toHaveBeenCalledWith(
        expect.stringContaining('analytics:revenue:'),
        expect.any(Number)
      );
    });

    it('should not fail the request if analytics tracking fails', async () => {
      vi.mocked(cacheService.increment).mockRejectedValue(new Error('Redis error'));

      await expect(
        analyticsService.trackEvent(AnalyticsEvent.USER_REGISTERED)
      ).resolves.not.toThrow();
    });

    it('should track metadata when provided', async () => {
      vi.mocked(cacheService.increment).mockResolvedValue(1);

      await analyticsService.trackEvent(AnalyticsEvent.HOTEL_SEARCH, {
        userId: 'user-123',
        metadata: {
          destination: 'Paris',
          checkIn: '2024-12-25',
          checkOut: '2024-12-28',
        },
      });

      expect(cacheService.increment).toHaveBeenCalled();
    });
  });

  describe('trackConversion', () => {
    it('should track signup conversion', async () => {
      vi.mocked(cacheService.increment).mockResolvedValue(1);

      await analyticsService.trackConversion('signup', 'user-123');

      expect(cacheService.increment).toHaveBeenCalledWith(
        expect.stringContaining('signup_completed'),
        expect.any(Number)
      );
    });

    it('should track booking conversion with value', async () => {
      vi.mocked(cacheService.increment).mockResolvedValue(1);

      await analyticsService.trackConversion('booking', 'user-123', 350.50, {
        bookingId: 'booking-456',
      });

      expect(cacheService.increment).toHaveBeenCalled();
    });
  });

  describe('getDailyMetrics', () => {
    it('should return daily metrics for current date', async () => {
      vi.mocked(cacheService.get)
        .mockResolvedValueOnce('100') // totalEvents
        .mockResolvedValueOnce('40') // hotelSearches
        .mockResolvedValueOnce('30') // flightSearches
        .mockResolvedValueOnce('10') // bookings
        .mockResolvedValueOnce('5000') // revenue
        .mockResolvedValueOnce('15'); // signups

      const metrics = await analyticsService.getDailyMetrics();

      expect(metrics).toEqual({
        totalEvents: 100,
        searchCount: 70, // 40 + 30
        bookingCount: 10,
        revenue: 5000,
        userSignups: 15,
      });
    });

    it('should return daily metrics for specific date', async () => {
      vi.mocked(cacheService.get).mockResolvedValue('0');

      const metrics = await analyticsService.getDailyMetrics('2024-12-22');

      expect(cacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('2024-12-22')
      );
      expect(metrics.totalEvents).toBe(0);
    });

    it('should handle missing data gracefully', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);

      const metrics = await analyticsService.getDailyMetrics();

      expect(metrics).toEqual({
        totalEvents: 0,
        searchCount: 0,
        bookingCount: 0,
        revenue: 0,
        userSignups: 0,
      });
    });
  });

  describe('getConversionFunnel', () => {
    it('should calculate conversion funnel metrics', async () => {
      vi.mocked(cacheService.get)
        .mockResolvedValueOnce('1000') // searches
        .mockResolvedValueOnce('500') // bookingStarted
        .mockResolvedValueOnce('300') // paymentStarted
        .mockResolvedValueOnce('250'); // completed

      const funnel = await analyticsService.getConversionFunnel();

      expect(funnel).toEqual({
        searches: 1000,
        bookingStarted: 500,
        paymentStarted: 300,
        completed: 250,
        conversionRate: 25, // 250/1000 * 100
      });
    });

    it('should handle zero searches without division error', async () => {
      vi.mocked(cacheService.get).mockResolvedValue('0');

      const funnel = await analyticsService.getConversionFunnel();

      expect(funnel.conversionRate).toBe(0);
    });

    it('should accept specific date parameter', async () => {
      vi.mocked(cacheService.get).mockResolvedValue('0');

      await analyticsService.getConversionFunnel('2024-12-20');

      expect(cacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('2024-12-20')
      );
    });
  });

  describe('trackPerformance', () => {
    it('should track API performance metrics', async () => {
      vi.mocked(cacheService.setJSON).mockResolvedValue(true);

      await analyticsService.trackPerformance('/api/flights', 250, 200);

      expect(cacheService.setJSON).toHaveBeenCalledWith(
        expect.stringContaining('/api/flights'),
        expect.objectContaining({
          endpoint: '/api/flights',
          duration: 250,
          statusCode: 200,
        }),
        expect.any(Number)
      );
    });

    it('should increment error counter for 4xx status codes', async () => {
      vi.mocked(cacheService.setJSON).mockResolvedValue(true);
      vi.mocked(cacheService.increment).mockResolvedValue(1);

      await analyticsService.trackPerformance('/api/flights', 150, 404);

      expect(cacheService.increment).toHaveBeenCalledWith(
        expect.stringContaining('analytics:errors:/api/flights'),
        expect.any(Number)
      );
    });

    it('should increment error counter for 5xx status codes', async () => {
      vi.mocked(cacheService.setJSON).mockResolvedValue(true);
      vi.mocked(cacheService.increment).mockResolvedValue(1);

      await analyticsService.trackPerformance('/api/bookings', 500, 500);

      expect(cacheService.increment).toHaveBeenCalledWith(
        expect.stringContaining('analytics:errors:/api/bookings'),
        expect.any(Number)
      );
    });

    it('should not increment errors for 2xx codes', async () => {
      vi.mocked(cacheService.setJSON).mockResolvedValue(true);
      vi.mocked(cacheService.increment).mockResolvedValue(1);

      await analyticsService.trackPerformance('/api/users', 100, 200);

      expect(cacheService.increment).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(cacheService.setJSON).mockRejectedValue(new Error('Cache error'));

      await expect(
        analyticsService.trackPerformance('/api/test', 100, 200)
      ).resolves.not.toThrow();
    });
  });

  describe('getActiveUsers', () => {
    it('should return active users count', async () => {
      vi.mocked(cacheService.smembers).mockResolvedValue([
        'session1:user1',
        'session2:user2',
        'session3:user3',
      ]);

      const count = await analyticsService.getActiveUsers();

      expect(count).toBe(3);
      expect(cacheService.smembers).toHaveBeenCalledWith('analytics:active_sessions');
    });

    it('should return 0 when no active users', async () => {
      vi.mocked(cacheService.smembers).mockResolvedValue([]);

      const count = await analyticsService.getActiveUsers();

      expect(count).toBe(0);
    });

    it('should return 0 on error', async () => {
      vi.mocked(cacheService.smembers).mockRejectedValue(new Error('Redis error'));

      const count = await analyticsService.getActiveUsers();

      expect(count).toBe(0);
    });
  });

  describe('trackActiveUser', () => {
    it('should add session to active sessions set', async () => {
      vi.mocked(cacheService.sadd).mockResolvedValue(1);
      vi.mocked(cacheService.expire).mockResolvedValue(true);

      await analyticsService.trackActiveUser('session-123', 'user-456');

      expect(cacheService.sadd).toHaveBeenCalledWith(
        'analytics:active_sessions',
        'session-123:user-456'
      );
      expect(cacheService.expire).toHaveBeenCalledWith(
        'analytics:active_sessions',
        1800
      );
    });

    it('should track session without userId', async () => {
      vi.mocked(cacheService.sadd).mockResolvedValue(1);
      vi.mocked(cacheService.expire).mockResolvedValue(true);

      await analyticsService.trackActiveUser('session-789');

      expect(cacheService.sadd).toHaveBeenCalledWith(
        'analytics:active_sessions',
        'session-789'
      );
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(cacheService.sadd).mockRejectedValue(new Error('Cache error'));

      await expect(
        analyticsService.trackActiveUser('session-123')
      ).resolves.not.toThrow();
    });
  });

  describe('getSearchTrends', () => {
    it('should return search trends for specified days', async () => {
      vi.mocked(cacheService.get)
        .mockResolvedValueOnce('100')
        .mockResolvedValueOnce('80')
        .mockResolvedValueOnce('90')
        .mockResolvedValueOnce('70');

      const trends = await analyticsService.getSearchTrends(2);

      expect(trends).toHaveLength(2);
      expect(trends[0]).toHaveProperty('date');
      expect(trends[0]).toHaveProperty('hotelSearches');
      expect(trends[0]).toHaveProperty('flightSearches');
    });

    it('should default to 7 days if not specified', async () => {
      vi.mocked(cacheService.get).mockResolvedValue('0');

      const trends = await analyticsService.getSearchTrends();

      expect(trends).toHaveLength(7);
    });

    it('should handle missing data with zeros', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);

      const trends = await analyticsService.getSearchTrends(1);

      expect(trends[0].hotelSearches).toBe(0);
      expect(trends[0].flightSearches).toBe(0);
    });
  });

  describe('getRevenueTrends', () => {
    it('should return revenue trends for specified days', async () => {
      vi.mocked(cacheService.get)
        .mockResolvedValueOnce('5000')
        .mockResolvedValueOnce('10')
        .mockResolvedValueOnce('7500')
        .mockResolvedValueOnce('15');

      const trends = await analyticsService.getRevenueTrends(2);

      expect(trends).toHaveLength(2);
      expect(trends[0]).toHaveProperty('date');
      expect(trends[0]).toHaveProperty('revenue');
      expect(trends[0]).toHaveProperty('bookings');
    });

    it('should default to 7 days if not specified', async () => {
      vi.mocked(cacheService.get).mockResolvedValue('0');

      const trends = await analyticsService.getRevenueTrends();

      expect(trends).toHaveLength(7);
    });

    it('should handle missing data with zeros', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);

      const trends = await analyticsService.getRevenueTrends(1);

      expect(trends[0].revenue).toBe(0);
      expect(trends[0].bookings).toBe(0);
    });
  });

  describe('AnalyticsEvent enum', () => {
    it('should have all expected event types', () => {
      expect(AnalyticsEvent.USER_REGISTERED).toBe('user_registered');
      expect(AnalyticsEvent.USER_LOGIN).toBe('user_login');
      expect(AnalyticsEvent.HOTEL_SEARCH).toBe('hotel_search');
      expect(AnalyticsEvent.FLIGHT_SEARCH).toBe('flight_search');
      expect(AnalyticsEvent.BOOKING_COMPLETED).toBe('booking_completed');
      expect(AnalyticsEvent.PAYMENT_COMPLETED).toBe('payment_completed');
    });
  });
});
