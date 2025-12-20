import express from 'express';
import * as bookingsController from '../controllers/bookings.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createBookingValidator,
  getBookingsValidator,
  getBookingValidator,
  updateBookingStatusValidator,
  cancelBookingValidator,
} from '../validators/booking.validators';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's bookings
router.get('/', getBookingsValidator, validate, bookingsController.getBookings);

// Get single booking
router.get('/:id', getBookingValidator, validate, bookingsController.getBooking);

// Create booking
router.post('/', createBookingValidator, validate, bookingsController.createBooking);

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
