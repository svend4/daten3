/**
 * Tiered Rate Limiting Middleware
 * Different rate limits based on user tier/subscription
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { redisService } from '../services/redis.service.js';
import RedisStore from 'rate-limit-redis';
import logger from '../utils/logger.js';

/**
 * User tier levels
 */
export enum UserTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
  ADMIN = 'ADMIN',
}

/**
 * Rate limit configuration per tier
 */
interface TierRateLimitConfig {
  requests: number;       // Requests allowed
  windowMs: number;       // Time window in milliseconds
  message?: string;       // Custom error message
}

/**
 * Default rate limits by tier
 */
const DEFAULT_TIER_LIMITS: Record<UserTier, TierRateLimitConfig> = {
  [UserTier.FREE]: {
    requests: 100,
    windowMs: 60 * 60 * 1000, // 100 requests per hour
    message: 'Free tier rate limit exceeded. Upgrade to PRO for higher limits.',
  },
  [UserTier.BASIC]: {
    requests: 500,
    windowMs: 60 * 60 * 1000, // 500 requests per hour
    message: 'Basic tier rate limit exceeded. Upgrade to PRO for higher limits.',
  },
  [UserTier.PRO]: {
    requests: 5000,
    windowMs: 60 * 60 * 1000, // 5000 requests per hour
    message: 'PRO tier rate limit exceeded.',
  },
  [UserTier.ENTERPRISE]: {
    requests: 50000,
    windowMs: 60 * 60 * 1000, // 50000 requests per hour
    message: 'Enterprise tier rate limit exceeded.',
  },
  [UserTier.ADMIN]: {
    requests: 1000000,
    windowMs: 60 * 60 * 1000, // Unlimited (very high limit)
    message: 'Admin tier rate limit exceeded.',
  },
};

/**
 * Tiered rate limit statistics
 */
interface TieredRateLimitStats {
  total: number;
  limited: number;
  byTier: Map<UserTier, { requests: number; limited: number }>;
  byEndpoint: Map<string, { requests: number; limited: number }>;
}

const stats: TieredRateLimitStats = {
  total: 0,
  limited: 0,
  byTier: new Map(),
  byEndpoint: new Map(),
};

/**
 * Get user tier from request
 */
const getUserTier = (req: Request): UserTier => {
  const user = (req as any).user;

  if (!user) {
    return UserTier.FREE; // Anonymous users = free tier
  }

  // Check if admin
  if (user.role === 'admin') {
    return UserTier.ADMIN;
  }

  // Get tier from user subscription
  const tier = user.subscription?.tier || user.tier || 'FREE';

  return tier.toUpperCase() as UserTier;
};

/**
 * Update tier statistics
 */
const updateTierStats = (tier: UserTier, endpoint: string, limited: boolean): void => {
  // Global stats
  stats.total++;
  if (limited) stats.limited++;

  // Tier stats
  const tierStats = stats.byTier.get(tier) || { requests: 0, limited: 0 };
  tierStats.requests++;
  if (limited) tierStats.limited++;
  stats.byTier.set(tier, tierStats);

  // Endpoint stats
  const endpointStats = stats.byEndpoint.get(endpoint) || { requests: 0, limited: 0 };
  endpointStats.requests++;
  if (limited) endpointStats.limited++;
  stats.byEndpoint.set(endpoint, endpointStats);
};

/**
 * Create rate limiter for specific tier
 */
