import express from 'express';
import * as currencyController from '../controllers/currency.controller.js';
import { rateLimiters } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

/**
 * Currency Routes
 * All routes are public (no authentication required)
 */

// Get exchange rates
router.get('/rates', rateLimiters.lenient, currencyController.getExchangeRates);

// Convert currency
router.post('/convert', rateLimiters.moderate, currencyController.convertCurrency);

// Batch conversion
router.post('/convert/batch', rateLimiters.moderate, currencyController.convertBatch);

// Get supported currencies
router.get('/supported', rateLimiters.lenient, currencyController.getSupportedCurrencies);

// Get currency info
router.get('/info/:code', rateLimiters.lenient, currencyController.getCurrencyInfo);

export default router;
