const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const travelPayoutsService = require('../services/travelpayouts.service');

const prisma = new PrismaClient();

/**
 * Check price alerts and notify users
 * Run this as a cron job (e.g., every hour)
 */
async function checkPriceAlerts() {
  try {
    logger.info('Starting price alert check...');

    // Get all active alerts
    const alerts = await prisma.priceAlert.findMany({
      where: {
        active: true,
        triggered: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Found ${alerts.length} active price alerts`);

    for (const alert of alerts) {
      try {
        let currentPrice = null;

        // Fetch current price based on type
        if (alert.type === 'flight') {
          const results = await travelPayoutsService.searchFlights(alert.searchParams);
          if (results.length > 0) {
            currentPrice = results[0].price;
          }
        } else if (alert.type === 'hotel') {
          // Similar logic for hotels
        }

        // Update current price
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: {
            currentPrice,
            lastChecked: new Date(),
          },
        });

        // Check if price dropped below target
        if (currentPrice && currentPrice <= alert.targetPrice) {
          // Mark as triggered
          await prisma.priceAlert.update({
            where: { id: alert.id },
            data: { triggered: true },
          });

          // Send notification (email/push)
          logger.info('Price alert triggered!', {
            alertId: alert.id,
            userId: alert.user.id,
            targetPrice: alert.targetPrice,
            currentPrice,
          });

          // TODO: Send email notification
          // await sendPriceAlertEmail(alert.user, alert, currentPrice);
        }
      } catch (error) {
        logger.error('Error checking price alert:', {
          alertId: alert.id,
          error: error.message,
        });
      }
    }

    logger.info('Price alert check completed');
  } catch (error) {
    logger.error('Price alert checker failed:', error);
  }
}

// Export for use in cron job
module.exports = { checkPriceAlerts };

// If running directly
if (require.main === module) {
  checkPriceAlerts()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Price alert checker error:', error);
      process.exit(1);
    });
}
