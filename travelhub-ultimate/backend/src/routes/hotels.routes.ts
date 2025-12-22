import express from 'express';
import * as hotelsController from '../controllers/hotels.controller.js';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  hotelSearchValidator,
  hotelAutocompleteValidator,
  hotelDetailsValidator,
  hotelAdvancedFiltersValidator,
} from '../validators/hotel.validators.js';

const router = express.Router();

/**
 * @route   GET /api/hotels/search
 * @desc    Search for hotels with advanced filters
 * @access  Public
 * @params  destination, checkIn, checkOut, adults, children, rooms, currency
 *          + Advanced filters: priceMin, priceMax, starRating, guestRatingMin, guestRatingMax,
 *            distanceMax, amenities, propertyTypes, freeCancellation, payAtHotel,
 *            mealPlans, dealsOnly, wheelchairAccessible, sortBy, sortOrder, page, limit
 */
router.get(
  '/search',
  rateLimiters.moderate, // 100 requests per 15 minutes
  [
    ...hotelSearchValidator,
    ...hotelAdvancedFiltersValidator,
  ],
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
