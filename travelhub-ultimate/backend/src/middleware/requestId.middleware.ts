/**
 * Request ID Middleware
 * Assigns a unique ID to each request for tracking and correlation
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Request ID header name
 */
export const REQUEST_ID_HEADER = 'X-Request-Id';

/**
 * Add request ID to Express Request type
 */
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Generate a unique request ID
 * Uses UUID v4 for guaranteed uniqueness
 */
const generateRequestId = (): string => {
  return randomUUID();
};

/**
 * Request ID middleware
 * Adds a unique ID to each request for correlation and tracking
 *
 * Features:
 * - Uses existing X-Request-Id header if present (for distributed tracing)
 * - Generates new UUID if no header present
 * - Attaches ID to request object for use in logs
 * - Adds ID to response headers for client tracking
 * - Enables request correlation across microservices
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if request already has an ID (from upstream proxy/load balancer)
  const existingId = req.headers[REQUEST_ID_HEADER.toLowerCase()] as string;

  // Use existing ID or generate new one
  const requestId = existingId || generateRequestId();

  // Attach to request object
  req.id = requestId;

  // Add to response headers
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
};

/**
 * Get request ID from request object
 */
export const getRequestId = (req: Request): string | undefined => {
  return req.id;
};

/**
 * Format for logging
 * Returns request ID with prefix for easy identification in logs
 */
export const formatRequestId = (req: Request): string => {
  const id = getRequestId(req);
  return id ? `[${id.slice(0, 8)}]` : '[no-id]';
};

export default requestIdMiddleware;
