/**
 * Multi-tenancy Middleware
 * Support for multiple organizations (tenants) in a single database
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import logger from '../utils/logger.js';

/**
 * Tenant detection strategy
 */
export enum TenantStrategy {
  SUBDOMAIN = 'subdomain',  // tenant.example.com
  HEADER = 'header',        // X-Tenant-ID header
  JWT = 'jwt',              // Tenant ID in JWT token
  QUERY = 'query',          // ?tenant=xxx query parameter
}

/**
 * Tenant configuration
 */
export interface TenantConfig {
  strategy: TenantStrategy;
  required: boolean;        // Reject requests without tenant
  defaultTenant?: string;   // Default tenant ID
  allowedTenants?: string[]; // Whitelist of allowed tenants
}

/**
 * Tenant information
 */
export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  settings: Record<string, any>;
  isActive: boolean;
}

/**
 * Extended Request with tenant info
 */
export interface TenantRequest extends Request {
  tenant?: TenantInfo;
  tenantId?: string;
}

/**
 * Default configuration
 */
const defaultConfig: TenantConfig = {
  strategy: (process.env.TENANT_STRATEGY as TenantStrategy) || TenantStrategy.HEADER,
  required: process.env.TENANT_REQUIRED === 'true',
  defaultTenant: process.env.DEFAULT_TENANT || 'default',
};

/**
 * Multi-tenancy statistics
 */
interface MultiTenancyStats {
  enabled: boolean;
  strategy: TenantStrategy;
  totalRequests: number;
  tenantDetected: number;
  tenantMissing: number;
  tenantInvalid: number;
  tenantRejected: number;
  tenantsBySlug: Map<string, number>;
  recentTenants: Array<{
    timestamp: string;
    tenantId: string;
    slug: string;
    strategy: TenantStrategy;
  }>;
}

const stats: MultiTenancyStats = {
  enabled: true,
  strategy: defaultConfig.strategy,
  totalRequests: 0,
  tenantDetected: 0,
  tenantMissing: 0,
  tenantInvalid: 0,
  tenantRejected: 0,
  tenantsBySlug: new Map(),
  recentTenants: [],
};

/**
 * In-memory tenant cache (to avoid DB queries on every request)
 */
const tenantCache = new Map<string, TenantInfo | null>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

/**
 * Get tenant from cache or database
 */
const getTenantInfo = async (tenantId: string): Promise<TenantInfo | null> => {
  // Check cache
  const cached = tenantCache.get(tenantId);
  const cacheTime = cacheTimestamps.get(tenantId);

  if (cached && cacheTime && Date.now() - cacheTime < CACHE_TTL) {
    return cached;
  }

  try {
    // Query database (assuming we have a Tenant model)
    // For now, we'll simulate with a basic structure
    // In production, this would query the actual Tenant table

    // Simulate tenant lookup
    const tenant: TenantInfo = {
      id: tenantId,
      slug: tenantId,
      name: `Tenant ${tenantId}`,
      settings: {},
      isActive: true,
    };

    // Cache it
    tenantCache.set(tenantId, tenant);
    cacheTimestamps.set(tenantId, Date.now());

    return tenant;
  } catch (error: any) {
    logger.error('Error fetching tenant info:', error);
    // Cache negative result
    tenantCache.set(tenantId, null);
    cacheTimestamps.set(tenantId, Date.now());
    return null;
  }
};

/**
 * Extract tenant from subdomain
 */
const extractTenantFromSubdomain = (req: Request): string | null => {
  const host = req.hostname || req.headers.host;
  if (!host) return null;

  // Extract subdomain (e.g., tenant.example.com -> tenant)
  const parts = host.split('.');

  // Must have at least 3 parts (subdomain.domain.tld)
  if (parts.length < 3) return null;

  // Skip common subdomains
  const subdomain = parts[0];
  if (['www', 'api', 'admin'].includes(subdomain)) return null;

  return subdomain;
};

/**
 * Extract tenant from header
 */
const extractTenantFromHeader = (req: Request): string | null => {
  const header = req.headers['x-tenant-id'] || req.headers['x-tenant'];
  return header ? header.toString() : null;
};

/**
 * Extract tenant from JWT
 */
const extractTenantFromJWT = (req: Request): string | null => {
  // Check if user is authenticated and has tenant info
  const user = (req as any).user;
  return user?.tenantId || null;
};

/**
 * Extract tenant from query parameter
 */
const extractTenantFromQuery = (req: Request): string | null => {
  return req.query.tenant?.toString() || null;
};

/**
 * Extract tenant ID based on strategy
 */
const extractTenantId = (req: Request, strategy: TenantStrategy): string | null => {
  switch (strategy) {
    case TenantStrategy.SUBDOMAIN:
      return extractTenantFromSubdomain(req);
    case TenantStrategy.HEADER:
      return extractTenantFromHeader(req);
    case TenantStrategy.JWT:
      return extractTenantFromJWT(req);
    case TenantStrategy.QUERY:
      return extractTenantFromQuery(req);
    default:
      return null;
  }
};

/**
 * Multi-tenancy middleware factory
 */
