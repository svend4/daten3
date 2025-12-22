import express from 'express';
import * as hotelsController from '../controllers/hotels.controller.js';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  hotelSearchValidator,
  hotelAutocompleteValidator,
  hotelDetailsValidator,
} from '../validators/hotel.validators.js';

const router = express.Router();

/**
 * @route   GET /api/hotels/search
 * @desc    Search for hotels
 * @access  Public
 * @params  destination, checkIn, checkOut, adults, children, rooms, currency
 */
router.get(
  '/search',
  rateLimiters.moderate, // 100 requests per 15 minutes
  hotelSearchValidator,
  validate,
  hotelsController.searchHotels
);

/**
 * @route   GET /api/hotels/autocomplete
 * @desc    Autocomplete for city/hotel search
 * @access  Public
 * @params  query, locale
 */
router.get(
  '/autocomplete',
  rateLimiters.lenient, // 200 requests per 15 minutes
  hotelAutocompleteValidator,
  validate,
  hotelsController.autocompleteHotels
);

/**
 * @route   GET /api/hotels/:id
 * @desc    Get hotel details by ID
 * @access  Public
 */
router.get(
  '/:id',
  rateLimiters.lenient,
  hotelDetailsValidator,
  validate,
  hotelsController.getHotelDetails
);

export default router;
