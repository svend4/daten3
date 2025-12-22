/**
 * Content Security Policy (CSP) Middleware
 * Advanced XSS protection and resource loading control
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import logger from '../utils/logger.js';

/**
 * CSP directive types
 */
export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'script-src-elem'?: string[];
  'script-src-attr'?: string[];
  'style-src'?: string[];
  'style-src-elem'?: string[];
  'style-src-attr'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'media-src'?: string[];
  'object-src'?: string[];
  'frame-src'?: string[];
  'child-src'?: string[];
  'form-action'?: string[];
  'frame-ancestors'?: string[];
  'base-uri'?: string[];
  'manifest-src'?: string[];
  'worker-src'?: string[];
  'report-uri'?: string[];
  'report-to'?: string[];
}

/**
 * CSP configuration
 */
export interface CSPConfig {
  enabled: boolean;
  reportOnly: boolean;
  useNonces: boolean;
  directives: CSPDirectives;
  reportUri?: string;
}

/**
 * Default CSP configuration (strict but flexible for TravelHub)
 */
const defaultConfig: CSPConfig = {
  enabled: process.env.CSP_ENABLED !== 'false', // Enabled by default
  reportOnly: process.env.CSP_REPORT_ONLY === 'true', // Report-only mode for testing
  useNonces: process.env.CSP_USE_NONCES === 'true',
  directives: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Stripe for payments
      'https://js.stripe.com',
      // Analytics
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      // CDN
      'https://cdn.jsdelivr.net',
      'https://cdnjs.cloudflare.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for some UI libraries
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      // External image sources (travel APIs, user uploads)
      'https://*.cloudinary.com',
      'https://*.amazonaws.com',
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net',
    ],
    'connect-src': [
      "'self'",
      // Travelpayouts API
      'https://api.travelpayouts.com',
      // Stripe API
      'https://api.stripe.com',
      // Analytics
      'https://www.google-analytics.com',
      // WebSocket (if needed)
      'ws://localhost:*',
      'wss://*',
    ],
    'media-src': [
      "'self'",
      'https:',
    ],
    'object-src': ["'none'"],
    'frame-src': [
      "'self'",
      // Stripe iframe
      'https://js.stripe.com',
      'https://hooks.stripe.com',
    ],
    'frame-ancestors': ["'none'"], // Prevent clickjacking
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
  },
  reportUri: process.env.CSP_REPORT_URI,
};

/**
 * CSP statistics
 */
interface CSPStats {
  enabled: boolean;
  reportOnly: boolean;
  requestsProcessed: number;
  noncesGenerated: number;
  violationsReported: number;
  bypassCount: number;
  headersSent: number;
  recentViolations: Array<{
    timestamp: string;
    directive: string;
    blockedUri: string;
    documentUri: string;
    violatedDirective: string;
  }>;
}

const stats: CSPStats = {
  enabled: defaultConfig.enabled,
  reportOnly: defaultConfig.reportOnly,
  requestsProcessed: 0,
  noncesGenerated: 0,
  violationsReported: 0,
  bypassCount: 0,
  headersSent: 0,
  recentViolations: [],
};

/**
 * Generate nonce for inline scripts/styles
 */
export const generateNonce = (): string => {
  return randomBytes(16).toString('base64');
};

/**
 * Build CSP header value from directives
 */
const buildCSPHeader = (directives: CSPDirectives, nonce?: string): string => {
  const parts: string[] = [];

  for (const [directive, values] of Object.entries(directives)) {
    if (!values || values.length === 0) continue;

    // Add nonce to script-src and style-src if enabled
    let directiveValues = [...values];
    if (nonce && (directive === 'script-src' || directive === 'style-src')) {
      directiveValues.push(`'nonce-${nonce}'`);
    }

    parts.push(`${directive} ${directiveValues.join(' ')}`);
  }

  return parts.join('; ');
};

/**
 * CSP violation report handler
 */
