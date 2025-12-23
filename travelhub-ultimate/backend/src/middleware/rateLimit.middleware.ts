import rateLimit from 'express-rate-limit';
// import RedisStore from 'rate-limit-redis'; // TODO: Install rate-limit-redis package
import { Request, Response } from 'express';
import { redisService } from '../services/redis.service.js';
import logger from '../utils/logger.js';

/**
 * IP Whitelist for rate limiting bypass
 * Can be configured via environment variable
 */
const getWhitelistedIPs = (): string[] => {
  const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',').map(ip => ip.trim()) || [];
  return [
    ...whitelist,
    '127.0.0.1',        // localhost
    '::1',              // localhost IPv6
    '::ffff:127.0.0.1', // localhost IPv4-mapped IPv6
  ];
};

/**
 * Create rate limiter middleware with Redis store for distributed systems
 */
function createRateLimiter(maxRequests: number, windowSeconds: number, options: any = {}) {
  const redisClient = redisService.getClient();

  const limiterConfig: any = {
    // Time window
    windowMs: windowSeconds * 1000,
    max: maxRequests,

    // TODO: Use Redis store for distributed rate limiting (requires rate-limit-redis package)
    // ...(redisClient && {
    //   store: new RedisStore({
    //     // @ts-ignore - RedisStore types are compatible
    //     client: redisClient,
    //     prefix: 'rl:',
    //     sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    //   }),
    // }),

    // Use standard headers
    standardHeaders: true,
    legacyHeaders: false,

    // Message when limit exceeded
    message: {
      success: false,
      error: 'Too many requests',
      message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowSeconds} seconds.`,
      retryAfter: windowSeconds,
    },

    // Handler for rate limit exceeded
    handler: (req: Request, res: Response) => {
      const userInfo = (req as any).user?.id || 'anonymous';

      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userId: userInfo,
        limit: maxRequests,
        window: `${windowSeconds}s`,
        userAgent: req.headers['user-agent'],
      });

      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${windowSeconds} seconds.`,
        retryAfter: windowSeconds,
      });
    },

    // Skip certain conditions
    skip: (req: Request) => {
      // Skip health check endpoints
      if (
        req.path === '/health' ||
        req.path === '/api/health' ||
        req.path.startsWith('/health/') ||
        req.path.startsWith('/api/health/')
      ) {
        return true;
      }

      // Skip whitelisted IPs
      const whitelistedIPs = getWhitelistedIPs();
      if (req.ip && whitelistedIPs.includes(req.ip)) {
        logger.debug('Rate limit bypassed for whitelisted IP', { ip: req.ip });
        return true;
      }

      // Skip admin users (if authenticated)
      if ((req as any).user?.role === 'admin') {
        logger.debug('Rate limit bypassed for admin user', { userId: (req as any).user.id });
        return true;
      }

      return false;
    },

    // Key generator for identifying users
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise IP
      const userId = (req as any).user?.id;
      const key = userId ? `user:${userId}` : `ip:${req.ip || 'unknown'}`;
      return key;
    },

    ...options,
  };

  const limiter = rateLimit(limiterConfig);

  // Log Redis store status
  if (redisClient) {
    logger.info('Rate limiter using Redis store for distributed limiting');
  } else {
    logger.warn('Rate limiter using in-memory store (not suitable for multi-server deployments)');
  }

  return limiter;
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  // Very Strict - for critical operations (5 per minute)
  veryStrict: createRateLimiter(5, 60),

  // Strict - for resource-intensive operations (10 per minute)
  strict: createRateLimiter(10, 60),

  // Moderate - for normal API requests (30 per minute)
  moderate: createRateLimiter(30, 60),

  // Lenient - for light operations (60 per minute)
  lenient: createRateLimiter(60, 60),

  // Very lenient - for static data (120 per minute)
  veryLenient: createRateLimiter(120, 60),
};

/**
 * Custom rate limiter for authentication endpoints
 * More restrictive to prevent brute force attacks
 */
export const authRateLimiter = createRateLimiter(5, 900, {
  // 5 requests per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful auth attempts
  skipFailedRequests: false, // Count failed attempts
});

/**
 * Custom rate limiter for password reset
 * Very restrictive to prevent abuse
 */
export const passwordResetRateLimiter = createRateLimiter(3, 3600, {
  // 3 requests per hour
  message: {
    success: false,
    error: 'Too many password reset requests',
    message: 'Maximum 3 password reset requests per hour. Please try again later.',
    retryAfter: 3600,
  },
});

/**
 * Custom rate limiter for search endpoints
 * Moderate limits to balance UX and resource protection
 */
export const searchRateLimiter = createRateLimiter(20, 60, {
  // 20 searches per minute
  message: {
    success: false,
    error: 'Too many search requests',
    message: 'Please slow down your search requests. Maximum 20 searches per minute.',
    retryAfter: 60,
  },
});

export default createRateLimiter;
