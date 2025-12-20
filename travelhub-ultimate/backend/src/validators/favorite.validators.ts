import { body, query, param } from 'express-validator';

/**
 * Favorite Validators
 * Validation rules for favorites endpoints
 */

/**
 * Get favorites validation
 */
export const getFavoritesValidator = [
  query('type')
    .optional()
    .isIn(['hotel', 'flight', 'car'])
    .withMessage('Type must be one of: hotel, flight, car'),
];

/**
 * Add favorite validation
 */
export const addFavoriteValidator = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['hotel', 'flight', 'car'])
    .withMessage('Type must be one of: hotel, flight, car'),

  body('itemId')
    .notEmpty()
    .withMessage('Item ID is required')
    .isString()
    .withMessage('Item ID must be a string'),

  body('itemData')
    .optional()
    .isObject()
    .withMessage('Item data must be an object'),

  body('itemData.name')
    .optional()
    .isString()
    .withMessage('Item name must be a string'),

  body('itemData.location')
    .optional()
    .isString()
    .withMessage('Item location must be a string'),

  body('itemData.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Item price must be a positive number'),

  body('itemData.rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Item rating must be between 0 and 5'),
];

/**
 * Remove favorite validation
 */
export const removeFavoriteValidator = [
  param('id')
    .notEmpty()
    .withMessage('Favorite ID is required')
    .isString()
    .withMessage('Favorite ID must be a string'),
];

/**
 * Check favorite validation
 */
export const checkFavoriteValidator = [
  param('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['hotel', 'flight', 'car'])
    .withMessage('Type must be one of: hotel, flight, car'),

  param('itemId')
    .notEmpty()
    .withMessage('Item ID is required')
    .isString()
    .withMessage('Item ID must be a string'),
];
