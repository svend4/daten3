/**
 * APM Middleware
 * Automatically tracks HTTP requests as transactions
 */

import { Request, Response, NextFunction } from 'express';
import { apmService } from '../services/apm.service.js';
import logger from '../utils/logger.js';

/**
 * Extend Express Request to include APM transaction ID
 */
declare global {
  namespace Express {
    interface Request {
      apmTransactionId?: string;
    }
  }
}

/**
 * APM Middleware
 * Tracks each HTTP request as a transaction
 */
export const apmMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Start transaction
  const transactionId = apmService.startTransaction(
    `${req.method} ${req.path}`,
    'request',
    {
      method: req.method,
      route: req.path,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      correlationId: req.id,
    }
  );

  // Store transaction ID in request
  req.apmTransactionId = transactionId;

  // Track response
  res.on('finish', () => {
    apmService.endTransaction(
      transactionId,
      res.statusCode >= 400 ? 'error' : 'success',
      {
        statusCode: res.statusCode,
        contentLength: res.get('content-length'),
      }
    );
  });

  next();
};

/**
 * Database query tracking helper
 */
export const trackDatabaseQuery = async <T>(
  req: Request,
  operation: string,
  table: string,
  query: () => Promise<T>
): Promise<T> => {
  const spanId = apmService.startSpan(
    req.apmTransactionId || '',
    `db.${operation}`,
    'db',
    { operation, table }
  );

  try {
    const result = await query();
    apmService.endSpan(req.apmTransactionId || '', spanId, { status: 'success' });
    return result;
  } catch (error: any) {
    apmService.endSpan(req.apmTransactionId || '', spanId, {
      status: 'error',
      error: error.message,
    });
    throw error;
  }
};

/**
 * External API call tracking helper
 */
export const trackExternalApiCall = async <T>(
  req: Request,
  apiName: string,
  call: () => Promise<T>
): Promise<T> => {
  const spanId = apmService.startSpan(
    req.apmTransactionId || '',
    `external.${apiName}`,
    'external',
    { api: apiName }
  );

  try {
    const result = await call();
    apmService.endSpan(req.apmTransactionId || '', spanId, { status: 'success' });
    return result;
  } catch (error: any) {
    apmService.endSpan(req.apmTransactionId || '', spanId, {
      status: 'error',
      error: error.message,
    });
    throw error;
  }
};

/**
 * Cache operation tracking helper
 */
export const trackCacheOperation = async <T>(
  req: Request,
  operation: string,
  cacheName: string,
  cacheOp: () => Promise<T>
): Promise<T> => {
  const spanId = apmService.startSpan(
    req.apmTransactionId || '',
    `cache.${operation}`,
    'cache',
    { operation, cacheName }
  );

  try {
    const result = await cacheOp();
    apmService.endSpan(req.apmTransactionId || '', spanId, { status: 'success' });
    return result;
  } catch (error: any) {
    apmService.endSpan(req.apmTransactionId || '', spanId, {
      status: 'error',
      error: error.message,
    });
    throw error;
  }
};

export default apmMiddleware;
