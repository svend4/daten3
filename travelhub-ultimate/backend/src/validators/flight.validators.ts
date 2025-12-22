import { body, query, param } from 'express-validator';

/**
 * Basic Flight Search Validator
 */
export const flightSearchValidator = [
  query('origin')
    .notEmpty()
    .withMessage('Origin is required')
    .isLength({ min: 3, max: 3 })
    .withMessage('Origin must be a 3-letter IATA code')
    .toUpperCase(),

  query('destination')
    .notEmpty()
    .withMessage('Destination is required')
    .isLength({ min: 3, max: 3 })
    .withMessage('Destination must be a 3-letter IATA code')
    .toUpperCase(),

  query('departDate')
    .notEmpty()
    .withMessage('Departure date is required')
    .isISO8601()
    .withMessage('Departure date must be in ISO 8601 format (YYYY-MM-DD)')
    .custom((value) => {
      const departDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (departDate < today) {
        throw new Error('Departure date cannot be in the past');
      }
      return true;
    }),

  query('returnDate')
    .optional()
    .isISO8601()
    .withMessage('Return date must be in ISO 8601 format')
    .custom((value, { req }) => {
      if (value) {
        const departDate = new Date(req.query?.departDate as string);
        const returnDate = new Date(value);
        if (returnDate <= departDate) {
          throw new Error('Return date must be after departure date');
        }
      }
      return true;
    }),

  query('adults')
    .optional()
    .isInt({ min: 1, max: 9 })
    .withMessage('Adults must be between 1 and 9')
    .toInt(),

  query('children')
    .optional()
    .isInt({ min: 0, max: 8 })
    .withMessage('Children must be between 0 and 8')
    .toInt(),

  query('infants')
    .optional()
    .isInt({ min: 0, max: 4 })
    .withMessage('Infants must be between 0 and 4')
    .toInt(),

  query('cabinClass')
    .optional()
    .isIn(['economy', 'premium_economy', 'business', 'first'])
    .withMessage('Invalid cabin class'),

  query('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'RUB'])
    .withMessage('Currency must be USD, EUR, GBP, or RUB'),
];

/**
 * Multi-City Flight Validator
 */
export const multiCityFlightValidator = [
  body('legs')
    .isArray({ min: 2, max: 6 })
    .withMessage('Must have 2-6 flight legs'),

  body('legs.*.origin')
    .notEmpty()
    .isLength({ min: 3, max: 3 })
    .withMessage('Each leg must have a valid origin IATA code'),

  body('legs.*.destination')
    .notEmpty()
    .isLength({ min: 3, max: 3 })
    .withMessage('Each leg must have a valid destination IATA code'),

  body('legs.*.departDate')
    .notEmpty()
    .isISO8601()
    .withMessage('Each leg must have a valid departure date'),

  body('adults')
    .optional()
    .isInt({ min: 1, max: 9 })
    .toInt(),

  body('children')
    .optional()
    .isInt({ min: 0, max: 8 })
    .toInt(),

  body('infants')
    .optional()
    .isInt({ min: 0, max: 4 })
    .toInt(),

  body('cabinClass')
    .optional()
    .isIn(['economy', 'premium_economy', 'business', 'first']),

  // Custom validation: legs must be in chronological order
  body('legs').custom((legs: any[]) => {
    for (let i = 1; i < legs.length; i++) {
      const prevDate = new Date(legs[i - 1].departDate);
      const currDate = new Date(legs[i].departDate);
      if (currDate < prevDate) {
        throw new Error('Flight legs must be in chronological order');
      }
      // Also check that destination of previous leg matches origin of next
      if (legs[i - 1].destination !== legs[i].origin) {
        throw new Error(`Leg ${i}: origin must match previous destination`);
      }
    }
    return true;
  }),
];

/**
 * Flight Comparison Validator
 */
export const flightComparisonValidator = [
  query('flightIds')
    .notEmpty()
    .withMessage('Flight IDs are required')
    .custom((value) => {
      const ids = typeof value === 'string' ? value.split(',') : value;
      if (!Array.isArray(ids) || ids.length < 2 || ids.length > 5) {
        throw new Error('Must compare 2-5 flights');
      }
      return true;
    }),

  query('compareBy')
    .optional()
    .custom((value) => {
      const validFields = ['price', 'duration', 'stops', 'departure', 'arrival', 'airline'];
      const fields = typeof value === 'string' ? value.split(',') : value || [];
      const invalid = fields.filter((f: string) => !validFields.includes(f));
      if (invalid.length > 0) {
        throw new Error(`Invalid comparison fields: ${invalid.join(', ')}`);
      }
      return true;
    }),
];

/**
 * Price Prediction Validator
 */
export const pricePredictionValidator = [
  query('origin')
    .notEmpty()
    .isLength({ min: 3, max: 3 })
    .withMessage('Origin must be a 3-letter IATA code'),

  query('destination')
    .notEmpty()
    .isLength({ min: 3, max: 3 })
    .withMessage('Destination must be a 3-letter IATA code'),

  query('date')
    .notEmpty()
    .isISO8601()
    .withMessage('Date must be in ISO 8601 format')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 365); // Max 1 year ahead

      if (date < today) {
        throw new Error('Date cannot be in the past');
      }
      if (date > maxDate) {
        throw new Error('Price prediction not available more than 1 year ahead');
      }
      return true;
    }),
];

/**
 * Baggage Calculator Validator
 */
