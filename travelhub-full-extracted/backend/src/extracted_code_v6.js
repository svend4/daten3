const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookings.controller');
const { authenticate } = require('../middleware/auth.middleware');

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

module.exports = router;
