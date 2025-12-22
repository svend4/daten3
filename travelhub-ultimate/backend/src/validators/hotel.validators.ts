import { body, query, param } from 'express-validator';

/**
 * Hotel Search Validator
 * Validates hotel search parameters
 */
export const hotelSearchValidator = [
  query('destination')
    .notEmpty()
    .withMessage('Destination is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Destination must be between 2 and 100 characters'),

  query('checkIn')
    .notEmpty()
    .withMessage('Check-in date is required')
    .isISO8601()
    .withMessage('Check-in date must be in ISO 8601 format (YYYY-MM-DD)')
    .custom((value) => {
      const checkIn = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkIn < today) {
        throw new Error('Check-in date cannot be in the past');
      }
      return true;
    }),

  query('checkOut')
    .notEmpty()
    .withMessage('Check-out date is required')
    .isISO8601()
    .withMessage('Check-out date must be in ISO 8601 format (YYYY-MM-DD)')
    .custom((value, { req }) => {
      const checkIn = new Date(req.query?.checkIn as string);
      const checkOut = new Date(value);

      if (checkOut <= checkIn) {
        throw new Error('Check-out date must be after check-in date');
      }

      // Max 30 days stay
      const daysDiff = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 30) {
        throw new Error('Maximum stay is 30 days');
      }

      return true;
    }),

  query('adults')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Adults must be between 1 and 10')
    .toInt(),

  query('children')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Children must be between 0 and 10')
    .toInt(),

  query('rooms')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rooms must be between 1 and 5')
    .toInt(),

  query('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'RUB'])
    .withMessage('Currency must be USD, EUR, GBP, or RUB'),
];

/**
 * Hotel Autocomplete Validator
 */
export const hotelAutocompleteValidator = [
  query('query')
    .notEmpty()
    .withMessage('Search query is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Query must be between 2 and 100 characters'),

  query('locale')
    .optional()
    .isIn(['en', 'ru', 'de', 'fr', 'es'])
    .withMessage('Locale must be en, ru, de, fr, or es'),
];

/**
 * Hotel Details Validator
 */
export const hotelDetailsValidator = [
  param('id')
    .notEmpty()
    .withMessage('Hotel ID is required')
    .isString()
    .withMessage('Hotel ID must be a string'),
];
