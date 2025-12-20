import { Request, Response, NextFunction } from 'express';

/**
 * Custom Error Class
 * Extends Error with statusCode and isOperational properties
 */
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Handler
 * Handles 404 errors for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    404
  );
  next(error);
};

/**
 * Global Error Handler
 * Centralized error handling for all errors
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ ERROR:', {
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method
    });
  }

  // Production error response
  if (process.env.NODE_ENV === 'production') {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        status: err.status,
        error: err.message
      });
    } else {
      // Programming or unknown error: don't leak error details
      console.error('💥 UNEXPECTED ERROR:', err);

      res.status(500).json({
        success: false,
        status: 'error',
        error: 'Something went wrong. Please try again later.'
      });
    }
  } else {
    // Development error response (detailed)
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err.message,
      stack: err.stack,
      details: {
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle Mongoose/Prisma Validation Errors
 */
export const handleValidationError = (err: any): AppError => {
  const errors = Object.values(err.errors || {}).map((e: any) => e.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose/Prisma Cast Errors (Invalid ID)
 */
export const handleCastError = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle Duplicate Field Errors
 */
export const handleDuplicateFieldsError = (err: any): AppError => {
  const field = Object.keys(err.keyValue || {})[0];
  const message = `Duplicate field value: ${field}. Please use another value.`;
  return new AppError(message, 400);
};

/**
 * Handle JWT Errors
 */
export const handleJWTError = (): AppError => {
  return new AppError('Invalid token. Please login again.', 401);
};

export const handleJWTExpiredError = (): AppError => {
  return new AppError('Your session has expired. Please login again.', 401);
};
