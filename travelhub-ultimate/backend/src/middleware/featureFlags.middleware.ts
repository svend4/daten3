/**
 * Feature Flags System
 * Dynamic feature toggling without deployment
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redis.service.js';
import logger from '../utils/logger.js';

/**
 * Feature flag configuration
 */
interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  enabledFor?: {
    users?: string[];          // Specific user IDs
    roles?: string[];          // Specific roles (admin, user, etc.)
    percentage?: number;       // Percentage rollout (0-100)
    environments?: string[];   // Specific environments (dev, staging, prod)
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Feature flags storage (in-memory cache)
 */
const featureFlags = new Map<string, FeatureFlag>();

/**
 * Feature flag statistics
 */
interface FeatureFlagStats {
  total: number;
  enabled: number;
  disabled: number;
  byFlag: Map<string, { checks: number; allowed: number; denied: number }>;
}

const stats: FeatureFlagStats = {
  total: 0,
  enabled: 0,
  disabled: 0,
  byFlag: new Map(),
};

/**
 * Default feature flags
 */
const DEFAULT_FLAGS: Partial<FeatureFlag>[] = [
  {
    name: 'new_dashboard',
    enabled: false,
    description: 'New dashboard UI',
  },
  {
    name: 'advanced_search',
    enabled: true,
    description: 'Advanced search functionality',
  },
  {
    name: 'payment_v2',
    enabled: false,
    description: 'New payment system',
    enabledFor: {
      roles: ['admin'],
      environments: ['development', 'staging'],
    },
  },
  {
    name: 'beta_features',
    enabled: false,
    description: 'Beta features for testing',
    enabledFor: {
      percentage: 10, // 10% rollout
    },
  },
];

/**
 * Initialize feature flags
 */
export const initializeFeatureFlags = async (): Promise<void> => {
  try {
    // Load from Redis if available
    const redisClient = redisService.getClient();
    if (redisClient) {
      const keys = await redisClient.keys('feature:*');
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const flag: FeatureFlag = JSON.parse(data);
          featureFlags.set(flag.name, flag);
        }
      }
    }

    // Add default flags if not exists
    for (const defaultFlag of DEFAULT_FLAGS) {
      if (!featureFlags.has(defaultFlag.name!)) {
        const flag: FeatureFlag = {
          name: defaultFlag.name!,
          enabled: defaultFlag.enabled || false,
          description: defaultFlag.description,
          enabledFor: defaultFlag.enabledFor,
          metadata: defaultFlag.metadata,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        featureFlags.set(flag.name, flag);
        await persistFlag(flag);
      }
    }

    // Update stats
    updateStats();

    logger.info(`Feature flags initialized: ${featureFlags.size} flags loaded`);
  } catch (error: any) {
    logger.error('Failed to initialize feature flags:', error);
  }
};

/**
 * Persist flag to Redis
 */
const persistFlag = async (flag: FeatureFlag): Promise<void> => {
  const redisClient = redisService.getClient();
  if (redisClient) {
    try {
      await redisClient.set(`feature:${flag.name}`, JSON.stringify(flag));
    } catch (error: any) {
      logger.error(`Failed to persist flag ${flag.name}:`, error);
    }
  }
};

/**
 * Update statistics
 */
const updateStats = (): void => {
  stats.total = featureFlags.size;
  stats.enabled = Array.from(featureFlags.values()).filter(f => f.enabled).length;
  stats.disabled = stats.total - stats.enabled;
};

/**
 * Check if feature is enabled for user
 */
export const isFeatureEnabled = (
  flagName: string,
  context?: {
    userId?: string;
    userRole?: string;
    environment?: string;
  }
): boolean => {
  const flag = featureFlags.get(flagName);

  // Update statistics
  const flagStats = stats.byFlag.get(flagName) || { checks: 0, allowed: 0, denied: 0 };
  flagStats.checks++;

  if (!flag) {
    // Flag not found - default to false
    flagStats.denied++;
    stats.byFlag.set(flagName, flagStats);
    return false;
  }

  // Check if flag is globally disabled
  if (!flag.enabled) {
    flagStats.denied++;
    stats.byFlag.set(flagName, flagStats);
    return false;
  }

  // No specific targeting - enabled for all
  if (!flag.enabledFor) {
    flagStats.allowed++;
    stats.byFlag.set(flagName, flagStats);
    return true;
  }

  const { enabledFor } = flag;

  // Check environment
  if (enabledFor.environments && context?.environment) {
    if (!enabledFor.environments.includes(context.environment)) {
      flagStats.denied++;
      stats.byFlag.set(flagName, flagStats);
      return false;
    }
  }

  // Check specific users
  if (enabledFor.users && context?.userId) {
    if (enabledFor.users.includes(context.userId)) {
      flagStats.allowed++;
      stats.byFlag.set(flagName, flagStats);
      return true;
    }
  }

  // Check roles
  if (enabledFor.roles && context?.userRole) {
    if (enabledFor.roles.includes(context.userRole)) {
      flagStats.allowed++;
      stats.byFlag.set(flagName, flagStats);
      return true;
    }
  }

  // Check percentage rollout
  if (enabledFor.percentage !== undefined && context?.userId) {
    // Deterministic hash based on userId
    const hash = hashString(context.userId);
    const userPercentage = hash % 100;
    if (userPercentage < enabledFor.percentage) {
      flagStats.allowed++;
      stats.byFlag.set(flagName, flagStats);
      return true;
    }
  }

  // Default to disabled if no criteria matched
  flagStats.denied++;
  stats.byFlag.set(flagName, flagStats);
  return false;
};

