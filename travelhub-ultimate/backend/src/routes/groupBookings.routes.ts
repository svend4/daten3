/**
 * Group Bookings Routes
 */

import express from 'express';
import * as groupBookingsController from '../controllers/groupBookings.controller.js';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create group booking
router.post('/', rateLimiters.strict, groupBookingsController.createGroupBooking);

// Get group booking
router.get('/:id', rateLimiters.moderate, groupBookingsController.getGroupBooking);

// Get group booking summary
router.get('/:id/summary', rateLimiters.moderate, groupBookingsController.getGroupBookingSummary);

// Add participant
router.post('/:id/participants', rateLimiters.moderate, groupBookingsController.addParticipant);

// Process split payment
router.post('/:id/pay', rateLimiters.strict, groupBookingsController.processSplitPayment);

export default router;
