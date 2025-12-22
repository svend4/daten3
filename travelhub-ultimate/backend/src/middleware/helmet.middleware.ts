import helmet from 'helmet';

/**
 * Enhanced Helmet Middleware Configuration
 * Comprehensive security HTTP headers
 * Based on Innovation Library best practices
 */

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
        'https://engine.hotellook.com'
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
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

// Export appropriate config based on environment
const helmetConfig = process.env.NODE_ENV === 'production' ? helmetProdConfig : helmetDevConfig;

export default helmetConfig;
