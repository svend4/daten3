import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get all price alerts for authenticated user
 * GET /api/price-alerts
 */
export const getAlerts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const alerts = await prisma.priceAlert.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info(`Retrieved ${alerts.length} price alerts for user ${userId}`);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error: any) {
    logger.error('Error fetching price alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price alerts'
    });
  }
};

/**
 * Create new price alert
 * POST /api/price-alerts
 */
export const createAlert = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const {
      type,
      destination,
      checkIn,
      checkOut,
      departDate,
      returnDate,
      targetPrice,
      currency
    } = req.body;

    // Validation
    if (!type || !destination || !targetPrice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, destination, targetPrice'
      });
    }

    if (!['hotel', 'flight'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid alert type. Must be "hotel" or "flight"'
      });
    }

    if (targetPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Target price must be greater than 0'
      });
    }

    // Type-specific validation
    if (type === 'hotel' && (!checkIn || !checkOut)) {
      return res.status(400).json({
        success: false,
        error: 'Hotel alerts require checkIn and checkOut dates'
      });
    }

    if (type === 'flight' && !departDate) {
      return res.status(400).json({
        success: false,
        error: 'Flight alerts require departDate'
      });
    }

    // Create alert
    const alert = await prisma.priceAlert.create({
      data: {
        userId,
        type: type as any,
        destination,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        departDate: departDate ? new Date(departDate) : null,
        returnDate: returnDate ? new Date(returnDate) : null,
        targetPrice: parseFloat(targetPrice),
        currency: currency || 'RUB',
        status: 'active' as any
      }
    });

    logger.info(`Created price alert ${alert.id} for user ${userId}`);

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Price alert created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating price alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create price alert'
    });
  }
};

/**
 * Update existing price alert
 * PATCH /api/price-alerts/:id
 */
export const updateAlert = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if alert exists and belongs to user
    const existingAlert = await prisma.priceAlert.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingAlert) {
      return res.status(404).json({
        success: false,
        error: 'Price alert not found or access denied'
      });
    }

    const {
      targetPrice,
      status,
      checkIn,
      checkOut,
      departDate,
      returnDate
    } = req.body;

    // Build update data
    const updateData: any = {};

    if (targetPrice !== undefined) {
      if (parseFloat(targetPrice) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Target price must be greater than 0'
        });
      }
      updateData.targetPrice = parseFloat(targetPrice);
    }

    if (status !== undefined) {
      if (!['active', 'triggered', 'expired', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status value'
        });
      }
      updateData.status = status as any;
    }

    if (checkIn !== undefined) {
      updateData.checkIn = checkIn ? new Date(checkIn) : null;
    }

    if (checkOut !== undefined) {
      updateData.checkOut = checkOut ? new Date(checkOut) : null;
    }

    if (departDate !== undefined) {
      updateData.departDate = departDate ? new Date(departDate) : null;
    }

    if (returnDate !== undefined) {
      updateData.returnDate = returnDate ? new Date(returnDate) : null;
    }

    // Update alert
    const updatedAlert = await prisma.priceAlert.update({
      where: { id },
      data: updateData
    });

    logger.info(`Updated price alert ${id} for user ${userId}`);

    res.json({
      success: true,
      data: updatedAlert,
      message: 'Price alert updated successfully'
    });
  } catch (error: any) {
    logger.error('Error updating price alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update price alert'
    });
  }
};

/**
 * Delete price alert
 * DELETE /api/price-alerts/:id
 */
export const deleteAlert = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if alert exists and belongs to user
    const existingAlert = await prisma.priceAlert.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingAlert) {
      return res.status(404).json({
        success: false,
        error: 'Price alert not found or access denied'
      });
    }

    // Delete alert
    await prisma.priceAlert.delete({
      where: { id }
    });

    logger.info(`Deleted price alert ${id} for user ${userId}`);

    res.json({
      success: true,
      message: 'Price alert deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting price alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete price alert'
    });
  }
};

/**
 * Check prices and trigger alerts (background job)
 * This would typically be called by a cron job or background worker
 */
export const checkPricesAndTrigger = async () => {
  try {
    const activeAlerts = await prisma.priceAlert.findMany({
      where: {
        status: 'active' as any
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

    logger.info(`Checking ${activeAlerts.length} active price alerts`);

    for (const alert of activeAlerts) {
      try {
        // TODO: Integrate with actual price checking service
        // For now, this is a placeholder
        const currentPrice = await checkCurrentPrice(alert);

        // Update current price
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { currentPrice }
        });

        // Check if target price reached
        if (currentPrice && currentPrice <= alert.targetPrice) {
          // Trigger alert
          await prisma.priceAlert.update({
            where: { id: alert.id },
            data: {
              status: 'triggered' as any,
              triggeredAt: new Date()
            }
          });

          // TODO: Send notification to user (email/push)
          logger.info(`Alert ${alert.id} triggered! Target: ${alert.targetPrice}, Current: ${currentPrice}`);

          // Send email notification (placeholder)
          // await sendPriceAlertEmail(alert.user.email, alert, currentPrice);
        }
      } catch (error) {
        logger.error(`Error checking alert ${alert.id}:`, error);
        // Continue with next alert
      }
    }

    logger.info('Price check completed');
  } catch (error) {
    logger.error('Error in price check job:', error);
    throw error;
  }
};

/**
 * Helper: Check current price for an alert
 * TODO: Integrate with real pricing APIs (Travelpayouts, Skyscanner, etc.)
 */
async function checkCurrentPrice(alert: any): Promise<number | null> {
  // Placeholder implementation
  // In production, this would call actual pricing APIs

  try {
    if (alert.type === 'hotel') {
      // TODO: Call Travelpayouts/Booking.com API
      // const price = await travelpayoutsService.getHotelPrice({
      //   destination: alert.destination,
      //   checkIn: alert.checkIn,
      //   checkOut: alert.checkOut
      // });
      // return price;

      // Placeholder: return random price for testing
      return null;
    }

    if (alert.type === 'flight') {
      // TODO: Call Aviasales/Skyscanner API
      // const price = await aviasalesService.getFlightPrice({
      //   destination: alert.destination,
      //   departDate: alert.departDate,
      //   returnDate: alert.returnDate
      // });
      // return price;

      // Placeholder: return random price for testing
      return null;
    }

    return null;
  } catch (error) {
    logger.error('Error checking price:', error);
    return null;
  }
}
