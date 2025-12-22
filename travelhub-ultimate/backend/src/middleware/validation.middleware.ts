import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { z, ZodError, ZodSchema } from 'zod';
import { AppError } from './errorHandler.middleware.js';

/**
 * Validation Middleware
 * Checks for validation errors from express-validator
 */
export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
    }));

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errorMessages,
    });
    return;
  }

  next();
};

/**
 * Create validation middleware from validation chains
 * Automatically runs validation and handles errors
 */
export const createValidator = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
      }));

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errorMessages,
      });
      return;
    }

    next();
  };
};

/**
 * Sanitize request body
 * Removes undefined, null, and empty strings
 */
export const sanitizeBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach((key) => {
      if (
        req.body[key] === undefined ||
        req.body[key] === null ||
        req.body[key] === ''
      ) {
        delete req.body[key];
      }
    });
  }
  next();
};

// ============================================
// ZOD-BASED VALIDATION (Type-safe)
// ============================================

/**
 * Common validation schemas
 */
export const emailSchema = z.string().email('Invalid email address').min(1, 'Email is required');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Auth schemas
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: emailSchema,
  password: passwordSchema,
  phone: z.string().optional(),
});

/**
 * Booking schemas
 */
export const createBookingSchema = z.object({
  hotelId: z.string().min(1, 'Hotel ID is required'),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  guests: z.number().int().min(1, 'At least 1 guest required').max(20, 'Maximum 20 guests'),
  rooms: z.number().int().min(1, 'At least 1 room required').max(10, 'Maximum 10 rooms'),
  specialRequests: z.string().max(500, 'Special requests too long').optional(),
});

/**
 * Validation middleware factory using Zod
 * Creates middleware that validates request body against a Zod schema
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate and parse request body
      const validated = await schema.parseAsync(req.body);

      // Replace request body with validated data (removes extra fields)
      req.body = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'Invalid request data',
          errors,
        });
        return;
      }

      // Unknown error
      console.error('❌ Validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during validation',
      });
    }
  };
}

/**
 * Validate request params (for URL parameters)
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'Invalid URL parameters',
          errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}

/**
 * Common param schemas
 */
export const idParamSchema = z.object({
  id: uuidSchema,
});

export const bookingIdParamSchema = z.object({
  bookingId: uuidSchema,
});