const createTierRateLimiter = (
  tier: UserTier,
  customConfig?: Partial<TierRateLimitConfig>
) => {
  const config = {
    ...DEFAULT_TIER_LIMITS[tier],
    ...customConfig,
  };

  const redisClient = redisService.getClient();

  return rateLimit({
    windowMs: config.windowMs,
    max: config.requests,
    message: {
      error: 'Rate limit exceeded',
      message: config.message,
      tier,
      limit: config.requests,
      window: `${config.windowMs / 1000}s`,
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...(redisClient && {
      store: new RedisStore({
        // @ts-ignore - RedisStore type definitions may vary
        client: redisClient,
        prefix: `tier_rl:${tier.toLowerCase()}:`,
        // universal wrapper: support node-redis v4 (sendCommand) and ioredis (call)
        // @ts-ignore
        sendCommand: (...args: string[]) => {
          const anyClient = redisClient as any;

          // node-redis v4 requires sendCommand to be called with an array
          if (typeof anyClient.sendCommand === 'function') {
            // node-redis v4: always use array format
            return anyClient.sendCommand(args);
          }

          // ioredis uses call method
          if (typeof anyClient.call === 'function') {
            // ioredis
            return anyClient.call(...args);
          }

          // Fallback for other clients
          if (typeof anyClient.send === 'function') {
            return anyClient.send(...args);
          }

          if (typeof anyClient.execute === 'function') {
            return anyClient.execute(...args);
          }

          throw new Error('Unsupported redis client: missing sendCommand/call/send/execute');
        },
      }),
    }),
    skip: (req: Request) => {
      // Don't rate limit admins
      const user = (req as any).user;
      return user?.role === 'admin';
    },
    keyGenerator: (req: Request) => {
      const user = (req as any).user;
      return user?.id || req.ip || 'anonymous';
    },
    handler: (req: Request, res: Response) => {
      const tier = getUserTier(req);
      const endpoint = `${req.method} ${req.path}`;

      updateTierStats(tier, endpoint, true);

      logger.warn('Tiered rate limit exceeded', {
        tier,
        userId: (req as any).user?.id,
        endpoint,
        limit: config.requests,
      });

      res.status(429).json({
        error: 'Rate limit exceeded',
        message: config.message,
        tier,
        limit: config.requests,
        window: `${config.windowMs / 1000}s`,
        code: 'RATE_LIMIT_EXCEEDED',
        upgradeUrl: '/pricing', // Link to upgrade page
      });
    },
  });
};

/**
 * Rate limiters by tier
 */
const tierLimiters = new Map<UserTier, any>();

// Initialize limiters
for (const tier of Object.values(UserTier)) {
  tierLimiters.set(tier, createTierRateLimiter(tier));
}

/**
 * Tiered rate limit middleware
 *
 * Features:
 * - Different limits for FREE, BASIC, PRO, ENTERPRISE, ADMIN
 * - Automatic tier detection from user subscription
 * - Redis-based distributed rate limiting
 * - Custom limits per endpoint
 * - Statistics tracking
 * - Upgrade prompts for free users
 *
 * Usage:
 * router.get('/api/search',
 *   tieredRateLimit(),
 *   handler
 * );
 *
 * Or with custom limits:
 * router.post('/api/upload',
 *   tieredRateLimit({
 *     [UserTier.FREE]: { requests: 10, windowMs: 3600000 },
 *     [UserTier.PRO]: { requests: 100, windowMs: 3600000 },
 *   }),
 *   handler
 * );
 */
export const tieredRateLimit = (
  customLimits?: Partial<Record<UserTier, Partial<TierRateLimitConfig>>>
) => {
  // Create custom limiters if provided
  const limiters = customLimits
    ? new Map(
        Object.entries(customLimits).map(([tier, config]) => [
          tier as UserTier,
          createTierRateLimiter(tier as UserTier, config),
        ])
      )
    : tierLimiters;

  return (req: Request, res: Response, next: NextFunction): void => {
    const tier = getUserTier(req);
    const limiter = limiters.get(tier) || tierLimiters.get(UserTier.FREE)!;

    const endpoint = `${req.method} ${req.path}`;
    updateTierStats(tier, endpoint, false);

    // Apply rate limiter
    limiter(req, res, next);
  };
};

/**
 * Get tier limits
 */
export const getTierLimits = (): Record<UserTier, TierRateLimitConfig> => {
  return DEFAULT_TIER_LIMITS;
};

/**
 * Get user's current tier and limits
 */
export const getUserTierInfo = (req: Request) => {
  const tier = getUserTier(req);
  const limits = DEFAULT_TIER_LIMITS[tier];

  return {
    tier,
    limits: {
      requests: limits.requests,
      window: `${limits.windowMs / 1000}s`,
      windowMs: limits.windowMs,
    },
  };
};

/**
 * Check if user can make request
 */
export const canMakeRequest = async (
  req: Request
): Promise<{ allowed: boolean; tier: UserTier; remaining?: number }> => {
  const tier = getUserTier(req);
  const config = DEFAULT_TIER_LIMITS[tier];

  // Simplified check - in production, query Redis
  // This is just for informational purposes

  return {
    allowed: true, // Actual check done by rate limiter
    tier,
  };
};

/**
 * Get tiered rate limit statistics
 */
export const getTieredRateLimitStats = () => {
  const byTier: Record<string, { requests: number; limited: number; limitRate: number }> = {};
  for (const [tier, tierStats] of stats.byTier.entries()) {
    byTier[tier] = {
      ...tierStats,
      limitRate: tierStats.requests > 0
        ? Math.round((tierStats.limited / tierStats.requests) * 100)
        : 0,
    };
  }

  const byEndpoint: Record<string, { requests: number; limited: number }> = {};
  for (const [endpoint, endpointStats] of stats.byEndpoint.entries()) {
    byEndpoint[endpoint] = endpointStats;
  }

  return {
    total: stats.total,
    limited: stats.limited,
    limitRate: stats.total > 0 ? Math.round((stats.limited / stats.total) * 100) : 0,
    byTier,
    byEndpoint,
    tiers: Object.entries(DEFAULT_TIER_LIMITS).map(([tier, config]) => ({
      tier,
      requests: config.requests,
      window: `${config.windowMs / 1000}s`,
    })),
  };
};

/**
 * Reset tiered rate limit statistics
 */
export const resetTieredRateLimitStats = (): void => {
  stats.total = 0;
  stats.limited = 0;
  stats.byTier.clear();
  stats.byEndpoint.clear();
};

/**
 * Update tier limits (hot reload)
 */
export const updateTierLimits = (
  tier: UserTier,
  config: Partial<TierRateLimitConfig>
): void => {
  Object.assign(DEFAULT_TIER_LIMITS[tier], config);
  tierLimiters.set(tier, createTierRateLimiter(tier));

  logger.info(`Rate limits updated for tier: ${tier}`);
};

export default tieredRateLimit;
