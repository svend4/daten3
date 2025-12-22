/**
 * Centralized Configuration
 * All environment variables and configuration in one place
 */

import { getEnvVar } from './env.validator.js';

/**
 * Server Configuration
 */
export const serverConfig = {
  port: parseInt(getEnvVar('PORT', '3000'), 10),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  isProduction: getEnvVar('NODE_ENV', 'development') === 'production',
  isDevelopment: getEnvVar('NODE_ENV', 'development') === 'development',
};

/**
 * Database Configuration
 */
export const databaseConfig = {
  url: getEnvVar('DATABASE_URL'),
  redisUrl: getEnvVar('REDIS_URL', ''),
};

/**
 * JWT Configuration
 */
export const jwtConfig = {
  secret: getEnvVar('JWT_SECRET'),
  refreshSecret: getEnvVar('JWT_REFRESH_SECRET'),
  expiresIn: getEnvVar('JWT_EXPIRES_IN', '15m'),
  refreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d'),
};

/**
 * Cookie Configuration
 */
export const cookieConfig = {
  httpOnly: true,
  secure: serverConfig.isProduction,
  sameSite: serverConfig.isProduction ? ('strict' as const) : ('lax' as const),
  maxAge: {
    accessToken: 15 * 60 * 1000, // 15 minutes
    refreshToken: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  names: {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
  },
};

/**
 * CORS Configuration
 */
export const corsConfig = {
  origin: getEnvVar('FRONTEND_URL', 'http://localhost:3001').split(','),
  credentials: true,
};

/**
 * OAuth Configuration
 */
export const oauthConfig = {
  google: {
    clientId: getEnvVar('GOOGLE_CLIENT_ID', ''),
    clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET', ''),
    callbackUrl: getEnvVar('GOOGLE_CALLBACK_URL', 'http://localhost:3000/api/auth/google/callback'),
  },
};

/**
 * API Integration Configuration
 */
export const apiConfig = {
  travelpayouts: {
    token: getEnvVar('TRAVELPAYOUTS_TOKEN', ''),
    marker: getEnvVar('TRAVELPAYOUTS_MARKER', 'travelhub'),
  },
  booking: {
    apiKey: getEnvVar('BOOKING_API_KEY', ''),
  },
  skyscanner: {
    apiKey: getEnvVar('SKYSCANNER_API_KEY', ''),
  },
  amadeus: {
    apiKey: getEnvVar('AMADEUS_API_KEY', ''),
    apiSecret: getEnvVar('AMADEUS_API_SECRET', ''),
  },
};

/**
 * Rate Limiting Configuration
 */
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  strict: {
    max: 10,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  moderate: {
    max: 100,
    message: 'Too many requests, please slow down',
  },
  lenient: {
    max: 200,
    message: 'Rate limit exceeded',
  },
  veryLenient: {
    max: 500,
    message: 'Rate limit exceeded',
  },
  whitelist: getEnvVar('RATE_LIMIT_WHITELIST', '').split(',').filter(Boolean),
};

/**
 * Email Configuration
 */
export const emailConfig = {
  service: getEnvVar('EMAIL_SERVICE', 'smtp'),
  smtp: {
    host: getEnvVar('SMTP_HOST', 'smtp.gmail.com'),
    port: parseInt(getEnvVar('SMTP_PORT', '587'), 10),
    secure: getEnvVar('SMTP_SECURE', 'false') === 'true',
    user: getEnvVar('SMTP_USER', ''),
    pass: getEnvVar('SMTP_PASS', ''),
  },
  from: getEnvVar('EMAIL_FROM', 'TravelHub <noreply@travelhub.com>'),
  sendgrid: {
    apiKey: getEnvVar('SENDGRID_API_KEY', ''),
  },
};

/**
 * Payment Gateway Configuration
 */
export const paymentConfig = {
  stripe: {
    publicKey: getEnvVar('STRIPE_PUBLIC_KEY', ''),
    secretKey: getEnvVar('STRIPE_SECRET_KEY', ''),
    webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET', ''),
  },
  paypal: {
    clientId: getEnvVar('PAYPAL_CLIENT_ID', ''),
    clientSecret: getEnvVar('PAYPAL_CLIENT_SECRET', ''),
    mode: getEnvVar('PAYPAL_MODE', 'sandbox') as 'sandbox' | 'production',
  },
};

/**
 * File Storage Configuration (AWS S3)
 */
export const storageConfig = {
  aws: {
    accessKeyId: getEnvVar('AWS_ACCESS_KEY_ID', ''),
    secretAccessKey: getEnvVar('AWS_SECRET_ACCESS_KEY', ''),
    region: getEnvVar('AWS_REGION', 'us-east-1'),
    s3Bucket: getEnvVar('AWS_S3_BUCKET', 'travelhub-uploads'),
  },
  maxFileSize: parseInt(getEnvVar('MAX_FILE_SIZE', '10485760'), 10), // 10MB
};

/**
 * Affiliate Program Configuration
 */
export const affiliateConfig = {
  commission: {
    level1: parseFloat(getEnvVar('AFFILIATE_COMMISSION_LEVEL_1', '5.0')),
    level2: parseFloat(getEnvVar('AFFILIATE_COMMISSION_LEVEL_2', '2.5')),
    level3: parseFloat(getEnvVar('AFFILIATE_COMMISSION_LEVEL_3', '1.0')),
  },
  minPayout: parseFloat(getEnvVar('AFFILIATE_MIN_PAYOUT', '50.00')),
};

/**
 * Analytics Configuration
 */
export const analyticsConfig = {
  googleAnalyticsId: getEnvVar('GOOGLE_ANALYTICS_ID', ''),
  mixpanelToken: getEnvVar('MIXPANEL_TOKEN', ''),
};

/**
 * Monitoring Configuration
 */
export const monitoringConfig = {
  sentryDsn: getEnvVar('SENTRY_DSN', ''),
};

/**
 * Logging Configuration
 */
export const loggingConfig = {
  level: getEnvVar('LOG_LEVEL', 'info'),
};

/**
 * Redis Configuration
 */
export const redisConfig = {
  url: getEnvVar('REDIS_URL', ''),
  enabled: Boolean(getEnvVar('REDIS_URL', '')),
  // CSRF token TTL (24 hours)
  csrfTokenTtl: 24 * 60 * 60,
  // Cache TTL (15 minutes for search results)
  cacheTtl: {
    hotelSearch: 15 * 60,
    flightSearch: 5 * 60,
  },
};

/**
 * Export all configuration as a single object
 */
export const config = {
  server: serverConfig,
  database: databaseConfig,
  jwt: jwtConfig,
  cookie: cookieConfig,
  cors: corsConfig,
  oauth: oauthConfig,
  api: apiConfig,
  rateLimit: rateLimitConfig,
  email: emailConfig,
  payment: paymentConfig,
  storage: storageConfig,
  affiliate: affiliateConfig,
  analytics: analyticsConfig,
  monitoring: monitoringConfig,
  logging: loggingConfig,
  redis: redisConfig,
};

export default config;
