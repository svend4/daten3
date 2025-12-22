import express from 'express';
import * as flightsController from '../controllers/flights.controller';
import { rateLimiters } from '../middleware/rateLimit.middleware';

const router = express.Router();

// Search flights
// GET /api/flights/search?origin=MOW&destination=LED&departDate=2025-12-25
router.get(
  '/search',
  rateLimiters.moderate, // 100 requests per 15 minutes
  flightsController.searchFlights
);

// Get flight details
// GET /api/flights/:id
router.get(
  '/:id',
  rateLimiters.lenient, // 200 requests per 15 minutes
  flightsController.getFlightDetails
);

// Get popular destinations
// GET /api/flights/popular/destinations
router.get(
  '/popular/destinations',
  rateLimiters.veryLenient, // 300 requests per 15 minutes
  flightsController.getPopularDestinations
);

export default router;
