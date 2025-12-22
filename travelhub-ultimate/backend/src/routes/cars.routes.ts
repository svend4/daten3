/**
 * Car Rental Routes
 * Handles car rental search and affiliate link generation
 */

import express from 'express';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';
import {
  searchCarRentals,
  getPopularLocations
} from '../controllers/carRental.controller.js';

const router = express.Router();

/**
 * @route   GET /api/cars/search
 * @desc    Search for car rentals (generates affiliate links)
 * @access  Public
 * @query   pickupLocation, dropoffLocation?, pickupDate, pickupTime?, dropoffDate, dropoffTime?, driverAge?, currency?, language?
 * @example /api/cars/search?pickupLocation=12345&pickupDate=2025-12-01&dropoffDate=2025-12-05&driverAge=30
 */
router.get('/search', rateLimiters.moderate, searchCarRentals);

/**
 * @route   GET /api/cars/popular/locations
 * @desc    Get popular car rental locations
 * @access  Public
 */
router.get('/popular/locations', rateLimiters.lenient, getPopularLocations);

export default router;
