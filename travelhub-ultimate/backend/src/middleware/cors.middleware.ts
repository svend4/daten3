import cors from 'cors';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * CORS Middleware Configuration
 * Advanced Cross-Origin Resource Sharing with dynamic origin validation
 * Based on Innovation Library best practices
 */

/**
 * Get allowed origins from environment and config
 * Supports comma-separated list from ALLOWED_ORIGINS env variable
 */
const getAllowedOrigins = (): string[] => {
  const configOrigins = config.cors.origin || [];
  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

  return [...new Set([...configOrigins, ...envOrigins])];
};

const allowedOrigins = getAllowedOrigins();

/**
 * Origin validation cache for performance
 * Reduces regex matching overhead for repeated origins
 */
interface CacheEntry {
  allowed: boolean;
  timestamp: number;
}

const originCache = new Map<string, CacheEntry>();
const CACHE_MAX_SIZE = 1000;
const CACHE_TTL = 3600000; // 1 hour

/**
 * Check if origin matches allowed patterns
 * Supports:
 * - Exact match: https://example.com
 * - Wildcard subdomain: https://*.example.com
 * - Protocol wildcard: *://example.com
 */
const isOriginAllowed = (origin: string): boolean => {
  // Check cache first
  const cached = originCache.get(origin);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.allowed;
  }

  let allowed = false;

  // Check exact matches
  if (allowedOrigins.includes(origin)) {
    allowed = true;
  } else {
    // Check pattern matches
    for (const pattern of allowedOrigins) {
      if (matchOriginPattern(origin, pattern)) {
        allowed = true;
        break;
      }
    }
  }

  // Cache the result
  if (originCache.size >= CACHE_MAX_SIZE) {
    // Clear oldest entries (simple FIFO)
    const firstKey = originCache.keys().next().value;
    if (firstKey) {
      originCache.delete(firstKey);
    }
  }
  originCache.set(origin, { allowed, timestamp: Date.now() } as CacheEntry);

  return allowed;
};

/**
 * Match origin against pattern with wildcard support
 */
const matchOriginPattern = (origin: string, pattern: string): boolean => {
  // Escape special regex characters except * and :
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');

  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(origin);
};

// CORS options with enhanced validation
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    console.log('🔍 CORS REQUEST RECEIVED:', {
      origin: origin || 'NO ORIGIN',
      timestamp: new Date().toISOString(),
      allowedOrigins: allowedOrigins,
    });

    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    // Return frontend URL to ensure CORS headers are set
    if (!origin) {
      // Use first allowed origin (NOT the raw env var which is comma-separated!)
      const frontendUrl = allowedOrigins[0];
      console.log('❌ No origin in request, using frontendUrl:', frontendUrl);
      logger.info('CORS: Request with no origin, using frontend URL', {
        frontendUrl,
        category: 'no-origin'
      });
      return callback(null, frontendUrl || true);
    }

    // Check if origin is in allowed list (with pattern matching)
    if (isOriginAllowed(origin)) {
      console.log('✅ Origin ALLOWED:', origin);
      logger.debug('CORS allowed', { origin, category: 'allowed' });
      return callback(null, true);
    }

    // In development, allow localhost and local IPs
    if (process.env.NODE_ENV !== 'production') {
      const isLocalhost =
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('0.0.0.0') ||
        /192\.168\.\d+\.\d+/.test(origin) || // Local network
        /10\.\d+\.\d+\.\d+/.test(origin);    // Private network

      if (isLocalhost) {
        console.log('✅ Origin ALLOWED (dev localhost):', origin);
        logger.debug('CORS allowed (dev localhost/local)', { origin, category: 'dev-local' });
        return callback(null, true);
      }
    }

    // Block the request with detailed logging
    console.log('🚫 Origin BLOCKED:', origin, 'Allowed:', allowedOrigins);
    logger.warn('CORS request blocked', {
      origin,
      allowedOrigins,
      category: 'blocked',
      hint: 'Add origin to ALLOWED_ORIGINS environment variable',
    });

    callback(new Error('Not allowed by CORS'));
  },
  credentials: config.cors.credentials, // Required for httpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token', // CSRF protection
    'X-API-Key',
    'X-Client-Version', // Client version tracking
    'X-Device-Id'       // Device identification
  ],
  exposedHeaders: [
    'Content-Length',
    'X-Request-Id',
    'Set-Cookie',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count',    // Pagination total
    'X-Page-Count'      // Pagination pages
  ],
  maxAge: 86400, // 24 hours - increased preflight cache
  preflightContinue: false,
  optionsSuccessStatus: 204, // Some legacy browsers choke on 204
};

// Log CORS configuration on startup
console.log('=== CORS DEBUG START ===');
console.log('FRONTEND_URL env:', process.env.FRONTEND_URL);
console.log('ALLOWED_ORIGINS env:', process.env.ALLOWED_ORIGINS);
console.log('config.cors.origin:', config.cors.origin);
console.log('allowedOrigins array:', allowedOrigins);
console.log('=== CORS DEBUG END ===');

logger.info('CORS Configuration initialized', {
  allowedOrigins,
  allowedOriginsCount: allowedOrigins.length,
  frontendUrl: process.env.FRONTEND_URL || 'NOT SET',
  additionalOrigins: process.env.ALLOWED_ORIGINS || 'NONE',
  environment: process.env.NODE_ENV || 'not set',
  credentials: config.cors.credentials,
  cacheEnabled: true,
  wildcardSupport: true,
});

/**
 * Clear origin cache (useful for testing or dynamic config updates)
 */
export const clearOriginCache = (): void => {
  originCache.clear();
  logger.info('CORS origin cache cleared');
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: originCache.size,
    maxSize: CACHE_MAX_SIZE,
    ttl: CACHE_TTL,
  };
};

// Debug middleware to log ALL request headers and CORS response headers
export const corsDebugMiddleware = (req: any, res: any, next: any) => {
  console.log('📨 INCOMING REQUEST:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin || 'NO ORIGIN HEADER',
    referer: req.headers.referer || 'NO REFERER',
    host: req.headers.host,
    userAgent: req.headers['user-agent']?.substring(0, 50),
  });

  // Intercept response to log headers AFTER CORS middleware sets them
  const originalEnd = res.end;
  const originalSend = res.send;
  const originalJson = res.json;

  const logResponseHeaders = () => {
    console.log('📤 RESPONSE HEADERS for', req.url, ':', {
      statusCode: res.statusCode,
      'access-control-allow-origin': res.getHeader('access-control-allow-origin') || 'NOT SET ❌',
      'access-control-allow-credentials': res.getHeader('access-control-allow-credentials') || 'NOT SET ❌',
      'access-control-allow-methods': res.getHeader('access-control-allow-methods') || 'NOT SET',
      'access-control-expose-headers': res.getHeader('access-control-expose-headers') || 'NOT SET',
    });
  };

  res.end = function(...args: any[]) {
    logResponseHeaders();
    return originalEnd.apply(res, args);
  };

  res.send = function(...args: any[]) {
    logResponseHeaders();
    return originalSend.apply(res, args);
  };

  res.json = function(...args: any[]) {
    logResponseHeaders();
    return originalJson.apply(res, args);
  };

  next();
};

export default cors(corsOptions);
