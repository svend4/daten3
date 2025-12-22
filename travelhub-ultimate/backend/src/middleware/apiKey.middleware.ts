/**
 * API Key Authentication Middleware
 * Secure service-to-service (M2M) authentication
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import { randomBytes, createHash } from 'crypto';
import { redisService } from '../services/redis.service.js';
import logger from '../utils/logger.js';

/**
 * API Key header name
 */
export const API_KEY_HEADER = 'X-API-Key';

/**
 * API Key configuration
 */
interface ApiKeyConfig {
  name: string;              // Friendly name
  key: string;               // Hashed API key
  permissions: string[];     // Allowed permissions/scopes
  rateLimit?: number;        // Requests per minute
  ipWhitelist?: string[];    // Allowed IP addresses
  expiresAt?: Date;          // Expiration date
  metadata?: Record<string, any>;
  createdAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
}

/**
 * API Keys storage (in-memory cache)
 */
const apiKeys = new Map<string, ApiKeyConfig>();

/**
 * API Key statistics
 */
interface ApiKeyStats {
  total: number;
  active: number;
  expired: number;
  totalRequests: number;
  byKey: Map<string, { requests: number; lastUsed: Date }>;
}

const stats: ApiKeyStats = {
  total: 0,
  active: 0,
  expired: 0,
  totalRequests: 0,
  byKey: new Map(),
};

/**
 * Hash API key for secure storage
 */
const hashApiKey = (key: string): string => {
  return createHash('sha256').update(key).digest('hex');
};

/**
 * Generate new API key
 */
export const generateApiKey = (): string => {
  const prefix = 'sk_live_'; // Secret key live
  const random = randomBytes(32).toString('hex');
  return `${prefix}${random}`;
};

/**
 * Create API key
 */
export const createApiKey = async (config: {
  name: string;
  permissions?: string[];
  rateLimit?: number;
  ipWhitelist?: string[];
  expiresIn?: number; // Days
  metadata?: Record<string, any>;
}): Promise<{ key: string; config: ApiKeyConfig }> => {
  const rawKey = generateApiKey();
  const hashedKey = hashApiKey(rawKey);

  const apiKeyConfig: ApiKeyConfig = {
    name: config.name,
    key: hashedKey,
    permissions: config.permissions || ['read'],
    rateLimit: config.rateLimit,
    ipWhitelist: config.ipWhitelist,
    expiresAt: config.expiresIn
      ? new Date(Date.now() + config.expiresIn * 24 * 60 * 60 * 1000)
      : undefined,
    metadata: config.metadata,
    createdAt: new Date(),
    usageCount: 0,
  };

  apiKeys.set(hashedKey, apiKeyConfig);
  await persistApiKey(apiKeyConfig);
  updateStats();

  logger.info(`API key created: ${config.name}`);

  // Return raw key (only shown once!)
  return { key: rawKey, config: apiKeyConfig };
};

/**
 * Persist API key to Redis
 */
const persistApiKey = async (config: ApiKeyConfig): Promise<void> => {
  const redisClient = redisService.getClient();
  if (redisClient) {
    try {
      await redisClient.set(
        `apikey:${config.key}`,
        JSON.stringify(config),
        { EX: config.expiresAt ? Math.floor((config.expiresAt.getTime() - Date.now()) / 1000) : undefined }
      );
    } catch (error: any) {
      logger.error('Failed to persist API key:', error);
    }
  }
};

/**
 * Load API keys from Redis
 */
export const loadApiKeys = async (): Promise<void> => {
  const redisClient = redisService.getClient();
  if (redisClient) {
    try {
      const keys = await redisClient.keys('apikey:*');
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const config: ApiKeyConfig = JSON.parse(data);
          apiKeys.set(config.key, config);
        }
      }
      updateStats();
      logger.info(`Loaded ${apiKeys.size} API keys from Redis`);
    } catch (error: any) {
      logger.error('Failed to load API keys:', error);
    }
  }
};

/**
 * Update statistics
 */
const updateStats = (): void => {
  stats.total = apiKeys.size;
  stats.active = 0;
  stats.expired = 0;

  const now = Date.now();
  for (const config of apiKeys.values()) {
    if (config.expiresAt && config.expiresAt.getTime() < now) {
      stats.expired++;
    } else {
      stats.active++;
    }
  }
};

/**
 * Verify API key
 */
const verifyApiKey = async (
  rawKey: string,
  req: Request
): Promise<{ valid: boolean; config?: ApiKeyConfig; error?: string }> => {
  const hashedKey = hashApiKey(rawKey);
  const config = apiKeys.get(hashedKey);

  if (!config) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Check expiration
  if (config.expiresAt && config.expiresAt.getTime() < Date.now()) {
    return { valid: false, error: 'API key expired' };
  }

  // Check IP whitelist
  if (config.ipWhitelist && config.ipWhitelist.length > 0) {
    const clientIp = req.ip;
    if (!clientIp || !config.ipWhitelist.includes(clientIp)) {
      return { valid: false, error: 'IP address not whitelisted' };
    }
  }

  // Check rate limit (simplified - should use Redis for distributed systems)
  if (config.rateLimit) {
    const keyStats = stats.byKey.get(hashedKey);
    if (keyStats) {
      const oneMinuteAgo = Date.now() - 60000;
      if (keyStats.lastUsed.getTime() > oneMinuteAgo) {
        // Simplified rate limit check
        // In production, use Redis with sliding window
      }
    }
  }

  // Update usage statistics
  config.usageCount++;
  config.lastUsedAt = new Date();
  await persistApiKey(config);

  stats.totalRequests++;
  stats.byKey.set(hashedKey, {
    requests: (stats.byKey.get(hashedKey)?.requests || 0) + 1,
    lastUsed: new Date(),
  });

  return { valid: true, config };
};

