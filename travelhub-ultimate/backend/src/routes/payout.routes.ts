/**
 * Payout Routes
 */

import express from 'express';
import * as payoutController from '../controllers/payout.controller.js';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/admin.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User routes
router.post('/request', rateLimiters.strict, payoutController.requestPayout);
router.get('/balance', rateLimiters.moderate, payoutController.getAvailableBalance);
router.get('/', rateLimiters.moderate, payoutController.getUserPayouts);
router.get('/:id', rateLimiters.moderate, payoutController.getPayoutById);
router.post('/:id/cancel', rateLimiters.moderate, payoutController.cancelPayout);

// Admin routes
router.get(
  '/admin/all',
  requireRole(['admin']),
  rateLimiters.moderate,
  payoutController.getAllPayouts
);

router.post(
  '/admin/:id/approve',
  requireRole(['admin']),
  rateLimiters.strict,
  payoutController.approvePayout
);

router.post(
  '/admin/:id/reject',
  requireRole(['admin']),
  rateLimiters.strict,
  payoutController.rejectPayout
);

router.post(
  '/admin/:id/process',
  requireRole(['admin']),
  rateLimiters.strict,
  payoutController.processPayout
);

export default router;
