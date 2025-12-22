/**
 * API Versioning Middleware
 * Supports multiple API versions with backward compatibility
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Supported API versions
 */
export const SUPPORTED_VERSIONS = ['v1', 'v2'] as const;
export type ApiVersion = typeof SUPPORTED_VERSIONS[number];

/**
 * Default API version (latest stable)
 */
export const DEFAULT_VERSION: ApiVersion = 'v1';

/**
 * API version header name
 */
export const VERSION_HEADER = 'X-API-Version';

/**
 * Add apiVersion to Express Request type
 */
declare global {
  namespace Express {
    interface Request {
      apiVersion?: ApiVersion;
    }
  }
}

/**
 * Version tracking statistics
 */
interface VersionStats {
  total: number;
  byVersion: Map<string, number>;
  deprecated: number;
  unsupported: number;
}

const versionStats: VersionStats = {
  total: 0,
  byVersion: new Map(),
  deprecated: 0,
  unsupported: 0,
};

/**
 * Extract version from request
 * Supports multiple methods: header, query param, URL path
 */
const extractVersion = (req: Request): string | null => {
  // Method 1: Check X-API-Version header (preferred)
  const headerVersion = req.headers[VERSION_HEADER.toLowerCase()] as string;
  if (headerVersion) {
    return headerVersion.toLowerCase().replace(/^v/, '');
  }

  // Method 2: Check query parameter (?version=v1)
  const queryVersion = req.query.version as string;
  if (queryVersion) {
    return queryVersion.toLowerCase().replace(/^v/, '');
  }

  // Method 3: Check URL path (/api/v1/...)
  const pathMatch = req.path.match(/^\/api\/v(\d+)\//);
  if (pathMatch) {
    return pathMatch[1];
  }

  return null;
};

/**
 * Validate and normalize version
 */
const validateVersion = (version: string | null): ApiVersion => {
  if (!version) {
    return DEFAULT_VERSION;
  }

  // Normalize version format (ensure 'v' prefix)
  const normalizedVersion = version.startsWith('v') ? version : `v${version}`;

  // Check if version is supported
  if (SUPPORTED_VERSIONS.includes(normalizedVersion as ApiVersion)) {
    return normalizedVersion as ApiVersion;
  }

  // Version not supported
  return DEFAULT_VERSION;
};

/**
 * API Version middleware
 * Extracts and validates API version from request
 *
 * Features:
 * - Multiple extraction methods (header, query, path)
 * - Version validation and normalization
 * - Automatic fallback to default version
 * - Version usage statistics tracking
 * - Deprecation warnings
 * - Backward compatibility support
 *
 * Usage:
 * app.use(apiVersionMiddleware);
 *
 * Client can specify version via:
 * - Header: X-API-Version: v1
 * - Query: ?version=v1
 * - Path: /api/v1/...
 */
export const apiVersionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Extract version from request
  const rawVersion = extractVersion(req);
  const version = validateVersion(rawVersion);

  // Attach to request object
  req.apiVersion = version;

  // Add version to response headers for client visibility
  res.setHeader(VERSION_HEADER, version);

  // Update statistics
  versionStats.total++;
  const versionCount = versionStats.byVersion.get(version) || 0;
  versionStats.byVersion.set(version, versionCount + 1);

  // Log version mismatches
  if (rawVersion && version !== `v${rawVersion}`) {
    versionStats.unsupported++;
    logger.warn('Unsupported API version requested', {
      requested: rawVersion,
      fallback: version,
      url: req.url,
      method: req.method,
      requestId: req.id,
    });
  }

  // Add deprecation warning for old versions (if needed in future)
  // Example: if version is v1 and v2 is current
  // if (version === 'v1') {
  //   res.setHeader('X-API-Deprecated', 'This API version is deprecated. Please migrate to v2.');
  //   versionStats.deprecated++;
  // }

  next();
};

/**
 * Version-specific middleware wrapper
 * Only applies middleware to specific API versions
 *
 * Usage:
 * router.get('/endpoint', forVersion('v2', newFeatureMiddleware), handler);
 */
export const forVersion = (
  targetVersion: ApiVersion,
  middleware: (req: Request, res: Response, next: NextFunction) => void
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.apiVersion === targetVersion) {
      return middleware(req, res, next);
    }
    next();
  };
};

/**
 * Version-specific route wrapper
 * Only executes handler for specific API versions
 *
 * Usage:
 * router.get('/endpoint', onlyVersion('v2', v2Handler), v1Handler);
 */
export const onlyVersion = (
  targetVersion: ApiVersion,
  handler: (req: Request, res: Response, next: NextFunction) => void
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.apiVersion === targetVersion) {
      return handler(req, res, next);
    }
    next();
  };
};

/**
 * Require minimum API version
 * Returns 400 if version is below minimum
 *
 * Usage:
 * router.get('/endpoint', requireMinVersion('v2'), handler);
 */
export const requireMinVersion = (minVersion: ApiVersion) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentVersion = req.apiVersion || DEFAULT_VERSION;
    const currentNum = parseInt(currentVersion.replace('v', ''), 10);
    const minNum = parseInt(minVersion.replace('v', ''), 10);

    if (currentNum < minNum) {
      return res.status(400).json({
        error: 'API version too old',
        message: `This endpoint requires API version ${minVersion} or higher. Current: ${currentVersion}`,
        minVersion,
        currentVersion,
      });
    }

    next();
  };
};

/**
 * Get version usage statistics
 */
export const getVersionStats = () => {
  const byVersion: Record<string, { count: number; percentage: number }> = {};

  for (const [version, count] of versionStats.byVersion.entries()) {
    byVersion[version] = {
      count,
      percentage: versionStats.total > 0
        ? Math.round((count / versionStats.total) * 100)
        : 0,
    };
  }

  return {
    total: versionStats.total,
    byVersion,
    deprecated: versionStats.deprecated,
    unsupported: versionStats.unsupported,
    supportedVersions: SUPPORTED_VERSIONS,
    defaultVersion: DEFAULT_VERSION,
  };
};

/**
 * Reset version statistics
 */
export const resetVersionStats = (): void => {
  versionStats.total = 0;
  versionStats.byVersion.clear();
  versionStats.deprecated = 0;
  versionStats.unsupported = 0;
};

export default apiVersionMiddleware;
