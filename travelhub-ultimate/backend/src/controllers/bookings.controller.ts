import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

/**
 * Bookings Controller
 * Handles booking operations (create, read, update, cancel)
 * Now using Prisma ORM with PostgreSQL
 */

/**
 * GET /api/bookings
 * Get all bookings for current user
 */
export const getBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const { status, type, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Build filter conditions
    const where: any = {
      userId: req.user.id
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Fetch bookings from database with pagination
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          type: true,
          status: true,
          itemId: true,
          itemName: true,
          itemImage: true,
          checkIn: true,
          checkOut: true,
          departDate: true,
          returnDate: true,
          guests: true,
          rooms: true,
          totalPrice: true,
          currency: true,
          paymentId: true,
          paymentStatus: true,
          specialRequests: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('❌ Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to retrieve bookings.'
    });
  }
};

/**
 * GET /api/bookings/:id
 * Get single booking by ID
 */
export const getBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const { id } = req.params;

    // Fetch booking from database
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Booking not found.'
      });
      return;
    }

    // Check if booking belongs to user (unless admin)
    if (booking.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to view this booking.'
      });
      return;
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    console.error('❌ Get booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'Failed to retrieve booking.'
    });
  }
};

/**
 * POST /api/bookings
 * Create new booking
 */
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const {
      type,
      itemId,
      itemName,
      itemImage,
      checkIn,
      checkOut,
      departDate,
      returnDate,
      guests,
      rooms,
      totalPrice,
      currency = 'RUB',
      paymentMethod,
      specialRequests,
      metadata
    } = req.body;

    // Validation
    if (!type || !itemId || !itemName || !totalPrice) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Type, item ID, item name, and total price are required.'
      });
      return;
    }

    // Validate booking type
    const validTypes = ['hotel', 'flight', 'package'];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: `Type must be one of: ${validTypes.join(', ')}`
      });
      return;
    }

    // Type-specific validation
    if (type === 'hotel' && (!checkIn || !checkOut)) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Check-in and check-out dates are required for hotel bookings.'
      });
      return;
    }

    if (type === 'flight' && (!departDate)) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Departure date is required for flight bookings.'
      });
      return;
    }

    // Create booking in database
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        type,
        itemId,
        itemName,
        itemImage: itemImage || null,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        departDate: departDate ? new Date(departDate) : null,
        returnDate: returnDate ? new Date(returnDate) : null,
        guests: guests || 1,
        rooms: rooms || null,
        totalPrice,
        currency,
        paymentId: paymentMethod || null,
        specialRequests: specialRequests || null,
        metadata: metadata || null,
        status: 'pending'
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

    // TODO: Process payment
    // const payment = await processPayment({ ... });
    // if (payment.success) {
    //   await prisma.booking.update({
    //     where: { id: booking.id },
    //     data: { status: 'confirmed', paymentId: payment.id, paymentStatus: 'paid' }
    //   });
    // }

    // TODO: Track affiliate conversion if referralCode exists
    // This would be in the metadata or separate field
    // if (metadata?.referralCode) {
    //   await trackConversion({
    //     bookingId: booking.id,
    //     referralCode: metadata.referralCode,
    //     amount: totalPrice
    //   });
    // }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error: any) {
    console.error('❌ Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Booking failed',
      message: error.message || 'Failed to create booking.'
    });
  }
};

/**
 * PATCH /api/bookings/:id/status
 * Update booking status
 */
export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
      return;
    }

    // Check if booking exists and belongs to user
    const existingBooking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!existingBooking) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Booking not found.'
      });
      return;
    }

    if (existingBooking.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to update this booking.'
      });
      return;
    }

    // Update booking status in database
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        updatedAt: updatedBooking.updatedAt
      }
    });
  } catch (error: any) {
    console.error('❌ Update booking status error:', error);
    res.status(500).json({
      success: false,
      error: 'Update failed',
      message: 'Failed to update booking status.'
    });
  }
};

/**
 * DELETE /api/bookings/:id
 * Cancel booking
 */
export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const { id } = req.params;

    // Check if booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Booking not found.'
      });
      return;
    }

    if (booking.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to cancel this booking.'
      });
      return;
    }

    // Check if booking can be cancelled
    if (booking.status === 'completed') {
      res.status(400).json({
        success: false,
        error: 'Cannot cancel',
        message: 'Completed bookings cannot be cancelled.'
      });
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({
        success: false,
        error: 'Already cancelled',
        message: 'This booking is already cancelled.'
      });
      return;
    }

    // TODO: Process refund if applicable
    // const refundEligible = checkRefundEligibility(booking);
    // if (refundEligible && booking.paymentId) {
    //   await processRefund({ paymentId: booking.paymentId, amount: booking.totalPrice });
    // }

    // Update booking status to cancelled
    const cancelledBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled'
      }
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        id: cancelledBooking.id,
        status: cancelledBooking.status,
        updatedAt: cancelledBooking.updatedAt
      }
    });
  } catch (error: any) {
    console.error('❌ Cancel booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Cancellation failed',
      message: 'Failed to cancel booking.'
    });
  }
};
