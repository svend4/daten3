/**
 * Price Alerts Checker Job
 * Checks active price alerts and triggers notifications when prices drop
 * Based on Innovation Library v28.js
 */

import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { searchFlights as searchFlightsTravelpayouts } from '../services/travelpayouts.service.js';
import { searchHotels } from '../services/travelpayouts.service.js';
import { notificationService } from '../services/notification.service.js';

/**
 * Check all active price alerts and trigger notifications
 * This function is called by the scheduler hourly
 */
export async function checkPriceAlerts(): Promise<number> {
  try {
    logger.info('Starting price alert check...');

    // Get all active alerts that haven't been triggered
    const alerts = await prisma.priceAlert.findMany({
      where: {
        active: true,
        triggered: false
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

    logger.info(`Found ${alerts.length} active price alerts to check`);

    let triggeredCount = 0;

    for (const alert of alerts) {
      try {
        logger.info(`Checking alert ${alert.id} for user ${alert.userId}`);

        let currentPrice: number | null = null;

        // Fetch current price based on alert type
        if (alert.type === 'flight') {
          currentPrice = await checkFlightPrice(alert);
        } else if (alert.type === 'hotel') {
          currentPrice = await checkHotelPrice(alert);
        }

        // Update last checked timestamp and current price
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: {
            currentPrice,
            lastChecked: new Date()
          }
        });

        // Check if price dropped below target
        if (currentPrice && currentPrice <= alert.targetPrice) {
          logger.info('Price alert triggered!', {
            alertId: alert.id,
            userId: alert.user.id,
            targetPrice: alert.targetPrice,
            currentPrice,
            savings: alert.targetPrice - currentPrice
          });

          // Mark as triggered
          await prisma.priceAlert.update({
            where: { id: alert.id },
            data: { triggered: true }
          });

          // Send notification
          await sendPriceAlertNotification(alert, currentPrice);

          triggeredCount++;
        } else if (currentPrice) {
          logger.info(`Price not dropped yet`, {
            alertId: alert.id,
            currentPrice,
            targetPrice: alert.targetPrice,
            difference: currentPrice - alert.targetPrice
          });
        }
      } catch (error: any) {
        logger.error('Error checking individual price alert:', {
          alertId: alert.id,
          error: error.message
        });
        // Continue with next alert even if one fails
      }
    }

    logger.info(`Price alert check completed. Triggered: ${triggeredCount}/${alerts.length}`);
    return triggeredCount;
  } catch (error: any) {
    logger.error('Price alert checker failed:', error);
    throw error;
  }
}

/**
 * Check current flight price
 */
async function checkFlightPrice(alert: any): Promise<number | null> {
  try {
    const searchParams = alert.searchParams as any;

    const result = await searchFlightsTravelpayouts({
      origin: searchParams.origin,
      destination: searchParams.destination,
      departDate: searchParams.departDate,
      returnDate: searchParams.returnDate,
      adults: searchParams.passengers || 1,
      currency: 'usd',
      limit: 5
    });

    if (result.success && result.flights && result.flights.length > 0) {
      // Get lowest price from results
      const lowestPrice = Math.min(...result.flights.map((f: any) => f.price.amount));
      logger.info(`Current flight price: $${lowestPrice}`);
      return lowestPrice;
    }

    return null;
  } catch (error: any) {
    logger.error('Flight price check error:', error.message);
    return null;
  }
}

/**
 * Check current hotel price
 */
async function checkHotelPrice(alert: any): Promise<number | null> {
  try {
    const searchParams = alert.searchParams as any;

    const result = await searchHotels({
      destination: searchParams.destination,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      adults: searchParams.adults || 2,
      rooms: searchParams.rooms || 1
    });

    if (result.hotels && result.hotels.length > 0) {
      // Get lowest price from results
      const lowestPrice = Math.min(
        ...result.hotels
          .filter((h: any) => h.price?.amount)
          .map((h: any) => h.price.amount)
      );
      logger.info(`Current hotel price: $${lowestPrice}`);
      return lowestPrice;
    }

    return null;
  } catch (error: any) {
    logger.error('Hotel price check error:', error.message);
    return null;
  }
}

/**
 * Send price alert notification to user
 */
async function sendPriceAlertNotification(alert: any, currentPrice: number): Promise<void> {
  try {
    const savings = alert.targetPrice - currentPrice;
    const savingsPercentage = ((savings / alert.targetPrice) * 100).toFixed(1);

    const userName = alert.user.firstName
      ? `${alert.user.firstName} ${alert.user.lastName || ''}`.trim()
      : 'Traveler';

    // Send in-app notification
    await notificationService.send({
      userId: alert.user.id,
      type: 'PRICE_DROP',
      title: `🎉 Price Drop Alert - ${alert.type === 'flight' ? 'Flight' : 'Hotel'}!`,
      message: `The price dropped to $${currentPrice}! You save $${savings} (${savingsPercentage}%)`,
      metadata: {
        alertId: alert.id,
        alertType: alert.type,
        targetPrice: alert.targetPrice,
        currentPrice,
        savings,
        savingsPercentage,
        searchParams: alert.searchParams
      },
      priority: 'high',
      sendEmail: true,
      sendPush: true
    });

    logger.info(`Price alert notification sent`, {
      userId: alert.user.id,
      alertId: alert.id,
      savings: `$${savings}`
    });
  } catch (error: any) {
    logger.error('Failed to send price alert notification:', error);
    // Don't throw - notification failure shouldn't stop the alert from being marked
  }
}

/**
 * Clean up old triggered or expired alerts
 * Should be called periodically (e.g., weekly)
 */
export async function cleanupOldPriceAlerts(): Promise<number> {
  try {
    // Delete triggered alerts older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.priceAlert.deleteMany({
      where: {
        triggered: true,
        updatedAt: {
          lte: thirtyDaysAgo
        }
      }
    });

    logger.info(`Cleaned up ${result.count} old price alerts`);
    return result.count;
  } catch (error: any) {
    logger.error('Cleanup old price alerts error:', error);
    throw error;
  }
}

export default {
  checkPriceAlerts,
  cleanupOldPriceAlerts
};
