/**
 * CDN Integration Middleware
 * CloudFlare and CDN optimization headers
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * CDN configuration
 */
export interface CDNConfig {
  enabled: boolean;
  provider: 'cloudflare' | 'aws' | 'generic';
  cacheControl: {
    static: string;  // Cache-Control for static assets
    api: string;     // Cache-Control for API responses
    dynamic: string; // Cache-Control for dynamic content
  };
  cloudflare?: {
    cacheEverything: boolean;
    minify: {
      html: boolean;
      css: boolean;
      js: boolean;
    };
    polish: 'off' | 'lossless' | 'lossy';
    mirage: boolean;
  };
}

/**
 * Default CDN configuration
 */
const defaultConfig: CDNConfig = {
  enabled: process.env.CDN_ENABLED === 'true',
  provider: (process.env.CDN_PROVIDER as 'cloudflare' | 'aws' | 'generic') || 'generic',
  cacheControl: {
    static: 'public, max-age=31536000, immutable', // 1 year for static assets
    api: 'no-cache, no-store, must-revalidate',     // No cache for API
    dynamic: 'public, max-age=300, s-maxage=600',   // 5 min client, 10 min CDN
  },
  cloudflare: {
    cacheEverything: false,
    minify: {
      html: true,
      css: true,
      js: true,
    },
    polish: 'lossless',
    mirage: true,
  },
};

/**
 * CDN statistics
 */
interface CDNStats {
  enabled: boolean;
  provider: string;
  requestsServed: number;
  cacheHits: number;
  cacheMisses: number;
  bypassCount: number;
  staticAssetRequests: number;
  apiRequests: number;
  dynamicRequests: number;
  cdnHeadersSet: number;
  cloudflareDetected: number;
}

const stats: CDNStats = {
  enabled: defaultConfig.enabled,
  provider: defaultConfig.provider,
  requestsServed: 0,
  cacheHits: 0,
  cacheMisses: 0,
  bypassCount: 0,
  staticAssetRequests: 0,
  apiRequests: 0,
  dynamicRequests: 0,
  cdnHeadersSet: 0,
  cloudflareDetected: 0,
};

/**
 * Asset type detection
 */
const isStaticAsset = (path: string): boolean => {
  const staticExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.webp',
    '.css', '.js', '.woff', '.woff2', '.ttf', '.eot',
    '.pdf', '.zip', '.mp4', '.webm',
  ];
  return staticExtensions.some(ext => path.toLowerCase().endsWith(ext));
};

const isApiRequest = (path: string): boolean => {
  return path.startsWith('/api/');
};

/**
 * Detect CloudFlare presence
 */
const isCloudFlareRequest = (req: Request): boolean => {
  return !!(
    req.headers['cf-ray'] ||
    req.headers['cf-connecting-ip'] ||
    req.headers['cf-visitor']
  );
};

/**
 * Get cache status from headers
 */
const getCacheStatus = (req: Request): 'HIT' | 'MISS' | 'BYPASS' | 'UNKNOWN' => {
  // CloudFlare cache status
  const cfCacheStatus = req.headers['cf-cache-status'];
  if (cfCacheStatus) {
    return cfCacheStatus.toString().toUpperCase() as 'HIT' | 'MISS' | 'BYPASS';
  }

  // AWS CloudFront cache status
  const cloudFrontCacheStatus = req.headers['x-cache'];
  if (cloudFrontCacheStatus) {
    const status = cloudFrontCacheStatus.toString().toUpperCase();
    if (status.includes('HIT')) return 'HIT';
    if (status.includes('MISS')) return 'MISS';
  }

  return 'UNKNOWN';
};

/**
 * Set CloudFlare-specific headers
 */
const setCloudFlareHeaders = (res: Response, config: CDNConfig): void => {
  if (!config.cloudflare) return;

  const cfConfig = config.cloudflare;

  // Cache Everything (forces CloudFlare to cache HTML)
  if (cfConfig.cacheEverything) {
    res.setHeader('CF-Cache-Everything', 'true');
  }

  // Minification
  const minifyOptions: string[] = [];
  if (cfConfig.minify.html) minifyOptions.push('html');
  if (cfConfig.minify.css) minifyOptions.push('css');
  if (cfConfig.minify.js) minifyOptions.push('js');
  if (minifyOptions.length > 0) {
    res.setHeader('CF-Minify', minifyOptions.join(','));
  }

  // Polish (image optimization)
  if (cfConfig.polish !== 'off') {
    res.setHeader('CF-Polish', cfConfig.polish);
  }

  // Mirage (lazy loading)
  if (cfConfig.mirage) {
    res.setHeader('CF-Mirage', 'true');
  }
};