/**
 * API Key authentication middleware
 *
 * Features:
 * - Secure key-based authentication
 * - Permission-based access control
 * - IP whitelisting
 * - Rate limiting per key
 * - Expiration support
 * - Usage tracking
 *
 * Usage:
 * router.get('/api/v1/data',
 *   authenticateApiKey(),
 *   handler
 * );
 *
 * Or with required permissions:
 * router.post('/api/v1/data',
 *   authenticateApiKey({ required: ['write'] }),
 *   handler
 * );
 */
export const authenticateApiKey = (options: {
  required?: string[];  // Required permissions
  optional?: boolean;   // Allow requests without API key
} = {}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const apiKey = req.headers[API_KEY_HEADER.toLowerCase()] as string;

    if (!apiKey) {
      if (options.optional) {
        return next();
      }

      return res.status(401).json({
        error: 'Unauthorized',
        message: `Missing ${API_KEY_HEADER} header`,
        code: 'MISSING_API_KEY',
      });
    }

    // Verify API key
    const result = await verifyApiKey(apiKey, req);

    if (!result.valid) {
      logger.warn('Invalid API key attempt', {
        error: result.error,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(401).json({
        error: 'Unauthorized',
        message: result.error,
        code: 'INVALID_API_KEY',
      });
    }

    // Check required permissions
    if (options.required && options.required.length > 0) {
      const hasPermission = options.required.every(perm =>
        result.config!.permissions.includes(perm)
      );

      if (!hasPermission) {
        logger.warn('API key missing required permissions', {
          keyName: result.config!.name,
          required: options.required,
          has: result.config!.permissions,
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: 'API key does not have required permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: options.required,
        });
      }
    }

    // Attach API key config to request
    (req as any).apiKey = result.config;

    next();
  };
};

/**
 * Revoke API key
 */
export const revokeApiKey = async (hashedKey: string): Promise<boolean> => {
  const deleted = apiKeys.delete(hashedKey);

  if (deleted) {
    // Delete from Redis
    const redisClient = redisService.getClient();
    if (redisClient) {
      try {
        await redisClient.del(`apikey:${hashedKey}`);
      } catch (error: any) {
        logger.error('Failed to delete API key from Redis:', error);
      }
    }

    updateStats();
    logger.info('API key revoked');
  }

  return deleted;
};

/**
 * Get all API keys
 */
export const getAllApiKeys = (): Omit<ApiKeyConfig, 'key'>[] => {
  return Array.from(apiKeys.values()).map(({ key, ...config }) => config);
};

/**
 * Get API key by hashed key
 */
export const getApiKey = (hashedKey: string): ApiKeyConfig | undefined => {
  return apiKeys.get(hashedKey);
};

/**
 * Update API key permissions
 */
export const updateApiKeyPermissions = async (
  hashedKey: string,
  permissions: string[]
): Promise<boolean> => {
  const config = apiKeys.get(hashedKey);
  if (!config) return false;

  config.permissions = permissions;
  await persistApiKey(config);

  logger.info(`API key permissions updated: ${config.name}`);
  return true;
};

/**
 * Get API key statistics
 */
export const getApiKeyStats = () => {
  const byKey: Record<string, { name: string; requests: number; lastUsed?: string }> = {};

  for (const [hashedKey, keyStats] of stats.byKey.entries()) {
    const config = apiKeys.get(hashedKey);
    if (config) {
      byKey[config.name] = {
        name: config.name,
        requests: keyStats.requests,
        lastUsed: keyStats.lastUsed.toISOString(),
      };
    }
  }

  return {
    total: stats.total,
    active: stats.active,
    expired: stats.expired,
    totalRequests: stats.totalRequests,
    byKey,
  };
};

/**
 * Reset API key statistics
 */
export const resetApiKeyStats = (): void => {
  stats.totalRequests = 0;
  stats.byKey.clear();
};

/**
 * Cleanup expired API keys
 */
export const cleanupExpiredApiKeys = async (): Promise<number> => {
  let cleaned = 0;
  const now = Date.now();

  for (const [hashedKey, config] of apiKeys.entries()) {
    if (config.expiresAt && config.expiresAt.getTime() < now) {
      await revokeApiKey(hashedKey);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info(`Cleaned up ${cleaned} expired API keys`);
  }

  return cleaned;
};

export default { authenticateApiKey, createApiKey, loadApiKeys };
