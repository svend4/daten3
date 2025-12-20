import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './errorHandler.middleware';

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