export const multiTenancyMiddleware = (customConfig?: Partial<TenantConfig>) => {
  const config: TenantConfig = { ...defaultConfig, ...customConfig };

  return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    stats.totalRequests++;

    try {
      // Try primary strategy
      let tenantId = extractTenantId(req, config.strategy);

      // Fallback: try all strategies if primary fails
      if (!tenantId) {
        for (const strategy of Object.values(TenantStrategy)) {
          tenantId = extractTenantId(req, strategy as TenantStrategy);
          if (tenantId) break;
        }
      }

      // Use default tenant if none detected
      if (!tenantId && config.defaultTenant) {
        tenantId = config.defaultTenant;
      }

      // No tenant found
      if (!tenantId) {
        stats.tenantMissing++;

        if (config.required) {
          stats.tenantRejected++;
          return res.status(400).json({
            success: false,
            error: 'Tenant identification required',
            code: 'TENANT_REQUIRED',
          }) as any;
        }

        // Continue without tenant
        return next();
      }

      // Check whitelist
      if (config.allowedTenants && !config.allowedTenants.includes(tenantId)) {
        stats.tenantInvalid++;
        stats.tenantRejected++;
        return res.status(403).json({
          success: false,
          error: 'Tenant not allowed',
          code: 'TENANT_NOT_ALLOWED',
        }) as any;
      }

      // Get tenant info
      const tenant = await getTenantInfo(tenantId);

      if (!tenant) {
        stats.tenantInvalid++;

        if (config.required) {
          stats.tenantRejected++;
          return res.status(404).json({
            success: false,
            error: 'Tenant not found',
            code: 'TENANT_NOT_FOUND',
          }) as any;
        }

        return next();
      }

      // Check if tenant is active
      if (!tenant.isActive) {
        stats.tenantRejected++;
        return res.status(403).json({
          success: false,
          error: 'Tenant is inactive',
          code: 'TENANT_INACTIVE',
        }) as any;
      }

      // Attach tenant to request
      req.tenant = tenant;
      req.tenantId = tenant.id;

      // Update statistics
      stats.tenantDetected++;
      const count = stats.tenantsBySlug.get(tenant.slug) || 0;
      stats.tenantsBySlug.set(tenant.slug, count + 1);

      // Track recent tenants
      stats.recentTenants.unshift({
        timestamp: new Date().toISOString(),
        tenantId: tenant.id,
        slug: tenant.slug,
        strategy: config.strategy,
      });

      // Keep only last 100
      if (stats.recentTenants.length > 100) {
        stats.recentTenants = stats.recentTenants.slice(0, 100);
      }

      // Add tenant info to response headers (for debugging)
      res.setHeader('X-Tenant-ID', tenant.id);
      res.setHeader('X-Tenant-Slug', tenant.slug);

      next();
    } catch (error: any) {
      logger.error('Multi-tenancy middleware error:', error);

      if (config.required) {
        stats.tenantRejected++;
        return res.status(500).json({
          success: false,
          error: 'Tenant detection failed',
          code: 'TENANT_ERROR',
        }) as any;
      }

      next();
    }
  };
};

/**
 * Get current tenant from request
 */
export const getCurrentTenant = (req: Request): TenantInfo | undefined => {
  return (req as TenantRequest).tenant;
};

/**
 * Get current tenant ID from request
 */
export const getCurrentTenantId = (req: Request): string | undefined => {
  return (req as TenantRequest).tenantId;
};

/**
 * Require tenant middleware (throw error if no tenant)
 */
export const requireTenant = (req: Request, res: Response, next: NextFunction): void => {
  const tenant = getCurrentTenant(req);

  if (!tenant) {
    return res.status(400).json({
      success: false,
      error: 'Tenant required for this operation',
      code: 'TENANT_REQUIRED',
    }) as any;
  }

  next();
};

/**
 * Clear tenant cache
 */
export const clearTenantCache = (): void => {
  tenantCache.clear();
  cacheTimestamps.clear();
  logger.info('Tenant cache cleared');
};

/**
 * Get multi-tenancy statistics
 */
export const getMultiTenancyStats = () => {
  const detectionRate = stats.totalRequests > 0
    ? ((stats.tenantDetected / stats.totalRequests) * 100).toFixed(2)
    : '0.00';

  const rejectionRate = stats.totalRequests > 0
    ? ((stats.tenantRejected / stats.totalRequests) * 100).toFixed(2)
    : '0.00';

  return {
    enabled: stats.enabled,
    strategy: stats.strategy,
    totalRequests: stats.totalRequests,
    tenantDetected: stats.tenantDetected,
    tenantMissing: stats.tenantMissing,
    tenantInvalid: stats.tenantInvalid,
    tenantRejected: stats.tenantRejected,
    detectionRate: `${detectionRate}%`,
    rejectionRate: `${rejectionRate}%`,
    uniqueTenants: stats.tenantsBySlug.size,
    tenantsBySlug: Object.fromEntries(stats.tenantsBySlug),
    recentTenants: stats.recentTenants.slice(0, 10),
    cacheSize: tenantCache.size,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Reset multi-tenancy statistics
 */
export const resetMultiTenancyStats = (): void => {
  stats.totalRequests = 0;
  stats.tenantDetected = 0;
  stats.tenantMissing = 0;
  stats.tenantInvalid = 0;
  stats.tenantRejected = 0;
  stats.tenantsBySlug.clear();
  stats.recentTenants = [];
  logger.info('Multi-tenancy statistics reset');
};

/**
 * Export default middleware with header strategy
 */
export default multiTenancyMiddleware();
