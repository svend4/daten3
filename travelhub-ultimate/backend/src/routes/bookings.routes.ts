import express from 'express';
import * as bookingsController from '../controllers/bookings.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { endpointRateLimiters, perUserRateLimiters } from '../middleware/perUserRateLimit.middleware.js';
import {
  createBookingValidator,
  getBookingsValidator,
  getBookingValidator,
  updateBookingStatusValidator,
  cancelBookingValidator,
} from '../validators/booking.validators.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's bookings
router.get('/', perUserRateLimiters.readOnly, getBookingsValidator, validate, bookingsController.getBookings);

// Get single booking
router.get('/:id', perUserRateLimiters.readOnly, getBookingValidator, validate, bookingsController.getBooking);

// Create booking - strict rate limit to prevent spam
router.post('/', endpointRateLimiters.createBooking, createBookingValidator, validate, bookingsController.createBooking);

// Update booking status
router.patch(
  '/:id/status',
  updateBookingStatusValidator,
  validate,
  bookingsController.updateBookingStatus
);

// Cancel booking
router.delete('/:id', cancelBookingValidator, validate, bookingsController.cancelBooking);

export default router;
