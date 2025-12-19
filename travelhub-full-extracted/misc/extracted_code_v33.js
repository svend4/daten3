const { PrismaClient } = require('@prisma/client');
const commissionService = require('../services/commission.service');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Создать бронирование (обновлённая версия)
 */
exports.createBooking = async (req, res) => {
  try {
    const { type, itemId, itemData, totalPrice, currency, travelDate } = req.body;

    if (!type || !itemId || !itemData || !totalPrice || !travelDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Создать бронирование
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        type,
        itemId,
        itemData,
        totalPrice,
        currency: currency || 'USD',
        travelDate: new Date(travelDate),
      },
    });

    logger.info('Booking created', { userId: req.user.id, bookingId: booking.id });

    // ========================================
    // ОБРАБОТАТЬ ПАРТНЁРСКУЮ КОМИССИЮ
    // ========================================
    
    // Получить реферальный код из cookie или query параметра
    const referralCode = req.cookies.aff_ref || req.query.ref;

    if (referralCode) {
      try {
        await commissionService.processConversion({
          userId: req.user.id,
          bookingId: booking.id,
          bookingType: type,
          bookingAmount: totalPrice,
          currency: currency || 'USD',
          referralCode
        });

        logger.info('Affiliate commission processed', {
          bookingId: booking.id,
          referralCode
        });
      } catch (error) {
        // Не блокировать бронирование, если комиссия не начислена
        logger.error('Failed to process commission', {
          error: error.message,
          bookingId: booking.id
        });
      }
    }

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    logger.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: error.message,
    });
  }
};
