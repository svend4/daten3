import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Error metrics tracking
 */
const errorMetrics = {
  total: 0,
  byType: new Map<string, number>(),
  byEndpoint: new Map<string, number>(),
  byStatusCode: new Map<number, number>(),
};

/**
 * Custom Error Class
 * Extends Error with statusCode, isOperational, and metadata properties
 */
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Get error metrics
 */
export const getErrorMetrics = () => {
  return {
    total: errorMetrics.total,
    byType: Object.fromEntries(errorMetrics.byType),
    byEndpoint: Object.fromEntries(errorMetrics.byEndpoint),
    byStatusCode: Object.fromEntries(errorMetrics.byStatusCode),
  };
};

/**
 * Reset error metrics
 */
export const resetErrorMetrics = () => {
  errorMetrics.total = 0;
  errorMetrics.byType.clear();
  errorMetrics.byEndpoint.clear();
  errorMetrics.byStatusCode.clear();
};

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
 * Sanitize request data for logging (remove sensitive fields)
 */
const sanitizeForLogging = (data: any): any => {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization', 'cookie'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
};

/**
 * Global Error Handler
 * Centralized error handling for all errors
 * Enhanced with comprehensive logging, error type detection, and metrics
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip if headers already sent (prevents "Cannot set headers after they are sent" error)
  if (res.headersSent) {
    logger.warn('Headers already sent, cannot send error response', {
      url: req.url,
      method: req.method,
      error: err.message,
    });
    // Don't call next(err) as this is the final error handler
    // Calling next(err) here would throw an uncaught exception
    return;
  }

  err.statusCode = err.statusCode || err.status || 500;
  err.status = err.status || 'error';

  // Track error metrics
  errorMetrics.total++;
  errorMetrics.byType.set(err.name || 'Unknown', (errorMetrics.byType.get(err.name) || 0) + 1);
  errorMetrics.byEndpoint.set(req.path, (errorMetrics.byEndpoint.get(req.path) || 0) + 1);
  errorMetrics.byStatusCode.set(err.statusCode, (errorMetrics.byStatusCode.get(err.statusCode) || 0) + 1);

  // Log error with winston logger (sanitized)
  logger.error('Error occurred', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
    statusCode: err.statusCode,
    name: err.name,
    code: err.code,
    body: sanitizeForLogging(req.body),
    query: sanitizeForLogging(req.query),
    userAgent: req.headers['user-agent'],
  });

  // Handle specific error types
  let error = err;

  // Validation errors (express-validator, Zod)
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }

  if (err.name === 'ZodError') {
    error = handleZodError(err);
  }

  // Unauthorized errors
  if (err.name === 'UnauthorizedError') {
    error = new AppError('Authentication required or token invalid', 401, 'UNAUTHORIZED');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Network/Timeout errors
  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
    error = new AppError('External API request timed out', 504, 'TIMEOUT');
  }

  if (err.code === 'ECONNREFUSED') {
    error = new AppError('External service unavailable', 503, 'SERVICE_UNAVAILABLE');
  }

  if (err.code === 'ENOTFOUND') {
    error = new AppError('External service not found', 503, 'DNS_ERROR');
  }

  // Axios errors (from external API calls)
  if (err.isAxiosError) {
    error = handleAxiosError(err);
  }

  // Rate limit errors
  if (err.statusCode === 429 || err.message?.includes('Too many requests')) {
    error = new AppError('Too many requests. Please slow down and try again later.', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File size exceeds the maximum allowed limit', 413, 'FILE_TOO_LARGE');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new AppError('Invalid file type or unexpected file field', 400, 'INVALID_FILE_TYPE');
  }

  // Prisma/DB errors
  if (err.code === 'P2002') {
    error = handleDuplicateFieldsError(err);
  }

  if (err.code === 'P2025') {
    error = new AppError('Record not found', 404, 'RECORD_NOT_FOUND');
  }

  if (err.code === 'P2003') {
    error = handleForeignKeyError(err);
  }

  if (err.code === 'P2016') {
    error = new AppError('Query interpretation error. Invalid query parameters.', 400, 'QUERY_ERROR');
  }

  if (err.code === 'P2021') {
    error = new AppError('Database table does not exist', 500, 'DATABASE_ERROR');
  }

  if (err.code === 'P2024') {
    error = new AppError('Database connection timeout', 504, 'DATABASE_TIMEOUT');
  }

  // CORS errors
  if (err.message?.includes('CORS') || err.message?.includes('Not allowed by CORS')) {
    error = new AppError('CORS policy: Origin not allowed', 403, 'CORS_ERROR');
  }

  // Payment errors
  if (err.type === 'StripeCardError' || err.type === 'card_error') {
    error = new AppError(err.message || 'Payment card error', 402, 'PAYMENT_ERROR');
  }

  // Production error response
  if (process.env.NODE_ENV === 'production') {
    // Operational, trusted error: send message to client
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        status: error.status,
        error: error.message,
        ...(error.code && { code: error.code }),
        ...(error.details && { details: error.details }),
      });
    } else {
      // Programming or unknown error: don't leak error details
      logger.error('Unexpected non-operational error', {
        error: err,
        stack: err.stack,
      });

      // TODO: Send to error tracking service (Sentry, Rollbar, etc.)
      // if (process.env.SENTRY_DSN) {
      //   Sentry.captureException(err);
      // }

      res.status(500).json({
        success: false,
        status: 'error',
        error: 'Something went wrong. Please try again later.',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  } else {
    // Development error response (detailed)
    res.status(error.statusCode).json({
      success: false,
      status: error.status,
      error: error.message,
      code: error.code || 'ERROR',
      stack: error.stack,
      details: error.details || err.details,
      originalError: {
        name: err.name,
        message: err.message,
        code: err.code,
      },
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
  return new AppError('Invalid token. Please login again.', 401, 'JWT_INVALID');
};

export const handleJWTExpiredError = (): AppError => {
  return new AppError('Your session has expired. Please login again.', 401, 'JWT_EXPIRED');
};

/**
 * Handle Zod Validation Errors
 */
