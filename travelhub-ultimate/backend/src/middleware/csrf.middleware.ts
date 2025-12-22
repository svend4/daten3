/**
 * CSRF (Cross-Site Request Forgery) Protection Middleware
 * Protects against CSRF attacks on state-changing operations
 * Uses Redis for production, falls back to in-memory for development
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { redisService } from '../services/redis.service.js';

/**
 * CSRF token storage (fallback for when Redis is not available)
 * Maps session ID to CSRF token
 */
const csrfTokens = new Map<string, string>();

/**
 * Generate a CSRF token for a session
 */
export async function generateCSRFToken(sessionId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');

  // Try to store in Redis first
  if (redisService.isConnected()) {
    await redisService.setCSRFToken(sessionId, token);
  } else {
    // Fallback to in-memory storage
    csrfTokens.set(sessionId, token);
  }

  return token;
}

/**
 * Get session ID from request
 * Uses user ID from JWT token or generates temporary ID
 */
function getSessionId(req: Request): string {
  // If user is authenticated, use their ID as session ID
  if (req.user?.id) {
    return req.user.id;
  }

  // For unauthenticated requests, use IP + User-Agent as session ID
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  return crypto.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');
}

/**
 * CSRF Token Generation Endpoint Middleware
 * Generates and returns a CSRF token
 */
export const getCSRFToken = async (req: Request, res: Response): Promise<void> => {
  const sessionId = getSessionId(req);
  const token = await generateCSRFToken(sessionId);

  res.json({
    success: true,
    data: {
      csrfToken: token,
    },
  });
};

/**
 * CSRF Protection Middleware
 * Validates CSRF token on state-changing requests (POST, PUT, PATCH, DELETE)
 */
export const csrfProtection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Skip CSRF check for GET, HEAD, OPTIONS requests (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  // Get CSRF token from headers or body
  const csrfToken = req.headers['x-csrf-token'] as string || req.body.csrfToken;

  if (!csrfToken) {
    res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      message: 'CSRF token is required for this operation',
    });
    return;
  }

  // Verify token
  const sessionId = getSessionId(req);
  let storedToken: string | null = null;

  // Try to get from Redis first
  if (redisService.isConnected()) {
    storedToken = await redisService.getCSRFToken(sessionId);
  } else {
    // Fallback to in-memory storage
    storedToken = csrfTokens.get(sessionId) || null;
  }

  if (!storedToken || storedToken !== csrfToken) {
    res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      message: 'CSRF token is invalid or expired',
    });
    return;
  }

  // Token is valid, continue
  next();
};

/**
 * Optional CSRF Protection
 * Only validates if token is provided (for gradual migration)
 */
export const optionalCSRFProtection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const csrfToken = req.headers['x-csrf-token'] as string || req.body.csrfToken;

  // If no token provided, continue (optional mode)
  if (!csrfToken) {
    next();
    return;
  }

  // If token is provided, validate it
  const sessionId = getSessionId(req);
  let storedToken: string | null = null;

  // Try to get from Redis first
  if (redisService.isConnected()) {
    storedToken = await redisService.getCSRFToken(sessionId);
  } else {
    // Fallback to in-memory storage
    storedToken = csrfTokens.get(sessionId) || null;
  }

  if (!storedToken || storedToken !== csrfToken) {
    res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      message: 'CSRF token is invalid or expired',
    });
    return;
  }

  next();
};

/**
 * Clear CSRF token for a session (logout)
 */
export async function clearCSRFToken(sessionId: string): Promise<void> {
  // Clear from Redis
  if (redisService.isConnected()) {
    await redisService.deleteCSRFToken(sessionId);
  }

  // Clear from in-memory storage (if used as fallback)
  csrfTokens.delete(sessionId);
}

/**
 * Clean up expired tokens (call periodically)
 * In production, this would be handled by Redis TTL
 */
export function cleanupExpiredTokens(): void {
  // For now, just clear all tokens older than 24 hours
  // In production, use Redis with TTL or database with timestamps
  csrfTokens.clear();
}

// Clean up tokens every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
