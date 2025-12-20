import express from 'express';
import * as bookingsController from '../controllers/bookings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's bookings
router.get('/', bookingsController.getBookings);

// Get single booking
router.get('/:id', bookingsController.getBooking);

// Create booking
router.post('/', bookingsController.createBooking);

// Update booking status
router.patch('/:id/status', bookingsController.updateBookingStatus);

// Cancel booking
router.delete('/:id', bookingsController.cancelBooking);

export default router;