/**
 * Simple hash function for percentage rollout
 */
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Feature flag middleware
 * Blocks request if feature is disabled
 */
export const requireFeature = (flagName: string, options: {
  errorMessage?: string;
  fallbackHandler?: (req: Request, res: Response) => void;
} = {}) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    const user = (req as any).user;
    const context = {
      userId: user?.id,
      userRole: user?.role,
      environment: process.env.NODE_ENV || 'development',
    };

    const enabled = isFeatureEnabled(flagName, context);

    if (!enabled) {
      // Feature is disabled
      if (options.fallbackHandler) {
        return options.fallbackHandler(req, res);
      }

      return res.status(403).json({
        error: 'Feature not available',
        message: options.errorMessage || `The feature "${flagName}" is not available`,
        code: 'FEATURE_DISABLED',
        featureName: flagName,
      });
    }

    // Feature is enabled
    next();
  };
};

/**
 * Create/update feature flag
 */
export const setFeatureFlag = async (
  name: string,
  config: Partial<FeatureFlag>
): Promise<FeatureFlag> => {
  const existing = featureFlags.get(name);

  const flag: FeatureFlag = {
    name,
    enabled: config.enabled !== undefined ? config.enabled : false,
    description: config.description || existing?.description,
    enabledFor: config.enabledFor || existing?.enabledFor,
    metadata: config.metadata || existing?.metadata,
    createdAt: existing?.createdAt || new Date(),
    updatedAt: new Date(),
  };

  featureFlags.set(name, flag);
  await persistFlag(flag);
  updateStats();

  logger.info(`Feature flag "${name}" ${existing ? 'updated' : 'created'}`);

  return flag;
};

/**
 * Delete feature flag
 */
export const deleteFeatureFlag = async (name: string): Promise<boolean> => {
  const deleted = featureFlags.delete(name);

  if (deleted) {
    // Delete from Redis
    const redisClient = redisService.getClient();
    if (redisClient) {
      try {
        await redisClient.del(`feature:${name}`);
      } catch (error: any) {
        logger.error(`Failed to delete flag ${name} from Redis:`, error);
      }
    }

    updateStats();
    logger.info(`Feature flag "${name}" deleted`);
  }

  return deleted;
};

/**
 * Get all feature flags
 */
export const getAllFeatureFlags = (): FeatureFlag[] => {
  return Array.from(featureFlags.values());
};

/**
 * Get feature flag by name
 */
export const getFeatureFlag = (name: string): FeatureFlag | undefined => {
  return featureFlags.get(name);
};

/**
 * Get feature flags for user
 */
export const getFeaturesForUser = (context: {
  userId?: string;
  userRole?: string;
  environment?: string;
}): Record<string, boolean> => {
  const features: Record<string, boolean> = {};

  for (const flag of featureFlags.values()) {
    features[flag.name] = isFeatureEnabled(flag.name, context);
  }

  return features;
};

/**
 * Get feature flag statistics
 */
export const getFeatureFlagStats = () => {
  const byFlag: Record<string, { checks: number; allowed: number; denied: number; allowRate: number }> = {};

  for (const [name, flagStats] of stats.byFlag.entries()) {
    byFlag[name] = {
      ...flagStats,
      allowRate: flagStats.checks > 0
        ? Math.round((flagStats.allowed / flagStats.checks) * 100)
        : 0,
    };
  }

  return {
    total: stats.total,
    enabled: stats.enabled,
    disabled: stats.disabled,
    byFlag,
    flags: getAllFeatureFlags().map(f => ({
      name: f.name,
      enabled: f.enabled,
      description: f.description,
      enabledFor: f.enabledFor,
    })),
  };
};

/**
 * Reset feature flag statistics
 */
export const resetFeatureFlagStats = (): void => {
  stats.byFlag.clear();
};

/**
 * Bulk enable/disable features
 */
export const bulkUpdateFeatures = async (
  updates: Array<{ name: string; enabled: boolean }>
): Promise<void> => {
  for (const update of updates) {
    const flag = featureFlags.get(update.name);
    if (flag) {
      await setFeatureFlag(update.name, { ...flag, enabled: update.enabled });
    }
  }

  logger.info(`Bulk updated ${updates.length} feature flags`);
};

export default { initializeFeatureFlags, isFeatureEnabled, requireFeature };
