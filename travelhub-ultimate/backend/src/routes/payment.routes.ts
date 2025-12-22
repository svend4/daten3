import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';

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