export const handleCSPViolation = (req: Request, res: Response): void => {
  try {
    const violation = req.body;

    stats.violationsReported++;

    // Store recent violation
    if (violation['csp-report']) {
      const report = violation['csp-report'];
      stats.recentViolations.unshift({
        timestamp: new Date().toISOString(),
        directive: report['effective-directive'] || report['violated-directive'] || 'unknown',
        blockedUri: report['blocked-uri'] || 'unknown',
        documentUri: report['document-uri'] || 'unknown',
        violatedDirective: report['violated-directive'] || 'unknown',
      });

      // Keep only last 50 violations
      if (stats.recentViolations.length > 50) {
        stats.recentViolations = stats.recentViolations.slice(0, 50);
      }

      logger.warn('CSP Violation:', {
        directive: report['violated-directive'],
        blockedUri: report['blocked-uri'],
        documentUri: report['document-uri'],
      });
    }

    res.status(204).send();
  } catch (error: any) {
    logger.error('Error handling CSP violation report:', error);
    res.status(400).json({ error: 'Invalid CSP report' });
  }
};

/**
 * CSP middleware factory
 */
export const cspMiddleware = (customConfig?: Partial<CSPConfig>) => {
  const config: CSPConfig = {
    ...defaultConfig,
    ...customConfig,
    directives: {
      ...defaultConfig.directives,
      ...customConfig?.directives,
    },
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    stats.requestsProcessed++;

    // Skip if CSP is disabled
    if (!config.enabled) {
      stats.bypassCount++;
      return next();
    }

    try {
      // Generate nonce if enabled
      let nonce: string | undefined;
      if (config.useNonces) {
        nonce = generateNonce();
        stats.noncesGenerated++;
        // Attach nonce to request for use in templates
        (req as any).cspNonce = nonce;
      }

      // Add report-uri if configured
      const directives = { ...config.directives };
      if (config.reportUri) {
        directives['report-uri'] = [config.reportUri];
      }

      // Build CSP header
      const cspHeader = buildCSPHeader(directives, nonce);

      // Set appropriate CSP header
      const headerName = config.reportOnly
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';

      res.setHeader(headerName, cspHeader);
      stats.headersSent++;

      // Add reporting endpoint info
      if (config.reportUri) {
        res.setHeader('X-CSP-Report-URI', config.reportUri);
      }

      next();
    } catch (error: any) {
      logger.error('CSP middleware error:', error);
      next(); // Continue even if CSP processing fails
    }
  };
};

/**
 * CSP statistics middleware
 */
export const cspStatsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Attach CSP stats to request for health checks
  (req as any).cspStats = getCSPStats();
  next();
};

/**
 * Get CSP statistics
 */
export const getCSPStats = () => {
  const violationRate = stats.requestsProcessed > 0
    ? ((stats.violationsReported / stats.requestsProcessed) * 100).toFixed(2)
    : '0.00';

  return {
    enabled: stats.enabled,
    reportOnly: stats.reportOnly,
    requestsProcessed: stats.requestsProcessed,
    noncesGenerated: stats.noncesGenerated,
    violationsReported: stats.violationsReported,
    bypassCount: stats.bypassCount,
    headersSent: stats.headersSent,
    violationRate: `${violationRate}%`,
    recentViolations: stats.recentViolations.slice(0, 10), // Last 10 violations
    timestamp: new Date().toISOString(),
  };
};

/**
 * Reset CSP statistics
 */
export const resetCSPStats = (): void => {
  stats.requestsProcessed = 0;
  stats.noncesGenerated = 0;
  stats.violationsReported = 0;
  stats.bypassCount = 0;
  stats.headersSent = 0;
  stats.recentViolations = [];
  logger.info('CSP statistics reset');
};

/**
 * Get CSP nonce from request (for use in templates)
 */
export const getCSPNonce = (req: Request): string | undefined => {
  return (req as any).cspNonce;
};

/**
 * Export default CSP middleware with strict policy
 */
export default cspMiddleware();
