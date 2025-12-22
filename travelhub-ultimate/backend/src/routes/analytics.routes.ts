import express from 'express';
import { Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { rateLimiters } from '../middleware/rateLimit.middleware';
import { analyticsService, AnalyticsEvent } from '../services/analytics.service';
import logger from '../utils/logger';

const router = express.Router();

/**
 * Track custom event
 * POST /api/analytics/track
 */
router.post(
  '/track',
  rateLimiters.lenient,
  async (req: Request, res: Response) => {
    try {
      const { event, metadata, value, currency } = req.body;
      const userId = req.user?.id;

      if (!event) {
        return res.status(400).json({
          success: false,
          error: 'Event name is required'
        });
      }

      await analyticsService.trackEvent(event as AnalyticsEvent, {
        userId,
        metadata,
        value,
        currency
      });

      res.json({
        success: true,
        message: 'Event tracked successfully'
      });
    } catch (error: any) {
      logger.error('Error tracking event:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track event'
      });
    }
  }
);

/**
 * Get daily metrics
 * GET /api/analytics/metrics/daily?date=2025-12-22
 */
router.get(
  '/metrics/daily',
  authenticate,
  rateLimiters.lenient,
  async (req: Request, res: Response) => {
    try {
      const { date } = req.query;

      const metrics = await analyticsService.getDailyMetrics(date as string);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      logger.error('Error fetching daily metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch metrics'
      });
    }
  }
);

/**
 * Get conversion funnel
 * GET /api/analytics/funnel?date=2025-12-22
 */
router.get(
  '/funnel',
  authenticate,
  rateLimiters.lenient,
  async (req: Request, res: Response) => {
    try {
      const { date } = req.query;

      const funnel = await analyticsService.getConversionFunnel(date as string);

      res.json({
        success: true,
        data: funnel
      });
    } catch (error: any) {
      logger.error('Error fetching conversion funnel:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch funnel data'
      });
    }
  }
);

/**
 * Get search trends
 * GET /api/analytics/trends/search?days=7
 */
router.get(
  '/trends/search',
  authenticate,
  rateLimiters.lenient,
  async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7;

      const trends = await analyticsService.getSearchTrends(days);

      res.json({
        success: true,
        data: trends
      });
    } catch (error: any) {
      logger.error('Error fetching search trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch search trends'
      });
    }
  }
);

/**
 * Get revenue trends
 * GET /api/analytics/trends/revenue?days=7
 */
router.get(
  '/trends/revenue',
  authenticate,
  rateLimiters.lenient,
  async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7;

      const trends = await analyticsService.getRevenueTrends(days);

      res.json({
        success: true,
        data: trends
      });
    } catch (error: any) {
      logger.error('Error fetching revenue trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch revenue trends'
      });
    }
  }
);

/**
 * Get active users count
 * GET /api/analytics/active-users
 */
router.get(
  '/active-users',
  authenticate,
  rateLimiters.veryLenient,
  async (req: Request, res: Response) => {
    try {
      const count = await analyticsService.getActiveUsers();

      res.json({
        success: true,
        data: { activeUsers: count }
      });
    } catch (error: any) {
      logger.error('Error fetching active users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active users'
      });
    }
  }
);

/**
 * Get top performers
 * GET /api/analytics/top-performers?type=bookings&limit=10
 */
router.get(
  '/top-performers',
  authenticate,
  rateLimiters.lenient,
  async (req: Request, res: Response) => {
    try {
      const type = (req.query.type as 'bookings' | 'revenue' | 'referrals') || 'bookings';
      const limit = parseInt(req.query.limit as string) || 10;

      const performers = await analyticsService.getTopPerformers(type, limit);

      res.json({
        success: true,
        data: performers
      });
    } catch (error: any) {
      logger.error('Error fetching top performers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch top performers'
      });
    }
  }
);

export default router;
