import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Create payment intent for booking
 * POST /api/payment/create-intent
 *
 * TODO: Integrate with actual payment gateway (Stripe, PayPal, etc.)
 */
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bookingId, amount, currency, paymentMethod } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Validation
    if (!bookingId || !amount || !currency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bookingId, amount, currency'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or access denied'
      });
    }

    // TODO: Create actual payment intent with payment gateway
    // For Stripe:
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // Convert to cents
    //   currency: currency.toLowerCase(),
    //   metadata: { bookingId, userId }
    // });

    // Mock payment intent response
    const mockPaymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
      amount,
      currency,
      status: 'requires_payment_method',
      bookingId,
      createdAt: new Date()
    };

    logger.info(`Payment intent created for booking ${bookingId}, amount: ${amount} ${currency}`);

    res.status(201).json({
      success: true,
      data: mockPaymentIntent,
      message: 'Payment intent created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent'
    });
  }
};

/**
 * Process payment
 * POST /api/payment/process
 *
 * TODO: Integrate with actual payment gateway
 */
export const processPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { paymentIntentId, paymentMethodId, bookingId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!paymentIntentId || !bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: paymentIntentId, bookingId'
      });
    }

    // Verify booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // TODO: Confirm payment with payment gateway
    // For Stripe:
    // const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
    //   payment_method: paymentMethodId
    // });

    // Update booking status to paid
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'confirmed',
        paymentStatus: 'paid',
        updatedAt: new Date()
      }
    });

    logger.info(`Payment processed successfully for booking ${bookingId}`);

    res.json({
      success: true,
      data: {
        bookingId,
        paymentStatus: 'paid',
        status: 'confirmed'
      },
      message: 'Payment processed successfully'
    });
  } catch (error: any) {
    logger.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: 'Payment processing failed'
    });
  }
};

/**
 * Get payment status
 * GET /api/payment/status/:bookingId
 */
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        totalPrice: true,
        currency: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    logger.error('Error fetching payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment status'
    });
  }
};

/**
 * Request refund
 * POST /api/payment/refund
 *
 * TODO: Integrate with actual payment gateway refund API
 */
export const requestRefund = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bookingId, reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: bookingId'
      });
    }

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if already refunded
    if (booking.paymentStatus === 'refunded') {
      return res.status(400).json({
        success: false,
        error: 'Booking already refunded'
      });
    }

    // Check if booking is paid
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Cannot refund unpaid booking'
      });
    }

    // TODO: Process refund with payment gateway
    // For Stripe:
    // const refund = await stripe.refunds.create({
    //   payment_intent: booking.paymentIntentId,
    //   reason: 'requested_by_customer'
    // });

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
        paymentStatus: 'refunded',
        updatedAt: new Date()
      }
    });

    logger.info(`Refund requested for booking ${bookingId}, reason: ${reason || 'N/A'}`);

    res.json({
      success: true,
      data: {
        bookingId,
        paymentStatus: 'refunded',
        status: 'cancelled'
      },
      message: 'Refund processed successfully'
    });
  } catch (error: any) {
    logger.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: 'Refund processing failed'
    });
  }
};

/**
 * Webhook handler for payment gateway events
 * POST /api/payment/webhook
 *
 * TODO: Implement signature verification and event handling
 * For Stripe webhook signature verification:
 * const sig = req.headers['stripe-signature'];
 * const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
 */
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    // TODO: Verify webhook signature
    // TODO: Handle different event types:
    // - payment_intent.succeeded
    // - payment_intent.payment_failed
    // - charge.refunded
    // - etc.

    const event = req.body;

    logger.info(`Webhook received: ${event.type || 'unknown'}`);

    // Mock webhook handling
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Update booking to paid
        logger.info('Payment succeeded webhook received');
        break;
      case 'payment_intent.payment_failed':
        // Update booking to failed
        logger.info('Payment failed webhook received');
        break;
      case 'charge.refunded':
        // Update booking to refunded
        logger.info('Refund webhook received');
        break;
      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }

    // Always return 200 to acknowledge receipt
    res.json({ received: true });
  } catch (error: any) {
    logger.error('Error handling webhook:', error);
    res.status(400).json({
      success: false,
      error: 'Webhook handling failed'
    });
  }
};