export const baggageCalculatorValidator = [
  body('flightId')
    .notEmpty()
    .withMessage('Flight ID is required'),

  body('airline')
    .notEmpty()
    .isLength({ min: 2, max: 3 })
    .withMessage('Airline code is required (2-3 letters)'),

  body('cabinClass')
    .notEmpty()
    .isIn(['economy', 'premium_economy', 'business', 'first'])
    .withMessage('Invalid cabin class'),

  body('route.origin')
    .notEmpty()
    .isLength({ min: 3, max: 3 })
    .withMessage('Origin must be a 3-letter IATA code'),

  body('route.destination')
    .notEmpty()
    .isLength({ min: 3, max: 3 })
    .withMessage('Destination must be a 3-letter IATA code'),

  body('bags.carryOn')
    .isInt({ min: 0, max: 3 })
    .withMessage('Carry-on bags must be 0-3')
    .toInt(),

  body('bags.checked')
    .isInt({ min: 0, max: 5 })
    .withMessage('Checked bags must be 0-5')
    .toInt(),

  body('bags.specialItems')
    .optional()
    .isArray()
    .withMessage('Special items must be an array'),
];

/**
 * Seat Selection Validator
 */
export const seatSelectionValidator = [
  body('flightId')
    .notEmpty()
    .withMessage('Flight ID is required'),

  body('bookingId')
    .notEmpty()
    .withMessage('Booking ID is required'),

  body('passengers')
    .isArray({ min: 1 })
    .withMessage('At least one passenger is required'),

  body('passengers.*.passengerId')
    .notEmpty()
    .withMessage('Passenger ID is required'),

  body('passengers.*.seat.row')
    .isInt({ min: 1, max: 100 })
    .withMessage('Seat row must be 1-100')
    .toInt(),

  body('passengers.*.seat.column')
    .notEmpty()
    .isIn(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'])
    .withMessage('Invalid seat column'),
];

/**
 * Flexible Dates Validator
 */
export const flexibleDatesValidator = [
  query('origin')
    .notEmpty()
    .isLength({ min: 3, max: 3 })
    .withMessage('Origin must be a 3-letter IATA code'),

  query('destination')
    .notEmpty()
    .isLength({ min: 3, max: 3 })
    .withMessage('Destination must be a 3-letter IATA code'),

  query('baseDate')
    .notEmpty()
    .isISO8601()
    .withMessage('Base date must be in ISO 8601 format'),

  query('flexDays')
    .isInt({ min: 1, max: 14 })
    .withMessage('Flex days must be 1-14')
    .toInt(),

  query('returnBaseDate')
    .optional()
    .isISO8601()
    .withMessage('Return base date must be in ISO 8601 format'),

  query('returnFlexDays')
    .optional()
    .isInt({ min: 1, max: 14 })
    .toInt(),
];

/**
 * Flight Status Validator
 */
export const flightStatusValidator = [
  query('flightNumber')
    .notEmpty()
    .withMessage('Flight number is required')
    .matches(/^[A-Z]{2}\d{1,4}$/)
    .withMessage('Invalid flight number format (e.g., BA123)'),

  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in ISO 8601 format'),
];

/**
 * Advanced Flight Filters Validator
 */
export const flightAdvancedFiltersValidator = [
  // Price range
  query('priceMin')
    .optional()
    .isFloat({ min: 0 })
    .toFloat(),

  query('priceMax')
    .optional()
    .isFloat({ min: 0 })
    .toFloat(),

  // Stops
  query('maxStops')
    .optional()
    .isInt({ min: 0, max: 3 })
    .toInt(),

  query('directFlightsOnly')
    .optional()
    .isBoolean()
    .toBoolean(),

  // Airlines
  query('airlines')
    .optional()
    .custom((value) => {
      const airlines = typeof value === 'string' ? value.split(',') : value;
      // Validate airline codes (2-3 letters)
      const valid = airlines.every((a: string) => /^[A-Z]{2,3}$/.test(a.trim()));
      if (!valid) {
        throw new Error('Invalid airline codes');
      }
      return true;
    }),

  query('excludeAirlines')
    .optional()
    .custom((value) => {
      const airlines = typeof value === 'string' ? value.split(',') : value;
      const valid = airlines.every((a: string) => /^[A-Z]{2,3}$/.test(a.trim()));
      if (!valid) {
        throw new Error('Invalid airline codes');
      }
      return true;
    }),

  // Duration
  query('maxDuration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max duration must be positive')
    .toInt(),

  // Time filters
  query('departTimeFrom')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Departure time must be in HH:mm format'),

  query('departTimeTo')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Departure time must be in HH:mm format'),

  query('arriveTimeFrom')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Arrival time must be in HH:mm format'),

  query('arriveTimeTo')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Arrival time must be in HH:mm format'),

  // Policies
  query('refundable')
    .optional()
    .isBoolean()
    .toBoolean(),

  query('changeable')
    .optional()
    .isBoolean()
    .toBoolean(),

  query('checkedBagIncluded')
    .optional()
    .isBoolean()
    .toBoolean(),

  // Alliances
  query('alliances')
    .optional()
    .custom((value) => {
      const validAlliances = ['star_alliance', 'oneworld', 'skyteam'];
      const alliances = typeof value === 'string' ? value.split(',') : value;
      const invalid = alliances.filter((a: string) => !validAlliances.includes(a));
      if (invalid.length > 0) {
        throw new Error(`Invalid alliances: ${invalid.join(', ')}`);
      }
      return true;
    }),

  // Sorting
  query('sortBy')
    .optional()
    .isIn(['price', 'duration', 'departure', 'arrival', 'airline'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  // Pagination
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt(),
];