export const handleZodError = (err: any): AppError => {
  const errors = err.errors || err.issues || [];
  const details = errors.map((e: any) => ({
    field: e.path?.join('.') || 'unknown',
    message: e.message,
    code: e.code,
  }));

  const message = `Validation failed: ${errors.map((e: any) => e.message).join(', ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR', details);
};

/**
 * Handle Axios HTTP Errors (from external API calls)
 */
export const handleAxiosError = (err: any): AppError => {
  const status = err.response?.status || 500;
  const message = err.response?.data?.message || err.response?.data?.error || err.message || 'External API request failed';

  // Map external API errors to appropriate status codes
  if (status === 401 || status === 403) {
    return new AppError('External API authentication failed', 502, 'EXTERNAL_AUTH_ERROR');
  }

  if (status === 404) {
    return new AppError('External API resource not found', 502, 'EXTERNAL_NOT_FOUND');
  }

  if (status === 429) {
    return new AppError('External API rate limit exceeded', 503, 'EXTERNAL_RATE_LIMIT');
  }

  if (status >= 500) {
    return new AppError('External API server error', 502, 'EXTERNAL_SERVER_ERROR');
  }

  return new AppError(`External API error: ${message}`, 502, 'EXTERNAL_API_ERROR', {
    status,
    url: err.config?.url,
    method: err.config?.method,
  });
};

/**
 * Handle Prisma Foreign Key Errors
 */
export const handleForeignKeyError = (err: any): AppError => {
  const meta = err.meta || {};
  const field = meta.field_name || 'related resource';
  const message = `Foreign key constraint failed: ${field} does not exist`;
  return new AppError(message, 400, 'FOREIGN_KEY_ERROR', { field });
};
