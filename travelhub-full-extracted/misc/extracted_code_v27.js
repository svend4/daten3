const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get user's price alerts
 */
exports.getAlerts = async (req, res) => {
  try {
    const { active } = req.query;

    const where = {
      userId: req.user.id,
      ...(active !== undefined && { active: active === 'true' }),
    };

    const alerts = await prisma.priceAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    logger.error('Get price alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get price alerts',
      message: error.message,
    });
  }
};

/**
 * Create price alert
 */
exports.createAlert = async (req, res) => {
  try {
    const { type, searchParams, targetPrice } = req.body;

    if (!type || !searchParams || !targetPrice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const alert = await prisma.priceAlert.create({
      data: {
        userId: req.user.id,
        type,
        searchParams,
        targetPrice,
      },
    });

    logger.info('Price alert created', { userId: req.user.id, alertId: alert.id });

    res.status(201).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    logger.error('Create price alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create price alert',
      message: error.message,
    });
  }
};

/**
 * Update price alert
 */
exports.updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { active, targetPrice } = req.body;

    const alert = await prisma.priceAlert.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Price alert not found',
      });
    }

    const updatedAlert = await prisma.priceAlert.update({
      where: { id },
      data: {
        ...(active !== undefined && { active }),
        ...(targetPrice !== undefined && { targetPrice }),
      },
    });

    res.json({
      success: true,
      data: updatedAlert,
    });
  } catch (error) {
    logger.error('Update price alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update price alert',
      message: error.message,
    });
  }
};

/**
 * Delete price alert
 */
exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await prisma.priceAlert.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Price alert not found',
      });
    }

    await prisma.priceAlert.delete({
      where: { id },
    });

    logger.info('Price alert deleted', { userId: req.user.id, alertId: id });

    res.json({
      success: true,
      message: 'Price alert deleted successfully',
    });
  } catch (error) {
    logger.error('Delete price alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete price alert',
      message: error.message,
    });
  }
};
