/**
 * Analytics Service
 * Track user behavior, conversions, and business metrics
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import { cacheService, CACHE_TTL } from './cache.service.js';

const prisma = new PrismaClient();

/**
 * Event types for tracking
 */
export enum AnalyticsEvent {
  // User events
  USER_REGISTERED = 'user_registered',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',

  // Search events
  HOTEL_SEARCH = 'hotel_search',
  FLIGHT_SEARCH = 'flight_search',

  // Booking events
  BOOKING_STARTED = 'booking_started',
  BOOKING_COMPLETED = 'booking_completed',
  BOOKING_CANCELLED = 'booking_cancelled',

  // Payment events
  PAYMENT_STARTED = 'payment_started',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',

  // Affiliate events
  REFERRAL_CLICKED = 'referral_clicked',
  REFERRAL_SIGNUP = 'referral_signup',
  COMMISSION_EARNED = 'commission_earned',

  // Engagement events
  PRICE_ALERT_CREATED = 'price_alert_created',
  FAVORITE_ADDED = 'favorite_added',
  REVIEW_SUBMITTED = 'review_submitted',

  // Error events
  API_ERROR = 'api_error',
  PAYMENT_ERROR = 'payment_error'
}

/**
 * Analytics event data interface
 */
interface EventData {
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  value?: number;
  currency?: string;
}

/**
 * Analytics Service Class
 */
class AnalyticsService {
  /**
   * Track an event
   */
  async trackEvent(
    event: AnalyticsEvent,
    data: EventData = {}
  ): Promise<void> {
    try {
      const eventData = {
        event,
        userId: data.userId,
        sessionId: data.sessionId,
        metadata: data.metadata || {},
        value: data.value,
        currency: data.currency,
        timestamp: new Date()
      };

      // Log event
      logger.info(`Analytics Event: ${event}`, eventData);

      // Increment counters in Redis
      const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      await cacheService.increment(`analytics:events:${event}:${dateKey}`, CACHE_TTL.LONG);
      await cacheService.increment(`analytics:events:total:${dateKey}`, CACHE_TTL.LONG);

      // Store event metadata if significant
      if (data.value) {
        await cacheService.increment(
          `analytics:revenue:${dateKey}`,
          CACHE_TTL.LONG
        );
      }

      // TODO: Send to analytics platform (Google Analytics, Mixpanel, etc.)
      // await this.sendToExternalAnalytics(eventData);
    } catch (error: any) {
      // Don't fail the request if analytics fails
      logger.error('Analytics tracking error:', error);
    }
  }

  /**
   * Track conversion
   */
  async trackConversion(
    type: 'signup' | 'booking' | 'payment' | 'referral',
    userId: string,
    value?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(`${type}_completed` as AnalyticsEvent, {
      userId,
      value,
      metadata
    });
  }

  /**
   * Get daily metrics
   */
  async getDailyMetrics(date?: string): Promise<{
    totalEvents: number;
    searchCount: number;
    bookingCount: number;
    revenue: number;
    userSignups: number;
  }> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [
      totalEvents,
      hotelSearches,
      flightSearches,
      bookings,
      revenue,
      signups
    ] = await Promise.all([
      cacheService.get(`analytics:events:total:${targetDate}`),
      cacheService.get(`analytics:events:${AnalyticsEvent.HOTEL_SEARCH}:${targetDate}`),
      cacheService.get(`analytics:events:${AnalyticsEvent.FLIGHT_SEARCH}:${targetDate}`),
      cacheService.get(`analytics:events:${AnalyticsEvent.BOOKING_COMPLETED}:${targetDate}`),
      cacheService.get(`analytics:revenue:${targetDate}`),
      cacheService.get(`analytics:events:${AnalyticsEvent.USER_REGISTERED}:${targetDate}`)
    ]);

