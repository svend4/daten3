const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get user's bookings
 */
exports.getBookings = async (req, res) => {
  try {
    const { type, status } = req.query;

    const where = {
      userId: req.user.id,
      ...(type && { type }),
      ...(status && { status }),
    };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { bookingDate: 'desc' },
    });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    logger.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bookings',
      message: error.message,
    });
  }
};

/**
 * Get single booking
 */
exports.getBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    logger.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get booking',
      message: error.message,
    });
  }
};

/**
 * Create booking
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

/**
 * Update booking status
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    logger.info('Booking status updated', { bookingId: id, status });

    res.json({
      success: true,
      data: updatedBooking,
    });
  } catch (error) {
    logger.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking',
      message: error.message,
    });
  }
};

/**
 * Cancel booking
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    logger.info('Booking cancelled', { userId: req.user.id, bookingId: id });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    logger.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
      message: error.message,
    });
  }
};
