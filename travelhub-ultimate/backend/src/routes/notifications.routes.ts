import express from 'express';
import { Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { rateLimiters } from '../middleware/rateLimit.middleware';
import { notificationService, NotificationType, NotificationPriority } from '../services/notification.service';
import logger from '../utils/logger';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get user notifications
 * GET /api/notifications?unreadOnly=true&limit=20&offset=0
 */
router.get(
  '/',
  rateLimiters.lenient,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const unreadOnly = req.query.unreadOnly === 'true';
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const notifications = await notificationService.getUserNotifications(userId, {
        unreadOnly,
        limit,
        offset
      });

      res.json({
        success: true,
        data: notifications
      });
    } catch (error: any) {
      logger.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notifications'
      });
    }
  }
);

/**
 * Get unread notifications count
 * GET /api/notifications/unread/count
 */
router.get(
  '/unread/count',
  rateLimiters.veryLenient,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error: any) {
      logger.error('Error fetching unread count:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch unread count'
      });
    }
  }
);

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
router.patch(
  '/:id/read',
  rateLimiters.lenient,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const success = await notificationService.markAsRead(id, userId);

      if (success) {
        res.json({
          success: true,
          message: 'Notification marked as read'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }
    } catch (error: any) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read'
      });
    }
  }
);

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
router.patch(
  '/read-all',
  rateLimiters.moderate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const success = await notificationService.markAllAsRead(userId);

      res.json({
        success,
        message: 'All notifications marked as read'
      });
    } catch (error: any) {
      logger.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark all notifications as read'
      });
    }
  }
);

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
router.delete(
  '/:id',
  rateLimiters.moderate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const success = await notificationService.delete(id, userId);

      if (success) {
        res.json({
          success: true,
          message: 'Notification deleted'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }
    } catch (error: any) {
      logger.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete notification'
      });
    }
  }
);

/**
 * Send test notification (development only)
 * POST /api/notifications/test
 */
router.post(
  '/test',
  rateLimiters.strict,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Only allow in development
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          error: 'Test notifications not allowed in production'
        });
      }

      const result = await notificationService.send({
        userId,
        type: NotificationType.ANNOUNCEMENT,
        title: 'Test Notification',
        message: 'This is a test notification from TravelHub',
        priority: NotificationPriority.LOW,
        sendEmail: false,
        sendPush: false
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Error sending test notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send test notification'
      });
    }
  }
);

export default router;