/**
 * Set Cache-Control headers
 */
const setCacheControl = (res: Response, type: 'static' | 'api' | 'dynamic', config: CDNConfig): void => {
  res.setHeader('Cache-Control', config.cacheControl[type]);

  // Add Vary header for dynamic content
  if (type === 'dynamic') {
    res.setHeader('Vary', 'Accept-Encoding, Accept-Language');
  }

  // Add ETag for caching validation
  if (type !== 'api') {
    res.setHeader('ETag', `W/"${Date.now()}"`);
  }
};

/**
 * CDN middleware factory
 */
export const cdnMiddleware = (customConfig?: Partial<CDNConfig>) => {
  const config: CDNConfig = { ...defaultConfig, ...customConfig };

  return (req: Request, res: Response, next: NextFunction): void => {
    stats.requestsServed++;

    // Skip if CDN is disabled
    if (!config.enabled) {
      stats.bypassCount++;
      return next();
    }

    try {
      // Detect CloudFlare
      const isCloudFlare = isCloudFlareRequest(req);
      if (isCloudFlare) {
        stats.cloudflareDetected++;
      }

      // Get cache status
      const cacheStatus = getCacheStatus(req);
      if (cacheStatus === 'HIT') stats.cacheHits++;
      else if (cacheStatus === 'MISS') stats.cacheMisses++;
      else if (cacheStatus === 'BYPASS') stats.bypassCount++;

      // Determine content type and set appropriate headers
      const path = req.path;

      if (isStaticAsset(path)) {
        // Static assets - aggressive caching
        stats.staticAssetRequests++;
        setCacheControl(res, 'static', config);
      } else if (isApiRequest(path)) {
        // API requests - no caching
        stats.apiRequests++;
        setCacheControl(res, 'api', config);
      } else {
        // Dynamic content - moderate caching
        stats.dynamicRequests++;
        setCacheControl(res, 'dynamic', config);
      }

      // Set CloudFlare-specific headers if using CloudFlare
      if (config.provider === 'cloudflare' && isCloudFlare) {
        setCloudFlareHeaders(res, config);
        stats.cdnHeadersSet++;
      }

      // Add CDN-related headers for debugging
      res.setHeader('X-CDN-Provider', config.provider);
      if (cacheStatus !== 'UNKNOWN') {
        res.setHeader('X-CDN-Cache-Status', cacheStatus);
      }

      // Add real client IP from CDN
      if (isCloudFlare && req.headers['cf-connecting-ip']) {
        (req as any).realClientIP = req.headers['cf-connecting-ip'];
      } else if (req.headers['x-forwarded-for']) {
        (req as any).realClientIP = (req.headers['x-forwarded-for'] as string).split(',')[0].trim();
      }

      next();
    } catch (error: any) {
      logger.error('CDN middleware error:', error);
      next(); // Continue even if CDN processing fails
    }
  };
};

/**
 * CDN statistics middleware
 */
export const cdnStatsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Attach CDN stats to request for health checks
  (req as any).cdnStats = getCDNStats();
  next();
};

/**
 * Get CDN statistics
 */
export const getCDNStats = () => {
  const hitRate = stats.requestsServed > 0
    ? ((stats.cacheHits / stats.requestsServed) * 100).toFixed(2)
    : '0.00';

  return {
    ...stats,
    hitRate: `${hitRate}%`,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Reset CDN statistics
 */
export const resetCDNStats = (): void => {
  stats.requestsServed = 0;
  stats.cacheHits = 0;
  stats.cacheMisses = 0;
  stats.bypassCount = 0;
  stats.staticAssetRequests = 0;
  stats.apiRequests = 0;
  stats.dynamicRequests = 0;
  stats.cdnHeadersSet = 0;
  stats.cloudflareDetected = 0;
  logger.info('CDN statistics reset');
};

/**
 * Export default CDN middleware
 */
export default cdnMiddleware();
