import express from 'express';

const router = express.Router();

// TODO: Import when controllers/middleware are created
// import * as bookingsController from '../controllers/bookings.controller';
// import { authenticate } from '../middleware/auth.middleware';

// All routes require authentication
// TODO: Uncomment when auth middleware is ready
// router.use(authenticate);

// Get user's bookings
router.get('/', async (req, res) => {
  // TODO: Implement bookingsController.getBookings
  res.status(501).json({
    success: false,
    message: 'Get bookings endpoint - implementation pending',
    data: []
  });
});

// Get single booking
router.get('/:id', async (req, res) => {
  // TODO: Implement bookingsController.getBooking
  res.status(501).json({
    success: false,
    message: 'Get booking endpoint - implementation pending'
  });
});

// Create booking
router.post('/', async (req, res) => {
  // TODO: Implement bookingsController.createBooking
  res.status(501).json({
    success: false,
    message: 'Create booking endpoint - implementation pending'
  });
});

// Update booking status
router.patch('/:id/status', async (req, res) => {
  // TODO: Implement bookingsController.updateBookingStatus
  res.status(501).json({
    success: false,
    message: 'Update booking status endpoint - implementation pending'
  });
});

// Cancel booking
router.delete('/:id', async (req, res) => {
  // TODO: Implement bookingsController.cancelBooking
  res.status(501).json({
    success: false,
    message: 'Cancel booking endpoint - implementation pending'
  });
});

export default router;
