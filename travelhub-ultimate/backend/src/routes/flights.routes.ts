import express from 'express';
import * as flightsController from '../controllers/flights.controller.js';
import * as flightValidators from '../validators/flight.validators.js';
import { validate } from '../middleware/validation.middleware.js';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Search flights
// GET /api/flights/search?origin=MOW&destination=LED&departDate=2025-12-25
router.get(
  '/search',
  rateLimiters.moderate,
  flightValidators.flightSearchValidator,
  validate,
  flightsController.searchFlights
);

// Multi-city flight search
// POST /api/flights/multi-city
router.post(
  '/multi-city',
  rateLimiters.moderate,
  flightValidators.multiCityFlightValidator,
  validate,
  flightsController.searchMultiCity
);

// Compare flights
// GET /api/flights/compare?flightIds=1,2,3&compareBy=price,duration
router.get(
  '/compare',
  rateLimiters.moderate,
  flightValidators.flightComparisonValidator,
  validate,
  flightsController.compareFlights
);

// Price prediction
// GET /api/flights/price-prediction?origin=JFK&destination=LAX&date=2025-12-25
router.get(
  '/price-prediction',
  rateLimiters.moderate,
  flightValidators.pricePredictionValidator,
  validate,
  flightsController.getPricePrediction
);

// Calculate baggage fees
// POST /api/flights/baggage
router.post(
  '/baggage',
  rateLimiters.moderate,
  flightValidators.baggageCalculatorValidator,
  validate,
  flightsController.calculateBaggage
);

// Get seat map
// GET /api/flights/:flightId/seat-map
router.get(
  '/:flightId/seat-map',
  rateLimiters.moderate,
  flightsController.getSeatMap
);

// Select seats
// POST /api/flights/select-seats
router.post(
  '/select-seats',
  authenticate,
  rateLimiters.moderate,
  flightValidators.seatSelectionValidator,
  validate,
  flightsController.selectSeats
);

// Search flexible dates
// GET /api/flights/flexible-dates?origin=JFK&destination=LAX&baseDate=2025-12-25&flexDays=3
router.get(
  '/flexible-dates',
  rateLimiters.moderate,
  flightValidators.flexibleDatesValidator,
  validate,
  flightsController.searchFlexibleDates
);

// Get flight status
// GET /api/flights/status?flightNumber=AA123&date=2025-12-25
router.get(
  '/status',
  rateLimiters.moderate,
  flightValidators.flightStatusValidator,
  validate,
  flightsController.getFlightStatus
);

// Get flight details
// GET /api/flights/:id
router.get(
  '/:id',
  rateLimiters.lenient,
  flightsController.getFlightDetails
);

// Get popular destinations
// GET /api/flights/popular/destinations
router.get(
  '/popular/destinations',
  rateLimiters.veryLenient,
  flightsController.getPopularDestinations
);

export default router;
