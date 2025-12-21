/**
 * Per-User Rate Limiting Middleware
 * Enhanced rate limiting with per-user tracking and Redis support
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Create per-user rate limiter with separate limits for authenticated/unauthenticated users
 */
export function createPerUserRateLimiter(options: {
  authenticatedMax: number;
  unauthenticatedMax: number;
  windowSeconds: number;
  endpoint?: string;
}) {
  const { authenticatedMax, unauthenticatedMax, windowSeconds, endpoint } = options;

  return rateLimit({
    windowMs: windowSeconds * 1000,

    // Dynamic max based on authentication status
    max: (req: Request) => {
      const isAuthenticated = !!(req as any).user?.id;
      return isAuthenticated ? authenticatedMax : unauthenticatedMax;
    },

    standardHeaders: true,
    legacyHeaders: false,

    // Per-user key generation
    keyGenerator: (req: Request) => {
      const user = (req as any).user;
      if (user?.id) {
        return `user:${user.id}:${endpoint || req.path}`;
      }
      // For unauthenticated, use IP + User-Agent for better tracking
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const hash = Buffer.from(`${ip}:${userAgent}`).toString('base64').substring(0, 32);
      return `anon:${hash}:${endpoint || req.path}`;
    },

    handler: (req: Request, res: Response) => {
      const isAuthenticated = !!(req as any).user?.id;
      const max = isAuthenticated ? authenticatedMax : unauthenticatedMax;

      console.warn('⚠️  Per-user rate limit exceeded', {
        userId: (req as any).user?.id || 'anonymous',
        ip: req.ip,
        path: req.path,
        authenticated: isAuthenticated,
        limit: max,
        window: windowSeconds,
      });

      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: isAuthenticated
          ? `Rate limit exceeded. Maximum ${max} requests per ${windowSeconds} seconds.`
          : `Rate limit exceeded. Please login for higher limits or try again in ${windowSeconds} seconds.`,
        retryAfter: windowSeconds,
      });
    },

    skip: (req: Request) => {
      // Skip health checks
      if (req.path === '/health' || req.path === '/api/health') {
        return true;
      }
      return false;
    },
  });
}

/**
 * Pre-configured per-user rate limiters
 */
export const perUserRateLimiters = {
  /**
   * Authentication endpoints (login, register)
   * Very strict to prevent brute force
   */
  auth: createPerUserRateLimiter({
    authenticatedMax: 10,
    unauthenticatedMax: 5,
    windowSeconds: 300, // 5 minutes
    endpoint: 'auth',
  }),

  /**
   * Resource-intensive operations (bookings, payments)
   * Stricter for unauthenticated users
   */
  resourceIntensive: createPerUserRateLimiter({
    authenticatedMax: 20,
    unauthenticatedMax: 5,
    windowSeconds: 60,
    endpoint: 'resource',
  }),

  /**
   * Normal API operations (search, listings)
   */
  normal: createPerUserRateLimiter({
    authenticatedMax: 100,
    unauthenticatedMax: 30,
    windowSeconds: 60,
    endpoint: 'normal',
  }),

  /**
   * Read-only operations (favorites, profile)
   */
  readOnly: createPerUserRateLimiter({
    authenticatedMax: 200,
    unauthenticatedMax: 50,
    windowSeconds: 60,
    endpoint: 'read',
  }),
};

/**
 * Endpoint-specific rate limiters for critical operations
 */
export const endpointRateLimiters = {
  /**
   * Login endpoint - prevent credential stuffing
   */
  login: createPerUserRateLimiter({
    authenticatedMax: 5,
    unauthenticatedMax: 5,
    windowSeconds: 300, // 5 minutes
    endpoint: 'login',
  }),

  /**
   * Register endpoint - prevent spam accounts
   */
  register: createPerUserRateLimiter({
    authenticatedMax: 3,
    unauthenticatedMax: 3,
    windowSeconds: 3600, // 1 hour
    endpoint: 'register',
  }),

  /**
   * Password reset - prevent abuse
   */
  passwordReset: createPerUserRateLimiter({
    authenticatedMax: 3,
    unauthenticatedMax: 3,
    windowSeconds: 900, // 15 minutes
    endpoint: 'password-reset',
  }),

  /**
   * Email verification - prevent spam
   */
  emailVerification: createPerUserRateLimiter({
    authenticatedMax: 5,
    unauthenticatedMax: 3,
    windowSeconds: 600, // 10 minutes
    endpoint: 'email-verify',
  }),

  /**
   * Booking creation - prevent rapid duplicate bookings
   */
  createBooking: createPerUserRateLimiter({
    authenticatedMax: 10,
    unauthenticatedMax: 2,
    windowSeconds: 300, // 5 minutes
    endpoint: 'create-booking',
  }),
};

export default perUserRateLimiters;