    return {
      totalEvents: parseInt(totalEvents || '0'),
      searchCount: (parseInt(hotelSearches || '0') + parseInt(flightSearches || '0')),
      bookingCount: parseInt(bookings || '0'),
      revenue: parseInt(revenue || '0'),
      userSignups: parseInt(signups || '0')
    };
  }

  /**
   * Get conversion funnel metrics
   */
  async getConversionFunnel(date?: string): Promise<{
    searches: number;
    bookingStarted: number;
    paymentStarted: number;
    completed: number;
    conversionRate: number;
  }> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [
      searches,
      bookingStarted,
      paymentStarted,
      completed
    ] = await Promise.all([
      cacheService.get(`analytics:events:${AnalyticsEvent.HOTEL_SEARCH}:${targetDate}`),
      cacheService.get(`analytics:events:${AnalyticsEvent.BOOKING_STARTED}:${targetDate}`),
      cacheService.get(`analytics:events:${AnalyticsEvent.PAYMENT_STARTED}:${targetDate}`),
      cacheService.get(`analytics:events:${AnalyticsEvent.BOOKING_COMPLETED}:${targetDate}`)
    ]);

    const searchCount = parseInt(searches || '0');
    const completedCount = parseInt(completed || '0');

    return {
      searches: searchCount,
      bookingStarted: parseInt(bookingStarted || '0'),
      paymentStarted: parseInt(paymentStarted || '0'),
      completed: completedCount,
      conversionRate: searchCount > 0 ? (completedCount / searchCount) * 100 : 0
    };
  }

  /**
   * Get top performers (users or affiliates)
   */
  async getTopPerformers(
    type: 'bookings' | 'revenue' | 'referrals',
    limit: number = 10
  ): Promise<Array<{ userId: string; count: number; value?: number }>> {
    try {
      // Query from database
      // TODO: Implement based on your data model

      // Example implementation:
      const topUsers = await prisma.booking.groupBy({
        by: ['userId'],
        _count: {
          id: true
        },
        _sum: {
          totalPrice: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: limit
      });

      return topUsers.map(user => ({
        userId: user.userId,
        count: user._count.id,
        value: user._sum.totalPrice || 0
      }));
    } catch (error: any) {
      logger.error('Error fetching top performers:', error);
      return [];
    }
  }

  /**
   * Track API performance metrics
   */
  async trackPerformance(
    endpoint: string,
    duration: number,
    statusCode: number
  ): Promise<void> {
    try {
      const dateKey = new Date().toISOString().split('T')[0];
      const metricKey = `analytics:performance:${endpoint}:${dateKey}`;

      // Store performance data
      const data = {
        endpoint,
        duration,
        statusCode,
        timestamp: new Date().toISOString()
      };

      await cacheService.setJSON(
        `${metricKey}:${Date.now()}`,
        data,
        CACHE_TTL.SHORT
      );

      // Increment error counter if applicable
      if (statusCode >= 400) {
        await cacheService.increment(
          `analytics:errors:${endpoint}:${dateKey}`,
          CACHE_TTL.LONG
        );
      }
    } catch (error: any) {
      logger.error('Performance tracking error:', error);
    }
  }

  /**
   * Get real-time active users count
   */
  async getActiveUsers(): Promise<number> {
    try {
      const activeSessionsKey = 'analytics:active_sessions';
      const members = await cacheService.smembers(activeSessionsKey);
      return members.length;
    } catch (error: any) {
      logger.error('Error getting active users:', error);
      return 0;
    }
  }

  /**
   * Track active user session
   */
  async trackActiveUser(sessionId: string, userId?: string): Promise<void> {
    try {
      const activeSessionsKey = 'analytics:active_sessions';
      const sessionData = userId ? `${sessionId}:${userId}` : sessionId;

      await cacheService.sadd(activeSessionsKey, sessionData);
      await cacheService.expire(activeSessionsKey, 60 * 30); // 30 minutes
    } catch (error: any) {
      logger.error('Error tracking active user:', error);
    }
  }

  /**
   * Get search trends
   */
  async getSearchTrends(days: number = 7): Promise<Array<{
    date: string;
    hotelSearches: number;
    flightSearches: number;
  }>> {
    const trends: Array<{ date: string; hotelSearches: number; flightSearches: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      const [hotelSearches, flightSearches] = await Promise.all([
        cacheService.get(`analytics:events:${AnalyticsEvent.HOTEL_SEARCH}:${dateKey}`),
        cacheService.get(`analytics:events:${AnalyticsEvent.FLIGHT_SEARCH}:${dateKey}`)
      ]);

      trends.unshift({
        date: dateKey,
        hotelSearches: parseInt(hotelSearches || '0'),
        flightSearches: parseInt(flightSearches || '0')
      });
    }

    return trends;
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(days: number = 7): Promise<Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>> {
    const trends: Array<{ date: string; revenue: number; bookings: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      const [revenue, bookings] = await Promise.all([
        cacheService.get(`analytics:revenue:${dateKey}`),
        cacheService.get(`analytics:events:${AnalyticsEvent.BOOKING_COMPLETED}:${dateKey}`)
      ]);

      trends.unshift({
        date: dateKey,
        revenue: parseInt(revenue || '0'),
        bookings: parseInt(bookings || '0')
      });
    }

    return trends;
  }

  /**
   * Export analytics data for external processing
   */
  async exportData(startDate: string, endDate: string): Promise<any[]> {
    // TODO: Implement data export functionality
    // Query all events between dates and format for export
    logger.info(`Exporting analytics data from ${startDate} to ${endDate}`);
    return [];
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
