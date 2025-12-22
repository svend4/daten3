import express from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { rateLimiters } from '../middleware/rateLimit.middleware';

const router = express.Router();

/**
 * Payment Routes
 *
 * All routes except webhook require authentication
 */

// Create payment intent
router.post(
  '/create-intent',
  authenticate,
  rateLimiters.moderate,
  paymentController.createPaymentIntent
);

// Process payment
router.post(
  '/process',
  authenticate,
  rateLimiters.moderate,
  paymentController.processPayment
);

// Get payment status
router.get(
  '/status/:bookingId',
  authenticate,
  rateLimiters.lenient,
  paymentController.getPaymentStatus
);

// Request refund
router.post(
  '/refund',
  authenticate,
  rateLimiters.moderate,
  paymentController.requestRefund
);

// Webhook endpoint (no auth, verified by signature)
router.post(
  '/webhook',
  rateLimiters.lenient,
  paymentController.handleWebhook
);

export default router;
