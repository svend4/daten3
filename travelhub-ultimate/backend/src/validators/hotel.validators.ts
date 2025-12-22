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

/**
 * Advanced Hotel Search Filters Validator
 * Validates extended filter parameters
 */
export const hotelAdvancedFiltersValidator = [
  // Price range
  query('priceMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number')
    .toFloat(),

  query('priceMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number')
    .toFloat()
    .custom((value, { req }) => {
      const min = parseFloat(req.query?.priceMin as string);
      if (min && value < min) {
        throw new Error('Maximum price must be greater than minimum price');
      }
      return true;
    }),

  // Star rating (1-5)
  query('starRating')
    .optional()
    .custom((value) => {
      const ratings = Array.isArray(value) ? value : [value];
      const validRatings = ratings.every((r: any) => {
        const num = parseInt(r);
        return num >= 1 && num <= 5;
      });
      if (!validRatings) {
        throw new Error('Star rating must be between 1 and 5');
      }
      return true;
    }),

  // Guest rating (0-10)
  query('guestRatingMin')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Guest rating must be between 0 and 10')
    .toFloat(),

  query('guestRatingMax')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Guest rating must be between 0 and 10')
    .toFloat(),

  // Distance from center (km)
  query('distanceMax')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('Distance must be between 0 and 50 km')
    .toFloat(),

  // Amenities (comma-separated)
  query('amenities')
    .optional()
    .custom((value) => {
      const validAmenities = [
        'wifi', 'pool', 'parking', 'gym', 'restaurant', 'bar', 'spa',
        'room_service', 'air_conditioning', 'breakfast', 'pet_friendly',
        'business_center', 'conference_rooms', 'laundry', 'airport_shuttle',
        'beach_access', 'kids_club', 'concierge'
      ];

      const amenities = typeof value === 'string' ? value.split(',') : value;
      const invalid = amenities.filter((a: string) => !validAmenities.includes(a.trim()));

      if (invalid.length > 0) {
        throw new Error(`Invalid amenities: ${invalid.join(', ')}`);
      }
      return true;
    }),

  // Property types
  query('propertyTypes')
    .optional()
    .custom((value) => {
      const validTypes = [
        'hotel', 'resort', 'apartment', 'hostel', 'guesthouse',
        'villa', 'bed_and_breakfast', 'boutique'
      ];

      const types = typeof value === 'string' ? value.split(',') : value;
      const invalid = types.filter((t: string) => !validTypes.includes(t.trim()));

      if (invalid.length > 0) {
        throw new Error(`Invalid property types: ${invalid.join(', ')}`);
      }
      return true;
    }),

  // Policies
  query('freeCancellation')
    .optional()
    .isBoolean()
    .withMessage('freeCancellation must be a boolean')
    .toBoolean(),

  query('payAtHotel')
    .optional()
    .isBoolean()
    .withMessage('payAtHotel must be a boolean')
    .toBoolean(),

  query('instantConfirmation')
    .optional()
    .isBoolean()
    .withMessage('instantConfirmation must be a boolean')
    .toBoolean(),

  // Meal plans
  query('mealPlans')
    .optional()
    .custom((value) => {
      const validPlans = [
        'room_only', 'breakfast', 'half_board', 'full_board', 'all_inclusive'
      ];

      const plans = typeof value === 'string' ? value.split(',') : value;
      const invalid = plans.filter((p: string) => !validPlans.includes(p.trim()));

      if (invalid.length > 0) {
        throw new Error(`Invalid meal plans: ${invalid.join(', ')}`);
      }
      return true;
    }),

  // Special offers
  query('dealsOnly')
    .optional()
    .isBoolean()
    .withMessage('dealsOnly must be a boolean')
    .toBoolean(),

  query('lastMinuteDeals')
    .optional()
    .isBoolean()
    .withMessage('lastMinuteDeals must be a boolean')
    .toBoolean(),

  // Accessibility
  query('wheelchairAccessible')
    .optional()
    .isBoolean()
    .withMessage('wheelchairAccessible must be a boolean')
    .toBoolean(),

  // Sorting
  query('sortBy')
    .optional()
    .isIn(['price', 'rating', 'distance', 'popularity', 'stars'])
    .withMessage('sortBy must be price, rating, distance, popularity, or stars'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc'),

  // Pagination
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];
