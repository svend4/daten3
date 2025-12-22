import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

/**
 * Enhanced Helmet Middleware Configuration
 * Comprehensive security HTTP headers with advanced features
 * Based on Innovation Library best practices
 */

/**
 * Get CSP report URI from environment (optional)
 */
const getCspReportUri = (): string[] => {
  const reportUri = process.env.CSP_REPORT_URI;
  return reportUri ? [reportUri] : [];
};

/**
 * Production Helmet configuration
 */
const helmetProdConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Needed for React
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: [
        "'self'",
        'https://api.travelpayouts.com',
        'https://autocomplete.travelpayouts.com',
        'https://engine.hotellook.com',
        'https://suggestions.dadata.ru', // Location suggestions
        'https://places.aviasales.ru'    // Places API
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],              // Restrict <base> tag URLs
      childSrc: ["'none'"],              // Restrict web workers and nested contexts
      workerSrc: ["'self'", 'blob:'],   // Web workers
      manifestSrc: ["'self'"],           // PWA manifest
      upgradeInsecureRequests: [],
      ...(getCspReportUri().length > 0 && { reportUri: getCspReportUri() })
    }
  },

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false
  },

  // X-Frame-Options (Clickjacking protection)
  frameguard: {
    action: 'deny'
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // X-Content-Type-Options (MIME type sniffing protection)
  noSniff: true,

  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // X-XSS-Protection (Legacy XSS filter)
  xssFilter: true,

  // Cross-Origin Policies
  crossOriginEmbedderPolicy: false, // Set to true if using SharedArrayBuffer
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'same-origin' },

  // Permissions-Policy
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none'
  }
});

/**
 * Development Helmet configuration
 * Relaxed CSP for easier development
 */
const helmetDevConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:', 'http:'],
      connectSrc: ["'self'", 'http:', 'https:', 'ws:', 'wss:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hidePoweredBy: true,
  hsts: false, // Disable HSTS in development
  noSniff: true,
  xssFilter: true
});

/**
 * Permissions-Policy middleware
 * Modern replacement for Feature-Policy
 * Controls which browser features can be used
 */
export const permissionsPolicy = (req: Request, res: Response, next: NextFunction) => {
  // Restrictive permissions for production security
  const policies = [
    'accelerometer=()',           // Block accelerometer access
    'ambient-light-sensor=()',    // Block ambient light sensor
    'autoplay=()',                // Block autoplay
    'battery=()',                 // Block battery status API
    'camera=()',                  // Block camera access
    'display-capture=()',         // Block screen capture
    'document-domain=()',         // Block document.domain
    'encrypted-media=()',         // Block encrypted media
    'fullscreen=(self)',          // Allow fullscreen only for same origin
    'geolocation=(self)',         // Allow geolocation only for same origin (travel app needs it)
    'gyroscope=()',               // Block gyroscope
    'magnetometer=()',            // Block magnetometer
    'microphone=()',              // Block microphone
    'midi=()',                    // Block MIDI access
    'payment=(self)',             // Allow payment API only for same origin
    'picture-in-picture=()',      // Block picture-in-picture
    'publickey-credentials-get=(self)', // Allow WebAuthn only for same origin
    'screen-wake-lock=()',        // Block wake lock
    'sync-xhr=()',                // Block synchronous XHR
    'usb=()',                     // Block USB access
    'web-share=(self)',           // Allow Web Share API for same origin
    'xr-spatial-tracking=()'      // Block XR/VR tracking
  ];

  res.setHeader('Permissions-Policy', policies.join(', '));
  next();
};

/**
 * Expect-CT middleware
 * Certificate Transparency enforcement
 */
export const expectCT = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    const reportUri = process.env.EXPECT_CT_REPORT_URI || '';
    const maxAge = 86400; // 24 hours

    const value = reportUri
      ? `max-age=${maxAge}, enforce, report-uri="${reportUri}"`
      : `max-age=${maxAge}, enforce`;

    res.setHeader('Expect-CT', value);
  }
  next();
};

// Export appropriate config based on environment
const helmetConfig = process.env.NODE_ENV === 'production' ? helmetProdConfig : helmetDevConfig;

export default helmetConfig;
