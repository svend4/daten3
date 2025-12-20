import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Create rate limiter middleware
 */
function createRateLimiter(maxRequests: number, windowSeconds: number, options: any = {}) {
  const limiter = rateLimit({
    // Time window
    windowMs: windowSeconds * 1000,
    max: maxRequests,

    // Use standard headers
    standardHeaders: true,
    legacyHeaders: false,

    // Message when limit exceeded
    message: {
      success: false,
      error: 'Too many requests',
      message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowSeconds} seconds.`,
      retryAfter: windowSeconds
    },

    // Handler for rate limit exceeded
    handler: (req: Request, res: Response) => {
      console.warn('⚠️  Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        limit: maxRequests,
        window: windowSeconds
      });

      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${windowSeconds} seconds.`,
        retryAfter: windowSeconds
      });
    },

    // Skip certain conditions
    skip: (req: Request) => {
      // Skip health check
      if (req.path === '/health' || req.path === '/api/health') {
        return true;
      }

      // Skip whitelisted IPs (if configured)
      const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
      if (req.ip && whitelist.includes(req.ip)) {
        return true;
      }

      return false;
    },

    // Key generator for identifying users
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise IP
      return (req as any).user?.id || req.ip || 'unknown';
    },

    ...options
  });

  return limiter;
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  // Strict - for resource-intensive operations
  strict: createRateLimiter(5, 60),

  // Moderate - for normal API requests
  moderate: createRateLimiter(20, 60),

  // Lenient - for light operations
  lenient: createRateLimiter(50, 60),

  // Very lenient - for static data
  veryLenient: createRateLimiter(100, 60)
};

export default createRateLimiter;
