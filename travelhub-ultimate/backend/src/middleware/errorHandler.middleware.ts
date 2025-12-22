import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

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
 * Enhanced with comprehensive logging and error type detection
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || err.status || 500;
  err.status = err.status || 'error';

  // Log error with winston logger
  logger.error('Error occurred', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
    statusCode: err.statusCode,
    name: err.name
  });

  // Handle specific error types
  let error = err;

  // Validation errors
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }

  // Unauthorized errors
  if (err.name === 'UnauthorizedError') {
    error = new AppError('Authentication required or token invalid', 401);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Timeout errors
  if (err.code === 'ETIMEDOUT') {
    error = new AppError('External API request timed out', 504);
  }

  // Prisma/DB errors
  if (err.code === 'P2002') {
    error = handleDuplicateFieldsError(err);
  }

  if (err.code === 'P2025') {
    error = new AppError('Record not found', 404);
  }

  // Production error response
  if (process.env.NODE_ENV === 'production') {
    // Operational, trusted error: send message to client
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        status: error.status,
        error: error.message
      });
    } else {
      // Programming or unknown error: don't leak error details
      logger.error('Unexpected non-operational error', {
        error: err,
        stack: err.stack
      });

      res.status(500).json({
        success: false,
        status: 'error',
        error: 'Something went wrong. Please try again later.'
      });
    }
  } else {
    // Development error response (detailed)
    res.status(error.statusCode).json({
      success: false,
      status: error.status,
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: err.details
      })
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
