/**
 * Advanced Notifications Service
 * Handles push notifications, SMS, email, and in-app notifications
 */

import logger from '../utils/logger.js';

export interface NotificationRequest {
  userId: string;
  type: 'push' | 'sms' | 'email' | 'in_app';
  title: string;
  body: string;
  data?: any;
  priority?: 'high' | 'normal' | 'low';
  channels?: ('push' | 'sms' | 'email' | 'in_app')[];
}

export interface PushNotificationToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  createdAt: Date;
}

export interface SMSRequest {
  phoneNumber: string;
  message: string;
  countryCode?: string;
}

/**
 * Send notification via all specified channels
 */
export async function sendNotification(request: NotificationRequest): Promise<{
  success: boolean;
  channels: Record<string, { success: boolean; messageId?: string; error?: string }>;
}> {
  try {
    logger.info(`Sending notification to user ${request.userId} via ${request.channels?.join(', ') || 'default'}`);

    const channels = request.channels || [request.type];
    const results: Record<string, any> = {};

    // Send via each channel
    for (const channel of channels) {
      switch (channel) {
        case 'push':
          results.push = await sendPushNotification(request);
          break;
        case 'sms':
          results.sms = await sendSMS({
            phoneNumber: '+1234567890', // Would get from user profile
            message: request.body,
          });
          break;
        case 'email':
          results.email = await sendEmail(
            'user@example.com', // Would get from user profile
            request.title,
            request.body
          );
          break;
        case 'in_app':
          results.in_app = await createInAppNotification(request);
          break;
      }
    }

    const allSuccessful = Object.values(results).every((r: any) => r.success);

    return {
      success: allSuccessful,
      channels: results,
    };
  } catch (error: any) {
    logger.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Send push notification via FCM
 */
export async function sendPushNotification(request: NotificationRequest): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    logger.info(`Sending push notification to user ${request.userId}`);

    // Mock implementation - would use Firebase Cloud Messaging (FCM)
    // const admin = require('firebase-admin');
    // const message = {
    //   notification: {
    //     title: request.title,
    //     body: request.body,
    //   },
    //   data: request.data,
    //   token: userToken,
    // };
    // const response = await admin.messaging().send(message);

    const messageId = `fcm_${Date.now()}`;
    logger.info(`Push notification sent: ${messageId}`);

    return { success: true, messageId };
  } catch (error: any) {
    logger.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(request: SMSRequest): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    logger.info(`Sending SMS to ${request.phoneNumber}`);

    // Mock implementation - would use Twilio
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const message = await client.messages.create({
    //   body: request.message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: request.phoneNumber,
    // });

    const messageId = `sms_${Date.now()}`;
    logger.info(`SMS sent: ${messageId}`);

    return { success: true, messageId };
  } catch (error: any) {
    logger.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email notification
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  html?: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    logger.info(`Sending email to ${to}`);

    // Mock implementation - would use existing email service
    const messageId = `email_${Date.now()}`;
    logger.info(`Email sent: ${messageId}`);

    return { success: true, messageId };
  } catch (error: any) {
    logger.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create in-app notification
 */
export async function createInAppNotification(request: NotificationRequest): Promise<{
  success: boolean;
  notificationId?: string;
  error?: string;
}> {
  try {
    logger.info(`Creating in-app notification for user ${request.userId}`);

    // Mock implementation - would save to database
    const notificationId = `notif_${Date.now()}`;

    // In real implementation:
    // await prisma.notification.create({
    //   data: {
    //     userId: request.userId,
    //     type: 'in_app',
    //     title: request.title,
    //     body: request.body,
    //     data: request.data,
    //     read: false,
    //   },
    // });

    logger.info(`In-app notification created: ${notificationId}`);

    return { success: true, notificationId };
  } catch (error: any) {
    logger.error('Error creating in-app notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Register device token for push notifications
 */
export async function registerPushToken(token: PushNotificationToken): Promise<void> {
  try {
    logger.info(`Registering push token for user ${token.userId}`);

    // Save token to database
    // await prisma.pushToken.upsert({
    //   where: { deviceId: token.deviceId },
    //   update: { token: token.token },
    //   create: token,
    // });

    logger.info(`Push token registered`);
  } catch (error: any) {
    logger.error('Error registering push token:', error);
    throw error;
  }
}

/**
 * Send booking confirmation notification
 */
export async function sendBookingConfirmation(
  userId: string,
  bookingId: string,
  details: any
): Promise<void> {
  await sendNotification({
    userId,
    type: 'push',
    title: 'Booking Confirmed!',
    body: `Your booking #${bookingId} has been confirmed`,
    data: { bookingId, type: 'booking_confirmation' },
    priority: 'high',
    channels: ['push', 'email', 'in_app'],
  });
}

/**
 * Send price drop alert
 */
export async function sendPriceDropAlert(
  userId: string,
  itemId: string,
  oldPrice: number,
  newPrice: number
): Promise<void> {
  const savings = oldPrice - newPrice;
  const savingsPercent = Math.round((savings / oldPrice) * 100);

  await sendNotification({
    userId,
    type: 'push',
    title: 'Price Drop Alert!',
    body: `Price dropped by ${savingsPercent}% - Save $${savings}`,
    data: { itemId, type: 'price_drop', oldPrice, newPrice },
    priority: 'high',
    channels: ['push', 'in_app'],
  });
}

/**
 * Send flight status update
 */
export async function sendFlightStatusUpdate(
  userId: string,
  flightNumber: string,
  status: string,
  details?: string
): Promise<void> {
  await sendNotification({
    userId,
    type: 'push',
    title: `Flight ${flightNumber} Update`,
    body: details || `Status: ${status}`,
    data: { flightNumber, status, type: 'flight_status' },
    priority: 'high',
    channels: ['push', 'sms', 'in_app'],
  });
}

/**
 * Send reminder notification
 */
export async function sendReminder(
  userId: string,
  reminderType: 'check_in' | 'flight_departure' | 'booking_expiration',
  details: any
): Promise<void> {
  const titles = {
    check_in: 'Check-in Reminder',
    flight_departure: 'Flight Departure Soon',
    booking_expiration: 'Booking Expiring Soon',
  };

  await sendNotification({
    userId,
    type: 'push',
    title: titles[reminderType],
    body: details.message,
    data: { type: reminderType, ...details },
    priority: 'normal',
    channels: ['push', 'in_app'],
  });
}

/**
 * Get user's notification preferences
 */
export async function getNotificationPreferences(userId: string): Promise<{
  push: boolean;
  sms: boolean;
  email: boolean;
  categories: {
    bookings: boolean;
    priceAlerts: boolean;
    promotions: boolean;
    flightUpdates: boolean;
  };
}> {
  // Mock preferences - would fetch from database
  return {
    push: true,
    sms: true,
    email: true,
    categories: {
      bookings: true,
      priceAlerts: true,
      promotions: false,
      flightUpdates: true,
    },
  };
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: any
): Promise<void> {
  logger.info(`Updating notification preferences for user ${userId}`);
  // Would update database
}

/**
 * Mark in-app notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  logger.info(`Marking notification as read: ${notificationId}`);
  // await prisma.notification.update({
  //   where: { id: notificationId },
  //   data: { read: true, readAt: new Date() },
  // });
}

/**
 * Get user's in-app notifications
 */
export async function getUserNotifications(
  userId: string,
  filters?: { unreadOnly?: boolean; limit?: number }
): Promise<any[]> {
  logger.info(`Getting notifications for user ${userId}`);

  // Mock notifications
  return [
    {
      id: 'notif_1',
      title: 'Booking Confirmed',
      body: 'Your booking #12345 has been confirmed',
      read: false,
      createdAt: new Date(),
    },
  ];
}

export default {
  sendNotification,
  sendPushNotification,
  sendSMS,
  sendEmail,
  createInAppNotification,
  registerPushToken,
  sendBookingConfirmation,
  sendPriceDropAlert,
  sendFlightStatusUpdate,
  sendReminder,
  getNotificationPreferences,
  updateNotificationPreferences,
  markAsRead,
  getUserNotifications,
};
