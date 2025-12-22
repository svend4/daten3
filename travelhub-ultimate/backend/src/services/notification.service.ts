/**
 * Notification Service
 * Handles in-app notifications, push notifications, and notification management
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { emailService } from './email.service';

const prisma = new PrismaClient();

/**
 * Notification types
 */
export enum NotificationType {
  // Booking notifications
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_REMINDER = 'booking_reminder',

  // Price alert notifications
  PRICE_DROP = 'price_drop',
  PRICE_ALERT_TRIGGERED = 'price_alert_triggered',

  // Payment notifications
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  REFUND_PROCESSED = 'refund_processed',

  // Affiliate notifications
  COMMISSION_EARNED = 'commission_earned',
  PAYOUT_PROCESSED = 'payout_processed',
  REFERRAL_SIGNUP = 'referral_signup',

  // System notifications
  ACCOUNT_VERIFIED = 'account_verified',
  PASSWORD_CHANGED = 'password_changed',
  LOGIN_ALERT = 'login_alert',

  // General
  ANNOUNCEMENT = 'announcement',
  PROMOTION = 'promotion'
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Notification data interface
 */
interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  link?: string;
  sendEmail?: boolean;
  sendPush?: boolean;
}

/**
 * Notification Service Class
 */
class NotificationService {
  /**
   * Create and send notification
   */
  async send(data: NotificationData): Promise<{ success: boolean; notificationId?: string }> {
    try {
      // Create in-app notification
      // TODO: Create Notification model in Prisma schema
      // const notification = await prisma.notification.create({
      //   data: {
      //     userId: data.userId,
      //     type: data.type,
      //     title: data.title,
      //     message: data.message,
      //     priority: data.priority || NotificationPriority.MEDIUM,
      //     metadata: data.metadata || {},
      //     link: data.link,
      //     read: false
      //   }
      // });

      // Mock notification ID
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      logger.info(`Notification created: ${data.title} for user ${data.userId}`);

      // Send email if requested
      if (data.sendEmail) {
        await this.sendEmailNotification(data);
      }

      // Send push notification if requested
      if (data.sendPush) {
        await this.sendPushNotification(data);
      }

      return {
        success: true,
        notificationId
      };
    } catch (error: any) {
      logger.error('Error sending notification:', error);
      return { success: false };
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(data: NotificationData): Promise<void> {
    try {
      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true, firstName: true, lastName: true }
      });

      if (!user) {
        logger.warn(`User ${data.userId} not found for email notification`);
        return;
      }

      // Send email based on notification type
      switch (data.type) {
        case NotificationType.BOOKING_CONFIRMED:
          // Email service already has booking confirmation template
          break;
        case NotificationType.PRICE_DROP:
        case NotificationType.PRICE_ALERT_TRIGGERED:
          if (data.metadata) {
            await emailService.sendPriceAlert(user.email, {
              destination: data.metadata.destination || '',
              targetPrice: data.metadata.targetPrice || 0,
              currentPrice: data.metadata.currentPrice || 0,
              currency: data.metadata.currency || 'RUB',
              type: data.metadata.type || 'hotel'
            });
          }
          break;
        default:
          // Generic notification email
          logger.info(`Email notification for ${data.type} sent to ${user.email}`);
      }
    } catch (error: any) {
      logger.error('Error sending email notification:', error);
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(data: NotificationData): Promise<void> {
    try {
      // TODO: Integrate with push notification service (Firebase, OneSignal, etc.)
      logger.info(`Push notification: ${data.title} to user ${data.userId}`);

      // Example Firebase Cloud Messaging integration:
      // const message = {
      //   notification: {
      //     title: data.title,
      //     body: data.message
      //   },
      //   data: data.metadata,
      //   token: userDeviceToken
      // };
      // await admin.messaging().send(message);
    } catch (error: any) {
      logger.error('Error sending push notification:', error);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<any[]> {
    try {
      // TODO: Implement with Prisma once Notification model is added
      // const notifications = await prisma.notification.findMany({
      //   where: {
      //     userId,
      //     ...(options.unreadOnly && { read: false })
      //   },
      //   orderBy: {
      //     createdAt: 'desc'
      //   },
      //   take: options.limit || 20,
      //   skip: options.offset || 0
      // });
      //
      // return notifications;

      // Mock data for now
      logger.info(`Fetching notifications for user ${userId}`);
      return [];
    } catch (error: any) {
      logger.error('Error fetching user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      // TODO: Implement with Prisma
      // await prisma.notification.updateMany({
      //   where: {
      //     id: notificationId,
      //     userId
      //   },
      //   data: {
      //     read: true,
      //     readAt: new Date()
      //   }
      // });

      logger.info(`Notification ${notificationId} marked as read`);
      return true;
    } catch (error: any) {
      logger.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      // TODO: Implement with Prisma
      // await prisma.notification.updateMany({
      //   where: {
      //     userId,
      //     read: false
      //   },
      //   data: {
      //     read: true,
      //     readAt: new Date()
      //   }
      // });

      logger.info(`All notifications marked as read for user ${userId}`);
      return true;
    } catch (error: any) {
      logger.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  async delete(notificationId: string, userId: string): Promise<boolean> {
    try {
      // TODO: Implement with Prisma
      // await prisma.notification.deleteMany({
      //   where: {
      //     id: notificationId,
      //     userId
      //   }
      // });

      logger.info(`Notification ${notificationId} deleted`);
      return true;
    } catch (error: any) {
      logger.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // TODO: Implement with Prisma
      // const count = await prisma.notification.count({
      //   where: {
      //     userId,
      //     read: false
      //   }
      // });
      //
      // return count;

      // Mock data
      return 0;
    } catch (error: any) {
      logger.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Send booking reminder (called by cron job)
   */
  async sendBookingReminders(): Promise<void> {
    try {
      // Find bookings happening tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const nextDay = new Date(tomorrow);
      nextDay.setDate(nextDay.getDate() + 1);

      const upcomingBookings = await prisma.booking.findMany({
        where: {
          checkIn: {
            gte: tomorrow,
            lt: nextDay
          },
          status: 'confirmed'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      logger.info(`Found ${upcomingBookings.length} bookings for reminder`);

      for (const booking of upcomingBookings) {
        await this.send({
          userId: booking.userId,
          type: NotificationType.BOOKING_REMINDER,
          title: 'Upcoming Booking Reminder',
          message: `Your booking at ${booking.itemName} is tomorrow!`,
          priority: NotificationPriority.HIGH,
          metadata: {
            bookingId: booking.id,
            itemName: booking.itemName,
            checkIn: booking.checkIn
          },
          sendEmail: true,
          sendPush: true
        });
      }
    } catch (error: any) {
      logger.error('Error sending booking reminders:', error);
    }
  }

  /**
   * Broadcast notification to multiple users
   */
  async broadcast(
    userIds: string[],
    data: Omit<NotificationData, 'userId'>
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      const result = await this.send({ ...data, userId });
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { success: true, sent, failed };
  }

  /**
   * Send announcement to all users
   */
  async sendAnnouncement(
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Get all active users
      const users = await prisma.user.findMany({
        select: { id: true }
      });

      const userIds = users.map((u: any) => u.id);

      await this.broadcast(userIds, {
        type: NotificationType.ANNOUNCEMENT,
        title,
        message,
        priority: NotificationPriority.MEDIUM,
        metadata,
        sendEmail: false,
        sendPush: true
      });

      logger.info(`Announcement sent to ${userIds.length} users`);
    } catch (error: any) {
      logger.error('Error sending announcement:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
