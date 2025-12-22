/**
 * Recommendations Routes
 */

import express from 'express';
import * as recommendationsController from '../controllers/recommendations.controller.js';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get personalized recommendations
router.get(
  '/',
  authenticate,
  rateLimiters.moderate,
  recommendationsController.getRecommendations
);

// Get similar hotels
router.get(
  '/similar/hotels/:hotelId',
  rateLimiters.moderate,
  recommendationsController.getSimilarHotels
);

// Get "customers also booked"
router.get(
  '/also-booked/:bookingId',
  rateLimiters.moderate,
  recommendationsController.getCustomersAlsoBooked
);

export default router;
