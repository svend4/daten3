import { body, query, param } from 'express-validator';

/**
 * Booking Validators
 * Validation rules for booking endpoints
 */

/**
 * Create booking validation
 */
export const createBookingValidator = [
  body('type')
    .notEmpty()
    .withMessage('Booking type is required')
    .isIn(['hotel', 'flight', 'car'])
    .withMessage('Type must be one of: hotel, flight, car'),

  body('itemId')
    .notEmpty()
    .withMessage('Item ID is required')
    .isString()
    .withMessage('Item ID must be a string'),

  body('checkIn')
    .optional()
    .isISO8601()
    .withMessage('Check-in date must be a valid date (ISO 8601)')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    })
    .withMessage('Check-in date must be today or in the future'),

  body('checkOut')
    .optional()
    .isISO8601()
    .withMessage('Check-out date must be a valid date (ISO 8601)')
    .custom((value, { req }) => {
      if (!req.body.checkIn) return true;
      const checkIn = new Date(req.body.checkIn);
      const checkOut = new Date(value);
      return checkOut > checkIn;
    })
    .withMessage('Check-out date must be after check-in date'),

  body('guests')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Guests must be between 1 and 20'),

  body('rooms')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Rooms must be between 1 and 10'),

  body('totalAmount')
    .notEmpty()
    .withMessage('Total amount is required')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),

  body('currency')
    .optional()
    .isISO4217()
    .withMessage('Currency must be a valid ISO 4217 code (e.g., USD, EUR)'),

  body('paymentMethod')
    .optional()
    .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer'])
    .withMessage('Invalid payment method'),

  body('referralCode')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 6, max: 20 })
    .withMessage('Referral code must be between 6 and 20 characters'),
];

/**
 * Get bookings validation (query params)
 */
export const getBookingsValidator = [
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Status must be one of: pending, confirmed, cancelled, completed'),

  query('type')
    .optional()
    .isIn(['hotel', 'flight', 'car'])
    .withMessage('Type must be one of: hotel, flight, car'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Get single booking validation
 */
export const getBookingValidator = [
  param('id')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isString()
    .withMessage('Booking ID must be a string'),
];

/**
 * Update booking status validation
 */
export const updateBookingStatusValidator = [
  param('id')
    .notEmpty()
    .withMessage('Booking ID is required'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Status must be one of: pending, confirmed, cancelled, completed'),
];

/**
 * Cancel booking validation
 */
export const cancelBookingValidator = [
  param('id')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isString()
    .withMessage('Booking ID must be a string'),
];
